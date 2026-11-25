import { NextRequest, NextResponse } from "next/server";
import { authCookieEnabled } from "@/lib/auth-cookie";
import { API_BASE_URL, finishSession } from "@/lib/bff/session-cookie";

/** POST /api/session/login: signs in through Laravel and sets the httpOnly session cookie (V2 Phase 5.2). */
export async function POST(request: NextRequest) {
  if (!authCookieEnabled()) return NextResponse.json({ message: "Not found." }, { status: 404 });

  try {
    const upstream = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: await request.text(),
      cache: "no-store",
    });
    return await finishSession(request, upstream);
  } catch (error) {
    console.error("session login error:", error);
    return NextResponse.json({ message: "Could not reach the sign-in service." }, { status: 502 });
  }
}
