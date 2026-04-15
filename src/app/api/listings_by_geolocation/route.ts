import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_URL || "https://me-fie.co.uk"
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

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to fetch listings" },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Geolocation listings error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
