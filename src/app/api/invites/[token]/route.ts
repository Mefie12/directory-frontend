import { NextRequest } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type Context = { params: Promise<{ token: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { token } = await params;
  return proxyLaravelJson(request, { path: `invites/${encodeURIComponent(token)}` });
}
