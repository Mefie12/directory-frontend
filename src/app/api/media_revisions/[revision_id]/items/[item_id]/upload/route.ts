import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ revision_id: string; item_id: string }> },
) {
  try {
    const { revision_id, item_id } = await params;
    const authHeader = request.headers.get("Authorization");
    const contentType = request.headers.get("Content-Type") || "";
    const body = await request.arrayBuffer();

    const response = await fetch(
      `${API_BASE_URL}/api/media_revisions/${revision_id}/items/${item_id}/upload`,
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
    console.error("media_revisions item upload POST error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
