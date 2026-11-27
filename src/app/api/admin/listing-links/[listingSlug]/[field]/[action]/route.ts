import { NextRequest, NextResponse } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type RouteContext = { params: Promise<{ listingSlug: string; field: string; action: string }> };

// Only these exist on the backend; anything else is a 404 here so the BFF never forwards an arbitrary path.
const FIELDS = new Set(["website", "whatsapp"]);
const ACTIONS = new Set(["disable", "restore"]);

export async function POST(request: NextRequest, context: RouteContext) {
  const { listingSlug, field, action } = await context.params;
  if (!FIELDS.has(field) || !ACTIONS.has(action)) {
    return NextResponse.json({ error: "Unsupported link action." }, { status: 404 });
  }
  return proxyLaravelJson(request, {
    path: `admin/listing-links/${encodeURIComponent(listingSlug)}/${field}/${action}`,
    method: "POST",
  });
}
