import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export async function POST(request: NextRequest, context: { params: Promise<{ listing_slug: string }> }) {
  const { listing_slug } = await context.params;
  const response = await fetch(`${API_BASE_URL}/api/listing/${listing_slug}/resubmit`, {
    method: "POST",
    headers: { Accept: "application/json", Authorization: request.headers.get("authorization") ?? "" },
  });
  return NextResponse.json(await response.json().catch(() => ({})), { status: response.status });
}
