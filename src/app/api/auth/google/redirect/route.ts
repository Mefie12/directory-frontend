import { NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

/**
 * BFF proxy for `GET /api/auth/google/redirect`.
 *
 * Returns `{ url }` — the Google consent URL, built by the backend with its own
 * client id and registered `redirect_uri`. The browser is then sent there.
 *
 * Proxied rather than called directly from the client for the same reasons as
 * every other route in here: one origin, no CORS preflight, and the backend
 * host stays out of the browser. It also means the consent URL is fetched
 * server-side, so the client id never has to be inlined into the JS bundle.
 *
 * Note this route only *hands out* the URL. Google itself redirects to the
 * backend's own callback, not back through here.
 */
export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/google/redirect`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    const rawText = await response.text();
    let data: unknown;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      return NextResponse.json(
        {
          message: "Upstream returned a non-JSON response",
          upstreamStatus: response.status,
        },
        { status: 502 },
      );
    }

    if (!response.ok) {
      const maybeError =
        typeof data === "object" && data !== null
          ? ((data as { error?: string; message?: string }).error ??
            (data as { message?: string }).message)
          : undefined;
      return NextResponse.json(
        { message: maybeError || "Could not start Google sign-in" },
        { status: response.status },
      );
    }

    // Never cached: the URL carries per-request OAuth parameters, and a cached
    // consent URL is a replayed one.
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      {
        message: aborted
          ? "Google sign-in timed out. Please try again."
          : "Could not reach the sign-in service.",
      },
      { status: aborted ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
