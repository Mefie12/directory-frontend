import { NextRequest } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type Context = { params: Promise<{ orgSlug: string; userId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { orgSlug, userId } = await params;
  return proxyLaravelJson(request, {
    path: `organizations/${encodeURIComponent(orgSlug)}/members/${encodeURIComponent(userId)}`,
    method: "PATCH",
  });
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { orgSlug, userId } = await params;
  return proxyLaravelJson(request, {
    path: `organizations/${encodeURIComponent(orgSlug)}/members/${encodeURIComponent(userId)}`,
    method: "DELETE",
  });
}
