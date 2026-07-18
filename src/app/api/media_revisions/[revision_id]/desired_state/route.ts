import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ revision_id: string }> },
) {
  try {
    const { revision_id } = await params;
    const authHeader = request.headers.get("Authorization");
    const body = await request.json().catch(() => ({}));

    const response = await fetch(
      `${API_BASE_URL}/api/media_revisions/${revision_id}/desired_state`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(authHeader && { Authorization: authHeader }),
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("media_revisions desired_state PATCH error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
