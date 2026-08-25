import { NextRequest, NextResponse } from "next/server";
import {
  MASTER_COUNTRY_COOKIE,
  applyCountryPreference,
  countryFromCode,
  isSameOriginMutation,
  preferenceMutationRateLimited,
} from "@/lib/bff/country-preference";

const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

async function approvedCountryNames(): Promise<Set<string>> {
  const response = await fetch(`${API_BASE_URL}/api/countries_dropdown`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error("Could not validate country availability");
  const json = (await response.json()) as { data?: unknown[] };
  return new Set(
    (json.data ?? [])
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.toLowerCase()),
  );
}

export async function GET(request: NextRequest) {
  const backendUrl = new URL(`${API_BASE_URL}/api/country_context`);
  applyCountryPreference(request, backendUrl);

  const response = await fetch(backendUrl, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    return NextResponse.json({ message: "Could not resolve country context" }, { status: 502 });
  }

  const upstream = (await response.json()) as {
    data?: { effective_country?: string; country_code?: string; country_source?: string };
  };
  const master = countryFromCode(
    request.cookies.get(MASTER_COUNTRY_COOKIE)?.value,
  );

  return NextResponse.json({
    master_country: master ? { code: master.alpha2, name: master.name } : null,
    effective_country: upstream.data?.effective_country ?? null,
    country_code: upstream.data?.country_code ?? null,
    country_source: upstream.data?.country_source ?? "fallback",
  }, { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ message: "Invalid request origin" }, { status: 403 });
  }
  if (preferenceMutationRateLimited(request)) {
    return NextResponse.json({ message: "Too many country changes" }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { country_code?: unknown } | null;
  const country = countryFromCode(
    typeof body?.country_code === "string" ? body.country_code : undefined,
  );
  if (!country) {
    return NextResponse.json({ message: "Invalid country code" }, { status: 422 });
  }

  try {
    const approved = await approvedCountryNames();
    if (!approved.has(country.name.toLowerCase())) {
      return NextResponse.json(
        { message: "This country does not currently have public listings" },
        { status: 422 },
      );
    }
  } catch {
    return NextResponse.json({ message: "Country validation is temporarily unavailable" }, { status: 503 });
  }

  const response = NextResponse.json({
    master_country: { code: country.alpha2, name: country.name },
    effective_country: country.name,
    country_source: "master",
  });
  response.cookies.set(MASTER_COUNTRY_COOKIE, country.alpha2.toUpperCase(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ message: "Invalid request origin" }, { status: 403 });
  }
  if (preferenceMutationRateLimited(request)) {
    return NextResponse.json({ message: "Too many country changes" }, { status: 429 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(MASTER_COUNTRY_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
