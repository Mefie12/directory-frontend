import { NextRequest, NextResponse } from "next/server";
import { authCookieEnabled } from "@/lib/auth-cookie";
import { API_BASE_URL, finishSession } from "@/lib/bff/session-cookie";

/**
 * POST /api/session/google {code, state?, scope?}: exchanges the one-time Google code
 * through Laravel and sets the httpOnly session cookie (V2 Phase 5.2).
 */
export async function POST(request: NextRequest) {
  if (!authCookieEnabled()) return NextResponse.json({ message: "Not found." }, { status: 404 });

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const url = new URL(`${API_BASE_URL}/api/auth/google/callback`);
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string") url.searchParams.set(key, value);
    }
    if (!url.searchParams.get("code")) {
      return NextResponse.json({ message: "Google didn't return a sign-in code." }, { status: 422 });
    }

    const upstream = await fetch(url.toString(), { headers: { Accept: "application/json" }, cache: "no-store" });
    return await finishSession(request, upstream);
  } catch (error) {
    console.error("session google error:", error);
    return NextResponse.json({ message: "Could not reach the sign-in service." }, { status: 502 });
  }
}
