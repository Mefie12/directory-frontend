import { NextRequest, NextResponse } from "next/server";
import {
  MARKER_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  isSecureRequest,
  sessionCookieName,
  stripTokens,
  tokenFromBody,
} from "@/lib/auth-cookie";

export const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

function secure(request: NextRequest): boolean {
  return isSecureRequest(request.nextUrl.protocol, request.headers.get("x-forwarded-proto"));
}

export function setSessionCookies(response: NextResponse, request: NextRequest, token: string): void {
  const isSecure = secure(request);
  response.cookies.set(sessionCookieName(isSecure), token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  // Not secret and readable by scripts: only says that a session exists.
  response.cookies.set(MARKER_COOKIE, "1", {
    httpOnly: false,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookies(response: NextResponse, request: NextRequest): void {
  const isSecure = secure(request);
  for (const [name, httpOnly] of [[sessionCookieName(isSecure), true], [MARKER_COOKIE, false]] as const) {
    response.cookies.set(name, "", { httpOnly, secure: isSecure, sameSite: "lax", path: "/", maxAge: 0 });
  }
}

/**
 * Turns a successful Laravel sign-in response into a cookie session: the token goes into
 * the httpOnly cookie and is removed from the body the browser receives.
 */
export async function finishSession(request: NextRequest, upstream: Response): Promise<NextResponse> {
  const raw = await upstream.text();
  let data: unknown = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    return NextResponse.json({ message: "The sign-in service returned an invalid response." }, { status: 502 });
  }

  const token = upstream.ok ? tokenFromBody(data) : null;
  const response = NextResponse.json(
    upstream.ok && token ? { ...(stripTokens(data) as object), session: "cookie" } : stripTokens(data),
    { status: upstream.status, headers: { "Cache-Control": "private, no-store" } },
  );
  if (token) setSessionCookies(response, request, token);

  return response;
}
