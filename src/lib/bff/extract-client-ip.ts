import { NextRequest } from "next/server";

/**
 * Extracts the real client IP from proxy/CDN headers on an incoming BFF request.
 *
 * Header priority (first non-null wins):
 *   1. x-forwarded-for  — ngrok, Vercel, Cloudflare, most reverse proxies
 *   2. x-real-ip        — nginx and some CDNs
 *   3. cf-connecting-ip — Cloudflare specifically
 *
 * x-forwarded-for can be a comma-separated list when multiple proxies are in the chain.
 * The first entry is the original client IP.
 *
 * Returns null if no header is present (Laravel falls back to request()->ip() which
 * will resolve to the Next.js server IP and geo will return null gracefully).
 */
export function extractClientIp(request: NextRequest): string | null {
  const forwarded =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip");
  return forwarded ? forwarded.split(",")[0].trim() : null;
}
