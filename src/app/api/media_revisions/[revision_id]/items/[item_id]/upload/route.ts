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
    const body = await request.formData();

    const response = await fetch(
      `${API_BASE_URL}/api/media_revisions/${revision_id}/items/${item_id}/upload`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          ...(authHeader && { Authorization: authHeader }),
        },
        body,
      },
    );

    const responseText = await response.text();
    let data: unknown;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = {
        message: response.ok
          ? "Upload completed."
          : `Media upload failed with status ${response.status}.`,
      };
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("media_revisions item upload POST error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
