import { NextRequest, NextResponse } from "next/server";
import { getCached, setCached } from "@/lib/server-cache";

const TTL = 5 * 60 * 1000; // 5 minutes — views data doesn't need real-time accuracy

const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listing_slug: string }> },
) {
  try {
    const { listing_slug } = await params;
    const authHeader = request.headers.get("Authorization");

    const cacheKey = `listing_views:${listing_slug}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" },
      });
    }

    const response = await fetch(
      `${API_BASE_URL}/api/listing/${listing_slug}/views`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        next: { revalidate: 300 },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch listing views" },
        { status: response.status },
      );
    }

    const data = await response.json();

    setCached(cacheKey, data, TTL);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("listing views proxy error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
