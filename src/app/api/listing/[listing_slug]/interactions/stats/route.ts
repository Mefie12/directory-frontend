import { NextRequest } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type Context = { params: Promise<{ listing_slug: string }> };

/** V2 Phase 6.3: a listing's contact-action totals for its team (?month=YYYY-MM). */
export async function GET(request: NextRequest, { params }: Context) {
  const { listing_slug } = await params;
  return proxyLaravelJson(request, {
    path: `listing/${encodeURIComponent(listing_slug)}/interactions/stats`,
    includeSearch: true,
  });
}
