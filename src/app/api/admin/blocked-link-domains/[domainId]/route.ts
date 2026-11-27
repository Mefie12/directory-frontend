import { NextRequest, NextResponse } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type RouteContext = { params: Promise<{ domainId: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { domainId } = await context.params;
  if (!/^\d+$/.test(domainId)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return proxyLaravelJson(request, { path: `admin/blocked-link-domains/${domainId}`, method: "DELETE" });
}
