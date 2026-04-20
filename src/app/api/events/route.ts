import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backendUrl = new URL(`${API_BASE_URL}/api/events`);

    searchParams.forEach((value, key) => {
      backendUrl.searchParams.set(key, value);
    });

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    const authHeader = request.headers.get("Authorization");
    if (authHeader) headers["Authorization"] = authHeader;

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const rawText = await response.text();
    let data: unknown;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
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
        { message: maybeMessage || "Failed to fetch events" },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Events proxy error:", error);
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
