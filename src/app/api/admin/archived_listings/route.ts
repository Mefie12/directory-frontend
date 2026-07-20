import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk").replace(/\/$/, "");

export async function GET(request: NextRequest) {
  const response = await fetch(`${API_BASE_URL}/api/admin/archived_listings?${request.nextUrl.searchParams.toString()}`, {
    headers: { Accept: "application/json", ...(request.headers.get("Authorization") && { Authorization: request.headers.get("Authorization")! }) },
    cache: "no-store",
  });
  return NextResponse.json(await response.json().catch(() => ({})), { status: response.status });
}
