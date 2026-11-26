import { NextRequest, NextResponse } from "next/server";
import { hasUsableAuthorization } from "@/lib/auth-cookie";
import { applyCountryPreference } from "@/lib/bff/country-preference";
import { responseHeadersFor } from "@/lib/public-cache";

const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

type Options = {
  /** Laravel path without /api/, for example "business_categories". */
  path: string;
  /** The result depends on the visitor's country. Shared only when the URL carries an explicit ?country=. */
  countrySensitive?: boolean;
  /** Query parameters forwarded to Laravel; others are dropped (and the response is then never shared). */
  allowedParams?: ReadonlySet<string>;
  timeoutMs?: number;
};

/**
 * GET proxy for public directory data on Vercel (V2 Phase 5.3c).
 *
 * Shared by the CDN only if all of these hold: the caller sends no usable Authorization (signed-in
 * callers are never shared, and Vercel does not cache requests with one), the URL alone fixes the
 * result (an explicit ?country= on country-sensitive routes; no IP or cookie personalisation is added),
 * and Laravel itself answered `public` (it applies the whitelist, parameter and status rules and holds
 * the master switch PUBLIC_CACHE_ENABLED). Otherwise the response is `private, no-store`, as before.
 */
export async function proxyPublicGet(request: NextRequest, options: Options): Promise<NextResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10_000);

  try {
    const incoming = new URL(request.url).searchParams;
    const backendUrl = new URL(`${API_BASE_URL}/api/${options.path}`);

    let droppedParam = false;
    incoming.forEach((value, key) => {
      if (options.allowedParams && !options.allowedParams.has(key)) {
        droppedParam = true;
        return;
      }
      backendUrl.searchParams.append(key, value);
    });

    const authorization = request.headers.get("authorization");
    const authenticated = hasUsableAuthorization(authorization);

    const explicitCountry = (incoming.get("country") ?? "").trim() !== "";
    let urlDeterminesResult = true;
    if (options.countrySensitive && !explicitCountry) {
      // The answer depends on the visitor's cookie or IP, which the CDN key does not include.
      applyCountryPreference(request, backendUrl);
      urlDeterminesResult = false;
    }

    const upstream = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Never forward "Bearer null" or the cookie-session placeholder: Laravel treats any Authorization as personal.
        ...(authenticated && authorization ? { Authorization: authorization } : {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const raw = await upstream.text();
    try {
      JSON.parse(raw || "{}");
    } catch {
      return NextResponse.json(
        { message: "Upstream returned a non-JSON response", upstreamStatus: upstream.status },
        { status: 502, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const headers = responseHeadersFor({
      status: upstream.status,
      upstreamCacheControl: upstream.headers.get("cache-control"),
      authenticated,
      cacheable: urlDeterminesResult && !droppedParam,
    });

    return new NextResponse(raw || "{}", {
      status: upstream.status,
      headers: { "Content-Type": "application/json", ...headers },
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      { message: aborted ? "The request timed out. Please try again." : "Could not reach the service." },
      { status: aborted ? 504 : 502, headers: { "Cache-Control": "private, no-store" } },
    );
  } finally {
    clearTimeout(timeout);
  }
}
