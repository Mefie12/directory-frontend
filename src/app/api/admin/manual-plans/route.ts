import { NextRequest } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

// Manually billed plans list. Laravel enforces the `manage-billing` permission.
export async function GET(request: NextRequest) {
  return proxyLaravelJson(request, {
    path: "admin/manual-plans",
    includeSearch: true,
  });
}
