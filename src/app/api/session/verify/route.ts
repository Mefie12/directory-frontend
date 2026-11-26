import { NextRequest, NextResponse } from "next/server";
import { authCookieEnabled } from "@/lib/auth-cookie";
import { API_BASE_URL, finishSession } from "@/lib/bff/session-cookie";

/** POST /api/session/verify: email OTP verification; the fresh token replaces the cookie (V2 Phase 5.2). */
export async function POST(request: NextRequest) {
  if (!authCookieEnabled()) return NextResponse.json({ message: "Not found." }, { status: 404 });

  try {
    const authorization = request.headers.get("authorization");
    const upstream = await fetch(`${API_BASE_URL}/api/verify_email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: await request.text(),
      cache: "no-store",
    });
    return await finishSession(request, upstream);
  } catch (error) {
    console.error("session verify error:", error);
    return NextResponse.json({ message: "Could not reach the verification service." }, { status: 502 });
  }
}
