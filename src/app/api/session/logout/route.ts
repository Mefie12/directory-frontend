import { NextRequest, NextResponse } from "next/server";
import { authCookieEnabled, readSessionToken } from "@/lib/auth-cookie";
import { API_BASE_URL, clearSessionCookies } from "@/lib/bff/session-cookie";

/** POST /api/session/logout: revokes the Laravel token (best effort) and always clears the cookies (V2 Phase 5.2). */
export async function POST(request: NextRequest) {
  if (!authCookieEnabled()) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const token = readSessionToken((name) => request.cookies.get(name)?.value);
  const authorization = request.headers.get("authorization") ?? (token ? `Bearer ${token}` : null);

  if (authorization) {
    try {
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: authorization },
        cache: "no-store",
      });
    } catch (error) {
      console.error("session logout upstream error:", error);
    }
  }

  const response = NextResponse.json({ message: "Signed out." });
  clearSessionCookies(response, request);
  return response;
}
