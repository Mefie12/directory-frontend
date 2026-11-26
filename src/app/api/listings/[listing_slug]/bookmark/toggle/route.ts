import { NextRequest } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type Context = { params: Promise<{ listing_slug: string }> };

// POST /api/listings/{slug}/bookmark/toggle. V2 Phase 5.2b.
export async function POST(request: NextRequest, { params }: Context) {
  const { listing_slug } = await params;
  return proxyLaravelJson(request, { path: `listings/${encodeURIComponent(listing_slug)}/bookmark/toggle`, method: "POST" });
}
