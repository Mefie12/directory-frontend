import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk").replace(/\/$/, "");

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ listing_slug: string }> }) {
  const { listing_slug } = await params;
  const response = await fetch(`${API_BASE_URL}/api/admin/listings/${listing_slug}/restore`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...(request.headers.get("Authorization") && { Authorization: request.headers.get("Authorization")! }) },
    body: JSON.stringify(await request.json()),
  });
  return NextResponse.json(await response.json().catch(() => ({})), { status: response.status });
}
