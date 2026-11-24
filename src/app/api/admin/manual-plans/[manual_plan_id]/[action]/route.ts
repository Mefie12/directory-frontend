import { NextRequest, NextResponse } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type RouteContext = {
  params: Promise<{ manual_plan_id: string; action: string }>;
};

// Only these lifecycle actions exist on the backend; anything else is a 404 here
// so the BFF never forwards an arbitrary path.
const ALLOWED_ACTIONS = new Set(["extend", "replace", "revoke", "review"]);

export async function POST(request: NextRequest, context: RouteContext) {
  const { manual_plan_id, action } = await context.params;

  if (!/^\d+$/.test(manual_plan_id) || !ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: "Unsupported plan action." }, { status: 404 });
  }

  return proxyLaravelJson(request, {
    path: `admin/manual-plans/${manual_plan_id}/${action}`,
    method: "POST",
  });
}
