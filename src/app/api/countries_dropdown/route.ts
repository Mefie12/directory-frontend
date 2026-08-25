import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

const ALLOWED_PARAMS = new Set(["type", "category_id", "category_slug"]);

export async function GET(request: NextRequest) {
  try {
    const backendUrl = new URL(`${API_BASE_URL}/api/countries_dropdown`);
    const { searchParams } = new URL(request.url);
    searchParams.forEach((value, key) => {
      if (ALLOWED_PARAMS.has(key)) backendUrl.searchParams.set(key, value);
    });

    const response = await fetch(backendUrl.toString(), {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 },
    });

    const rawText = await response.text();
    let data: unknown;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      return NextResponse.json(
        { message: "Upstream returned non-JSON response" },
        { status: 502 },
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to fetch countries" },
        { status: response.status },
      );
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("countries_dropdown proxy error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
