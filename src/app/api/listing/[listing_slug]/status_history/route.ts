import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://me-fie.co.uk"
).replace(/\/$/, "");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listing_slug: string }> },
) {
  try {
    const { listing_slug } = await params;
    const authHeader = request.headers.get("Authorization");
    const response = await fetch(
      `${API_BASE_URL}/api/listing/${listing_slug}/status_history`,
      {
        headers: {
          Accept: "application/json",
          ...(authHeader && { Authorization: authHeader }),
        },
        cache: "no-store",
      },
    );
    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Error fetching listing status history:", error);
    return NextResponse.json(
      { message: "Failed to fetch listing status history" },
      { status: 500 },
    );
  }
}
