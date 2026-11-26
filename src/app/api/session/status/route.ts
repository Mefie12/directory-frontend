import { NextResponse } from "next/server";
import { authCookieEnabled } from "@/lib/auth-cookie";

/** GET /api/session/status: tells the browser which sign-in mode the server is in (V2 Phase 5.2c). Public, no secrets. */
export function GET() {
  return NextResponse.json({ cookie: authCookieEnabled() }, { headers: { "Cache-Control": "no-store" } });
}
