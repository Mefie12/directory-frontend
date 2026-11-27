/**
 * V2 Phase 6.3: tell the backend a visitor used one of a listing's contact actions
 * (md files/V2-phase6-listing-actions-cta-spec.md §4.5).
 *
 * Sent straight to Laravel, like the public listing request itself: going through a
 * Next.js route would make every visitor look like the Next.js server, which breaks
 * per-visitor dedupe, the per-IP limit, bot filtering and the device type.
 *
 * Fire and forget: `keepalive` lets the request finish after the page navigates away,
 * the visitor's click is never delayed, and any failure is ignored. Without a token
 * the body is form-encoded so the browser sends it without a CORS preflight.
 */
import type { ListingActionKind } from "@/lib/directory/listing-actions";
import { getAuthToken } from "@/lib/client-auth";
import { COOKIE_SESSION_SENTINEL } from "@/lib/auth-cookie";

export type ListingInteractionPlacement = "bar" | "sticky" | "card" | "sidebar" | "map" | "event";

export function trackListingAction(slug: string, action: ListingActionKind, placement: ListingInteractionPlacement): void {
  if (typeof window === "undefined" || !slug) return;

  const api = (process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk").replace(/\/$/, "");
  const token = getAuthToken();
  // A signed-in manager is recognised from their token and not counted. The cookie
  // session can't be sent to Laravel from here, so those visitors go unrecognised.
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token && token !== COOKIE_SESSION_SENTINEL) headers.Authorization = `Bearer ${token}`;

  try {
    void fetch(`${api}/api/listing/${encodeURIComponent(slug)}/interactions`, {
      method: "POST",
      body: new URLSearchParams({ action, placement }),
      headers,
      keepalive: true,
      credentials: "omit",
    }).catch(() => undefined);
  } catch {
    // Never let counting get in the way of the visitor.
  }
}
