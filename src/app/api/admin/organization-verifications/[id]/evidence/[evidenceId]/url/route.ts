import { NextRequest, NextResponse } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type Context = { params: Promise<{ id: string; evidenceId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { id, evidenceId } = await params;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(evidenceId)) return NextResponse.json({ error: "Unsupported request." }, { status: 404 });
  return proxyLaravelJson(request, { path: `admin/organization-verifications/${id}/evidence/${evidenceId}/url` });
}
