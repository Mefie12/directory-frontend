import { NextRequest, NextResponse } from "next/server";
import {
  authCookieEnabled,
  csrfAllowed,
  readSessionToken,
} from "@/lib/auth-cookie";

/**
 * V2 Phase 5.2a: the one seam that makes the httpOnly cookie work for every proxy route.
 *
 * With AUTH_COOKIE_ENABLED on, an /api request that has the session cookie but no
 * Authorization header gets `Authorization: Bearer <cookie>` added before it reaches the
 * route handler, so the 100+ routes that forward the header need no change. An explicit
 * header always wins (transition). State-changing requests that rely on the cookie must
 * carry a same-site Origin (CSRF). With the flag off this does nothing.
 */
export function proxy(request: NextRequest) {
  if (!authCookieEnabled()) return NextResponse.next();

  const isSessionRoute = request.nextUrl.pathname.startsWith("/api/session/");
  const cookieToken = readSessionToken((name) => request.cookies.get(name)?.value);
  const hasHeader = request.headers.has("authorization");
  const usesCookie = !hasHeader && cookieToken !== null;

  const allowed = csrfAllowed({
    method: request.method,
    origin: request.headers.get("origin"),
    referer: request.headers.get("referer"),
    host: request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
    usesCookie,
    isSessionRoute,
  });
  if (!allowed) {
    return NextResponse.json({ message: "Cross-site request blocked." }, { status: 403 });
  }

  if (usesCookie) {
    const headers = new Headers(request.headers);
    headers.set("authorization", `Bearer ${cookieToken}`);
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
