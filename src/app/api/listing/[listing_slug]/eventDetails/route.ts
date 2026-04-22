import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

async function handleEventDetails(
  request: NextRequest,
  listing_slug: string,
  method: "POST" | "PATCH",
) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get("Authorization");

    const response = await fetch(
      `${API_BASE_URL}/api/listing/${listing_slug}/eventDetails`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(body),
      },
    );

    const rawText = await response.text();
    let data: unknown;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      return NextResponse.json(
        { message: "Upstream returned non-JSON response", upstreamBody: rawText.slice(0, 500) },
        { status: 502 },
      );
    }

    if (!response.ok) {
      const maybeMessage =
        typeof data === "object" && data !== null && "message" in data
          ? (data as { message?: string }).message
          : undefined;
      return NextResponse.json(
        { message: maybeMessage || "Failed to save event details" },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("eventDetails proxy error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listing_slug: string }> },
) {
  const { listing_slug } = await params;
  return handleEventDetails(request, listing_slug, "POST");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listing_slug: string }> },
) {
  const { listing_slug } = await params;
  return handleEventDetails(request, listing_slug, "PATCH");
}
