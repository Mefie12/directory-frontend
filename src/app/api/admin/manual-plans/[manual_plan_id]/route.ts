import { NextRequest, NextResponse } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type RouteContext = {
  params: Promise<{ manual_plan_id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { manual_plan_id } = await context.params;
  if (!/^\d+$/.test(manual_plan_id)) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  return proxyLaravelJson(request, {
    path: `admin/manual-plans/${manual_plan_id}`,
    method: "PATCH",
  });
}
