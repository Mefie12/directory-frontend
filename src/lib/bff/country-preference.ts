import { NextRequest } from "next/server";
import { countries } from "country-data-list";
import { extractClientIp } from "@/lib/bff/extract-client-ip";

export const MASTER_COUNTRY_COOKIE = "mefie_master_country";

interface CatalogueCountry {
  alpha2: string;
  name: string;
  status?: string;
}

const catalogue = countries.all as CatalogueCountry[];
const preferenceMutations = new Map<string, { count: number; resetAt: number }>();

export function countryFromCode(code: string | undefined): CatalogueCountry | null {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return null;
  return catalogue.find(
    (country) =>
      country.alpha2.toUpperCase() === code.toUpperCase() &&
      country.status !== "deleted",
  ) ?? null;
}

export function applyCountryPreference(request: NextRequest, backendUrl: URL): void {
  if (!backendUrl.searchParams.has("country")) {
    const master = countryFromCode(
      request.cookies.get(MASTER_COUNTRY_COOKIE)?.value,
    );
    if (master) backendUrl.searchParams.set("master_country", master.name);
  }

  const clientIp = extractClientIp(request);
  if (clientIp) backendUrl.searchParams.set("ip_address", clientIp);
}

export function isSameOriginMutation(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

export function preferenceMutationRateLimited(request: NextRequest): boolean {
  const key = extractClientIp(request) ?? "unknown";
  const now = Date.now();
  const current = preferenceMutations.get(key);
  if (!current || current.resetAt <= now) {
    preferenceMutations.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  current.count += 1;
  return current.count > 20;
}
