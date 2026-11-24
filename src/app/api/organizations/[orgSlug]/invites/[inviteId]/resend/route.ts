import { NextRequest } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type Context = { params: Promise<{ orgSlug: string; inviteId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { orgSlug, inviteId } = await params;
  return proxyLaravelJson(request, {
    path: `organizations/${encodeURIComponent(orgSlug)}/invites/${encodeURIComponent(inviteId)}/resend`,
    method: "POST",
  });
}
