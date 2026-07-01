import { NextRequest, NextResponse } from "next/server";
import { extractClientIp } from "@/lib/bff/extract-client-ip";
import { getCached, setCached } from "@/lib/server-cache";

const TTL = 5 * 60 * 1000; // 5 minutes

const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backendUrl = new URL(`${API_BASE_URL}/api/business_categories`);

    const cacheKey = `business_categories:${searchParams.toString()}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" },
      });
    }

    searchParams.forEach((value, key) => {
      backendUrl.searchParams.set(key, value);
    });

    // Forward real client IP so the backend can geo-detect when no ?country= is present.
    const clientIp = extractClientIp(request);
    if (clientIp) backendUrl.searchParams.set("ip_address", clientIp);

    const authHeader = request.headers.get("Authorization");

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      next: { revalidate: 300 },
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
        { message: maybeMessage || "Failed to fetch business categories" },
        { status: response.status },
      );
    }

    setCached(cacheKey, data, TTL);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("business_categories proxy error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
