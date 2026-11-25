import { NextRequest, NextResponse } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type RouteContext = { params: Promise<{ user_id: string }> };

// Grant (POST) or revoke (DELETE) super admin. Laravel enforces super-admin-only,
// the acting user's password, the reason and the last-super-admin rule.
async function forward(request: NextRequest, context: RouteContext, method: "POST" | "DELETE") {
  const { user_id } = await context.params;
  if (!/^\d+$/.test(user_id)) {
    return NextResponse.json({ error: "Unsupported user." }, { status: 404 });
  }
  return proxyLaravelJson(request, { path: `admin/team/${user_id}/superadmin`, method });
}

export const POST = (request: NextRequest, context: RouteContext) => forward(request, context, "POST");
export const DELETE = (request: NextRequest, context: RouteContext) => forward(request, context, "DELETE");
