import { NextRequest } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type Context = { params: Promise<{ revisionId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { revisionId } = await params;
  return proxyLaravelJson(request, { path: `admin/sensitive_revisions/${encodeURIComponent(revisionId)}/decision`, method: "PATCH" });
}
