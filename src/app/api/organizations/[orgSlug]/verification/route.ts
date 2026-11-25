import { NextRequest, NextResponse } from "next/server";
import { proxyLaravelJson } from "@/lib/bff/proxy-laravel";

type Context = { params: Promise<{ orgSlug: string }> };

const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

export async function GET(request: NextRequest, { params }: Context) {
  const { orgSlug } = await params;
  return proxyLaravelJson(request, { path: `organizations/${encodeURIComponent(orgSlug)}/verification` });
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { orgSlug } = await params;
  return proxyLaravelJson(request, { path: `organizations/${encodeURIComponent(orgSlug)}/verification`, method: "DELETE" });
}

// Multipart upload: forward the form as is. Laravel validates type, size and count.
export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { orgSlug } = await params;
    const authorization = request.headers.get("authorization");
    const body = await request.formData();
    const response = await fetch(`${API_BASE_URL}/api/organizations/${encodeURIComponent(orgSlug)}/verification`, {
      method: "POST",
      headers: { Accept: "application/json", ...(authorization ? { Authorization: authorization } : {}) },
      body,
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({ message: "The upstream service returned an invalid response." }));
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("organization verification POST error:", error);
    return NextResponse.json({ error: "The service is temporarily unavailable." }, { status: 502 });
  }
}
