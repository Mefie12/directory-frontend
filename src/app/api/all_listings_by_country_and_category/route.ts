import { NextRequest, NextResponse } from "next/server";
import { getCached, setCached } from "@/lib/server-cache";

const TTL = 30 * 1000; // 30 seconds

const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backendUrl = new URL(
      `${API_BASE_URL}/api/all_listings_by_country_and_category`,
    );

    searchParams.forEach((value, key) => {
      backendUrl.searchParams.set(key, value);
    });

    const cacheKey = `all_listings_by_country:${searchParams.toString()}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=10" },
      });
    }

    const authHeader = request.headers.get("Authorization");

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      next: { revalidate: 30 },
    });

    const rawText = await response.text();
    let data: unknown;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      return NextResponse.json(
        {
          message: "Upstream returned non-JSON response",
          upstreamStatus: response.status,
          upstreamBody: rawText.slice(0, 500),
          backendUrl: backendUrl.toString(),
        },
        { status: 502 },
      );
    }

    if (!response.ok) {
      const maybeMessage =
        typeof data === "object" && data !== null && "message" in data
          ? (data as { message?: string }).message
          : undefined;
      return NextResponse.json(
        { message: maybeMessage || "Failed to fetch all listings by country and category" },
        { status: response.status },
      );
    }

    setCached(cacheKey, data, TTL);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=10" },
    });
  } catch (error) {
    console.error("all_listings_by_country_and_category proxy error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
