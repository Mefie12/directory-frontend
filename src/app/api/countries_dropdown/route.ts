import { NextRequest } from "next/server";
import { proxyPublicGet } from "@/lib/bff/public-cache";

/**
 * Countries that have approved listings. Only these parameters are forwarded; a request carrying anything else
 * is never shared (V2 Phase 5.3c, lib/bff/public-cache.ts).
 */
const ALLOWED_PARAMS = new Set(["type", "category_id", "category_slug"]);

export async function GET(request: NextRequest) {
  return proxyPublicGet(request, { path: "countries_dropdown", allowedParams: ALLOWED_PARAMS });
}
