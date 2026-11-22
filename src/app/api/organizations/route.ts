import { NextRequest } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

// V2 Phase 1: the caller's organizations / create one. 404 from Laravel while
// ORGANIZATIONS_ENABLED is off.
export async function GET(request: NextRequest) {
  return proxyLaravelJson(request, { path: "organizations" });
}

export async function POST(request: NextRequest) {
  return proxyLaravelJson(request, { path: "organizations", method: "POST" });
}
