import { NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/countries_dropdown`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
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

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("countries_dropdown proxy error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
