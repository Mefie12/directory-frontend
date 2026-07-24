import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  const response = await fetch(`${API_BASE_URL}/api/notifications`, {
    headers: { Accept: "application/json", Authorization: request.headers.get("authorization") ?? "" },
    cache: "no-store",
  });
  return NextResponse.json(await response.json().catch(() => ({})), { status: response.status });
}
