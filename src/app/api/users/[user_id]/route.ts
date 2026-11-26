import { NextRequest, NextResponse } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type Context = { params: Promise<{ user_id: string }> };

// GET /api/users/{id}: user detail (Laravel enforces who may read it). V2 Phase 5.2b.
export async function GET(request: NextRequest, { params }: Context) {
  const { user_id } = await params;
  if (!/^\d+$/.test(user_id)) return NextResponse.json({ error: "Unsupported user." }, { status: 404 });
  return proxyLaravelJson(request, { path: `users/${user_id}` });
}
