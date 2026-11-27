import { NextRequest } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type Context = { params: Promise<{ orgSlug: string }> };

/** V2 Phase 6.3: contact actions this month across an organization's listings (?month=YYYY-MM). */
export async function GET(request: NextRequest, { params }: Context) {
  const { orgSlug } = await params;
  return proxyLaravelJson(request, {
    path: `organizations/${encodeURIComponent(orgSlug)}/interactions`,
    includeSearch: true,
  });
}
