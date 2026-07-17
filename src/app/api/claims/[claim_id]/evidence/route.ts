import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ claim_id: string }> },
) {
  try {
    const { claim_id } = await params;
    const authHeader = request.headers.get("Authorization");
    const contentType = request.headers.get("Content-Type") || "";
    const body = await request.arrayBuffer();

    const response = await fetch(`${API_BASE_URL}/api/claims/${claim_id}/evidence`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": contentType,
        ...(authHeader && { Authorization: authHeader }),
      },
      body,
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("claims/[claim_id]/evidence POST error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
