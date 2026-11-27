import { NextRequest } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

/** V2 Phase 6.1: listings' outbound links with their policy status (admin). */
export async function GET(request: NextRequest) {
  return proxyLaravelJson(request, { path: "admin/listing-links", includeSearch: true });
}
