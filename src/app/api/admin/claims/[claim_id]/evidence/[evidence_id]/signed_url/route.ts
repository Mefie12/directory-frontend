import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ claim_id: string; evidence_id: string }> },
) {
  try {
    const { claim_id, evidence_id } = await params;
    const authHeader = request.headers.get("Authorization");

    const response = await fetch(
      `${API_BASE_URL}/api/admin/claims/${claim_id}/evidence/${evidence_id}/signed_url`,
      {
        headers: {
          Accept: "application/json",
          ...(authHeader && { Authorization: authHeader }),
        },
        cache: "no-store",
      },
    );

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("admin/claims evidence signed_url GET error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
