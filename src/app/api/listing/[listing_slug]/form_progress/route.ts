import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export async function PATCH(request: NextRequest, context: { params: Promise<{ listing_slug: string }> }) {
  const { listing_slug } = await context.params;
  const response = await fetch(`${API_BASE_URL}/api/listing/${listing_slug}/form_progress`, {
    method: "PATCH",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: request.headers.get("authorization") ?? "" },
    body: await request.text(),
  });
  return NextResponse.json(await response.json().catch(() => ({})), { status: response.status });
}
