import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk"
).replace(/\/$/, "");

/**
 * BFF proxy for `GET /api/auth/google/callback`.
 *
 * **Google does not hit this route.** The backend registers its own callback as
 * the `redirect_uri`, so Google returns the person there, not here. This exists
 * for the one case where this app is holding a raw authorization `code` and
 * needs it turned into a session token — see `exchangeGoogleCode`.
 *
 * Every query param is forwarded verbatim rather than picking out `code`:
 * the exchange also depends on `state` and `scope`, and an OAuth provider may
 * add more.
 */
export async function GET(request: NextRequest) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const { searchParams } = new URL(request.url);
    const backendUrl = new URL(`${API_BASE_URL}/api/auth/google/callback`);

    searchParams.forEach((value, key) => {
      backendUrl.searchParams.set(key, value);
    });

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
      // The backend may answer a successful exchange with a redirect rather
      // than a body. Following it here would hand back an HTML page, so the
      // response is inspected as-is and the redirect passed on instead.
      redirect: "manual",
    });

    // A redirecting backend is a valid outcome: forward the Location so the
    // caller can follow it rather than reporting a mystery non-JSON response.
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location) {
        return NextResponse.json({ redirect: location }, { status: 200 });
      }
    }

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
        { message: maybeError || "Google sign-in could not be completed" },
        { status: response.status },
      );
    }

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
