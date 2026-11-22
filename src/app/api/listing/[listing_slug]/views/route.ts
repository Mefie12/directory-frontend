import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCached, setCached } from "@/lib/server-cache";

const TTL = 5 * 60 * 1000; // 5 minutes — views data doesn't need real-time accuracy

const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

// Listing statistics are private management data. They must never be shared
// across users, so responses are cached per caller and marked `private`.
const PRIVATE_CACHE_HEADERS = {
  "Cache-Control": "private, max-age=300",
  Vary: "Authorization",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listing_slug: string }> },
) {
  try {
    const { listing_slug } = await params;
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    }

    // Key by a hash of the credential (never the raw token) so one user's
    // cached statistics can never be served to another caller.
    const callerKey = createHash("sha256").update(authHeader).digest("hex");
    const cacheKey = `listing_views:${listing_slug}:${callerKey}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: PRIVATE_CACHE_HEADERS });
    }

    const response = await fetch(
      `${API_BASE_URL}/api/listing/${listing_slug}/views`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: authHeader,
        },
        cache: "no-store",
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
    return NextResponse.json(data, { headers: PRIVATE_CACHE_HEADERS });
  } catch (error) {
    console.error("listing views proxy error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
