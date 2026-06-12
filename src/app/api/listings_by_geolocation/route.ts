import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const backendUrl = new URL(`${API_BASE_URL}/api/listings_by_geolocation`);

    // Forward all query params (country override, page, etc.)
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.set(key, value);
    });

    // Extract the client's real IP and pass it as ip_address query param
    // so the backend can geolocate correctly.
    // Priority: forwarded headers (behind proxy/CDN) → NextRequest.ip → skip
    const forwarded =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip"); // Cloudflare

    const clientIp = forwarded ? forwarded.split(",")[0].trim() : null;

    if (clientIp) {
      backendUrl.searchParams.set("ip_address", clientIp);
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const authHeader = request.headers.get("Authorization");
    if (authHeader) headers["Authorization"] = authHeader;

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers,
      // Don't cache — geolocation results must be fresh
      cache: "no-store",
    });

    const rawText = await response.text();
    let data: unknown;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      // Backend returned non-JSON (HTML error page, etc.) — surface it.
      return NextResponse.json(
        {
          message: "Upstream returned non-JSON response",
          upstreamStatus: response.status,
          upstreamBody: rawText.slice(0, 500),
          backendUrl: backendUrl.toString(),
        },
        { status: 502 },
      );
    }

    if (!response.ok) {
      const maybeMessage =
        typeof data === "object" && data !== null && "message" in data
          ? (data as { message?: string }).message
          : undefined;
      return NextResponse.json(
        { message: maybeMessage || "Failed to fetch listings" },
        { status: response.status },
      );
    }

    // UK fallback: if geo-detection failed (no detected_country) OR the
    // detected country has no listings, transparently re-fetch for UK so the
    // home page always has content to show.
    const parsed = data as { data?: unknown[]; meta?: { detected_country?: string } };
    const detectedCountry = parsed.meta?.detected_country;
    const listingsData = Array.isArray(parsed.data) ? parsed.data : [];

    if (!detectedCountry || listingsData.length === 0) {
      const ukUrl = new URL(`${API_BASE_URL}/api/all_listings_by_country_and_category`);
      ukUrl.searchParams.set("country", "United Kingdom");
      // Forward non-IP params (per_page, type, etc.) from the original request
      searchParams.forEach((value, key) => {
        if (key !== "ip_address") ukUrl.searchParams.set(key, value);
      });

      const ukResponse = await fetch(ukUrl.toString(), {
        method: "GET",
        headers,
        cache: "no-store",
      });

      if (ukResponse.ok) {
        const ukRaw = await ukResponse.text();
        try {
          const ukData = ukRaw ? (JSON.parse(ukRaw) as Record<string, unknown>) : {};
          return NextResponse.json({
            ...ukData,
            meta: {
              ...(typeof ukData.meta === "object" && ukData.meta !== null ? ukData.meta : {}),
              detected_country: "United Kingdom",
              fallback: true,
            },
          });
        } catch {
          // UK fetch returned non-JSON — fall through and return original response
        }
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Geolocation listings error:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      {
        message: "Internal Server Error",
        error: message,
        apiBase: API_BASE_URL,
      },
      { status: 500 },
    );
  }
}
