import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listing_slug: string }> },
) {
  try {
    const { listing_slug } = await params;
    const authHeader = request.headers.get("Authorization");
    const contentType = request.headers.get("Content-Type") || "";
    const body = await request.arrayBuffer();

    const response = await fetch(
      `${API_BASE_URL}/api/listing/${listing_slug}/claims/document`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": contentType,
          ...(authHeader && { Authorization: authHeader }),
        },
        body,
      },
    );

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("claims/document POST error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
