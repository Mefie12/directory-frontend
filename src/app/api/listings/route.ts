import { NextRequest, NextResponse } from "next/server";

// TODO: Replace with your actual backend API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.example.com";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract query parameters
    const query = searchParams.get("q") || "";
    const country = searchParams.get("country") || "";
    const date = searchParams.get("date") || "";
    const price = searchParams.get("price") || "";
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";

    // Build query string for backend API
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (country) params.append("country", country);
    if (date) params.append("date", date);
    if (price) params.append("price", price);
    params.append("page", page);
    params.append("limit", limit);

    // Fetch from your backend API
    const response = await fetch(
      `${API_BASE_URL}/listings?${params.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
          // Add any authentication headers here
          // "Authorization": `Bearer ${process.env.API_KEY}`,
        },
        next: { revalidate: 60 }, // Cache for 60 seconds
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
    console.error("Error fetching listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}
