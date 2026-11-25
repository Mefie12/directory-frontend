import { NextRequest } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type Context = { params: Promise<{ token: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { token } = await params;
  return proxyLaravelJson(request, { path: `invites/${encodeURIComponent(token)}/accept`, method: "POST" });
}
