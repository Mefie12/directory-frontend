import { NextRequest } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

// Everyone with a platform role. Laravel enforces who may read it.
export async function GET(request: NextRequest) {
  return proxyLaravelJson(request, { path: "admin/team" });
}
