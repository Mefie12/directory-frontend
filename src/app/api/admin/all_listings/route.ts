import { NextRequest } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

// V2 Phase 5.2b: the admin listing tabs go through the proxy so they work with the cookie session.
export const GET = (request: NextRequest) =>
  proxyLaravelJson(request, { path: "admin/all_listings", includeSearch: true });
