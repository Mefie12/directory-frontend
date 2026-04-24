import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ event_id: string }> },
) {
  try {
    const { event_id } = await params;
    const authHeader = request.headers.get("Authorization");

    const response = await fetch(
      `${API_BASE_URL}/api/event/${event_id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      },
    );

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const rawText = await response.text();
    let data: unknown;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      return NextResponse.json(
        { message: "Upstream returned non-JSON response", upstreamBody: rawText.slice(0, 500) },
        { status: 502 },
      );
    }

    if (!response.ok) {
      const maybeMessage =
        typeof data === "object" && data !== null && "message" in data
          ? (data as { message?: string }).message
          : undefined;
      return NextResponse.json(
        { message: maybeMessage || "Failed to delete event" },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("event delete proxy error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
