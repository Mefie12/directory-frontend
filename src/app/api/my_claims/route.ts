import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const search = request.nextUrl.search;

    const response = await fetch(`${API_BASE_URL}/api/my_claims${search}`, {
      headers: {
        Accept: "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("my_claims GET error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
