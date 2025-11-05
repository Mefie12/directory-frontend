import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.example.com";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const query = searchParams.get("q") || "";
    const country = searchParams.get("country") || "";
    const date = searchParams.get("date") || "";
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";

    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (country) params.append("country", country);
    if (date) params.append("date", date);
    params.append("page", page);
    params.append("limit", limit);

    const response = await fetch(
      `${API_BASE_URL}/events?${params.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
