import { NextRequest } from "next/server";
import { proxyPublicGet } from "@/lib/bff/public-cache";

/**
 * Business categories with listings in the visitor's country.
 * V2 Phase 5.3c: shared on Vercel's CDN for anonymous requests that name a country (see lib/bff/public-cache.ts).
 */
export async function GET(request: NextRequest) {
  return proxyPublicGet(request, { path: "business_categories", countrySensitive: true });
}
