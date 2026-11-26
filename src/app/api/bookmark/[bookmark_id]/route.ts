import { NextRequest, NextResponse } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type Context = { params: Promise<{ bookmark_id: string }> };

// DELETE /api/bookmark/{id}. V2 Phase 5.2b.
export async function DELETE(request: NextRequest, { params }: Context) {
  const { bookmark_id } = await params;
  if (!/^\d+$/.test(bookmark_id)) return NextResponse.json({ error: "Unsupported bookmark." }, { status: 404 });
  return proxyLaravelJson(request, { path: `bookmark/${bookmark_id}`, method: "DELETE" });
}
