import { NextRequest } from "next/server";
import { proxyPublicGet } from "@/lib/bff/public-cache";

/**
 * Public community list.
 * V2 Phase 5.3c: shared on Vercel's CDN for anonymous requests that name a country (see lib/bff/public-cache.ts).
 */
export async function GET(request: NextRequest) {
  return proxyPublicGet(request, { path: "communities", countrySensitive: true });
}
