"use client";

import { COOKIE_SESSION_SENTINEL, hasSignedInMarker } from "@/lib/auth-cookie";

/**
 * The browser-side view of the session (V2 Phase 5.2c).
 *
 * Legacy mode (AUTH_COOKIE_ENABLED off): the token is in localStorage, as before.
 * Cookie mode: the real token is in an httpOnly cookie the browser cannot read; this returns
 * a sentinel while the signed-in marker cookie exists, so existing `if (!token)` guards and
 * `Bearer ${token}` builders keep working. The proxy swaps the sentinel for the real token.
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("authToken");
  if (stored) return stored;
  return hasSignedInMarker(document.cookie) ? COOKIE_SESSION_SENTINEL : null;
}

export type SessionStep = "login" | "register" | "verify" | "google" | "token";

export type SessionResult =
  | { mode: "legacy" }
  | { mode: "cookie"; ok: boolean; status: number; data: Record<string, unknown> };

/**
 * Starts or advances a session through the proxy's session routes. A 404 means the server is
 * not in cookie mode, so the caller falls back to its legacy direct flow.
 */
export async function sessionRequest(step: SessionStep, body: unknown): Promise<SessionResult> {
  const response = await fetch(`/api/session/${step}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  });
  if (response.status === 404) return { mode: "legacy" };

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { mode: "cookie", ok: response.ok, status: response.status, data };
}

let cookieModeCache: boolean | null = null;

/** Whether the server is in cookie mode. Cached for the page's lifetime; false if the probe fails. */
export async function isCookieMode(): Promise<boolean> {
  if (cookieModeCache !== null) return cookieModeCache;
  try {
    const response = await fetch("/api/session/status", { cache: "no-store" });
    const data = (await response.json()) as { cookie?: boolean };
    cookieModeCache = data.cookie === true;
  } catch {
    cookieModeCache = false;
  }
  return cookieModeCache;
}

/** Best-effort: clears the httpOnly cookie and revokes the Laravel token. Only meaningful in cookie mode. */
export async function endCookieSession(): Promise<void> {
  try {
    await fetch("/api/session/logout", { method: "POST", cache: "no-store" });
  } catch {
    // The caller clears local state regardless.
  }
}
