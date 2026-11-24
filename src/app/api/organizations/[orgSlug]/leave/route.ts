import { NextRequest } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type Context = { params: Promise<{ orgSlug: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { orgSlug } = await params;
  return proxyLaravelJson(request, { path: `organizations/${encodeURIComponent(orgSlug)}/leave`, method: "POST" });
}
