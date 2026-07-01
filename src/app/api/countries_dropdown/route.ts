import { NextResponse } from "next/server";
import { getCached, setCached } from "@/lib/server-cache";

const TTL = 60 * 60 * 1000; // 1 hour
const CACHE_KEY = "countries_dropdown";

const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

export async function GET() {
  try {
    const cached = getCached(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached, {
        status: 200,
        headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=300" },
      });
    }

    const response = await fetch(`${API_BASE_URL}/api/countries_dropdown`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      // Countries almost never change — cache for 1 hour
      next: { revalidate: 3600 },
    });

    const rawText = await response.text();
    let data: unknown;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      return NextResponse.json(
        { message: "Upstream returned non-JSON response" },
        { status: 502 },
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to fetch countries" },
        { status: response.status },
      );
    }

    setCached(CACHE_KEY, data, TTL);
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("countries_dropdown proxy error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
