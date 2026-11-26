import { NextRequest, NextResponse } from "next/server";
import { authCookieEnabled, stripTokens } from "@/lib/auth-cookie";
import { API_BASE_URL, setSessionCookies } from "@/lib/bff/session-cookie";

/**
 * POST /api/session/token {token}: turns a finished session token handed to the browser
 * (the Google redirect puts it in the URL) into the httpOnly cookie. The token is checked
 * against Laravel first; an invalid one never becomes a cookie (V2 Phase 5.2c).
 */
export async function POST(request: NextRequest) {
  if (!authCookieEnabled()) return NextResponse.json({ message: "Not found." }, { status: 404 });

  try {
    const body = (await request.json().catch(() => ({}))) as { token?: unknown };
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token || token.length > 255) return NextResponse.json({ message: "Invalid session token." }, { status: 422 });

    const upstream = await fetch(`${API_BASE_URL}/api/user`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!upstream.ok) return NextResponse.json({ message: "Invalid session token." }, { status: 401 });

    const response = NextResponse.json(
      { ...(stripTokens(await upstream.json().catch(() => ({}))) as object), session: "cookie" },
      { headers: { "Cache-Control": "private, no-store" } },
    );
    setSessionCookies(response, request, token);
    return response;
  } catch (error) {
    console.error("session token error:", error);
    return NextResponse.json({ message: "Could not reach the sign-in service." }, { status: 502 });
  }
}
