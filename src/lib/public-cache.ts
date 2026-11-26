/**
 * Pure rules for sharing public directory responses on Vercel's CDN (V2 Phase 5.3c,
 * md files/V2-phase5-page-caching-spec.md). No Next.js imports, so scripts/verify-public-cache.mjs
 * can exercise it directly.
 *
 * Vercel's CDN keys on the request URL (plus Accept and Accept-Encoding and any Vary header),
 * NOT on cookies and not on the visitor's IP. A response is therefore shareable only if it is a
 * function of the URL alone. Laravel decides eligibility (anonymous, whitelisted route, allowed
 * params, explicit country, status 200) and says so with `Cache-Control: public, s-maxage=...`;
 * this module turns that decision into the headers Vercel understands.
 */

export type SharedCachePolicy = { sMaxAge: number; swr: number };

/** Reads s-maxage and stale-while-revalidate from Laravel's Cache-Control. Null unless it is `public` with an s-maxage. */
export function parseSharedPolicy(cacheControl: string | null): SharedCachePolicy | null {
  if (!cacheControl) return null;
  const value = cacheControl.toLowerCase();
  if (!/\bpublic\b/.test(value) || /\b(private|no-store|no-cache)\b/.test(value)) return null;

  const sMaxAge = /s-maxage=(\d+)/.exec(value);
  if (!sMaxAge) return null;
  const seconds = Number(sMaxAge[1]);
  if (!Number.isFinite(seconds) || seconds < 1) return null;

  const swr = /stale-while-revalidate=(\d+)/.exec(value);
  return { sMaxAge: seconds, swr: swr ? Number(swr[1]) : 0 };
}

/** Never shared: errors, anything personalised, anything Laravel did not mark public. */
export const PRIVATE_HEADERS: Record<string, string> = { "Cache-Control": "private, no-store" };

/**
 * Browsers always revalidate (max-age=0) so a moderation change is never held in a browser cache;
 * the CDN copy is controlled by the Vercel-specific header, which Vercel does not send on to the browser.
 */
export function sharedHeaders(policy: SharedCachePolicy): Record<string, string> {
  return {
    "Cache-Control": "public, max-age=0, must-revalidate",
    "Vercel-CDN-Cache-Control": `max-age=${policy.sMaxAge}${policy.swr > 0 ? `, stale-while-revalidate=${policy.swr}` : ""}`,
  };
}

/** Decides the response headers from what Laravel answered and what we know about the request. */
export function responseHeadersFor(input: {
  status: number;
  upstreamCacheControl: string | null;
  authenticated: boolean;
  cacheable: boolean;
}): Record<string, string> {
  if (input.status !== 200 || input.authenticated || !input.cacheable) return PRIVATE_HEADERS;
  const policy = parseSharedPolicy(input.upstreamCacheControl);
  return policy ? sharedHeaders(policy) : PRIVATE_HEADERS;
}
