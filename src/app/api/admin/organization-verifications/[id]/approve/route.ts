import { NextRequest, NextResponse } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Unsupported request." }, { status: 404 });
  return proxyLaravelJson(request, { path: `admin/organization-verifications/${id}/approve`, method: "POST" });
}
