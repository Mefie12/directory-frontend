import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export async function PATCH(request: NextRequest, context: { params: Promise<{ notification_id: string }> }) {
  const { notification_id } = await context.params;
  const response = await fetch(`${API_BASE_URL}/api/notifications/${notification_id}/read`, {
    method: "PATCH",
    headers: { Accept: "application/json", Authorization: request.headers.get("authorization") ?? "" },
  });
  return NextResponse.json(await response.json().catch(() => ({})), { status: response.status });
}
