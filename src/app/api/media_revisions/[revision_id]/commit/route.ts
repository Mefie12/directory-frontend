import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ revision_id: string }> },
) {
  try {
    const { revision_id } = await params;
    const authHeader = request.headers.get("Authorization");

    const response = await fetch(`${API_BASE_URL}/api/media_revisions/${revision_id}/commit`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("media_revisions commit POST error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
