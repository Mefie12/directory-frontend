import { NextRequest } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

/** V2 Phase 6.1: the outbound-link domain blocklist (admin). */
export async function GET(request: NextRequest) {
  return proxyLaravelJson(request, { path: "admin/blocked-link-domains", includeSearch: true });
}

export async function POST(request: NextRequest) {
  return proxyLaravelJson(request, { path: "admin/blocked-link-domains", method: "POST" });
}
