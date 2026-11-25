import { NextRequest } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type Context = { params: Promise<{ listing_slug: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { listing_slug } = await params;
  return proxyLaravelJson(request, { path: `listing/${encodeURIComponent(listing_slug)}/pending_review` });
}
