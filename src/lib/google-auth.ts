/**
 * Google sign-in — server-side authorization-code flow.
 *
 * The backend owns the whole OAuth exchange. This app never talks to Google
 * directly and never sees the client secret:
 *
 *   1. `GET /api/auth/google/redirect` returns the Google consent URL, already
 *      built with the backend's client id and `redirect_uri`.
 *   2. We send the browser there.
 *   3. Google returns the person to the backend's callback with a `code`.
 *   4. The backend trades that code for a Google identity and issues a mefie
 *      token, then returns the person to `/auth/google/callback` on this app.
 *
 * Because step 4 leaves and re-enters our origin, no React state survives the
 * round trip — see `rememberGoogleReturnPath`.
 *
 * There is deliberately no `NEXT_PUBLIC_GOOGLE_CLIENT_ID` here any more. The
 * client id is embedded in the URL the backend hands us, so the frontend has
 * nothing left to configure and cannot fall out of sync with the backend's
 * registered `redirect_uri`.
 *
 * Both calls go through this app's own BFF routes (`src/app/api/auth/google/*`)
 * rather than straight to the backend, matching every other API call in the
 * app: one origin, no CORS preflight, and the backend host stays out of the
 * browser.
 */

/** Same-origin BFF routes — see `src/app/api/auth/google/`. */
const GOOGLE_REDIRECT_ENDPOINT = "/api/auth/google/redirect";
const GOOGLE_CALLBACK_ENDPOINT = "/api/auth/google/callback";

/** Where this app returns after Google, and what the backend should redirect to. */
export const GOOGLE_CALLBACK_PATH = "/auth/google/callback";

/**
 * Reads a JSON body without letting a non-JSON error response throw.
 *
 * The callback returns `{"error": "..."}` with a 500 on failure, but an
 * upstream nginx or gateway failure returns HTML — and `.json()` on that throws
 * a SyntaxError that would mask the real status.
 */
async function readJson(response: Response): Promise<Record<string, unknown>> {
  const raw = await response.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Step 1 — asks the backend for the Google consent URL.
 *
 * Returned rather than navigated to here so the caller decides when to leave
 * the page, and so a failure surfaces as an inline message instead of a
 * half-finished navigation.
 */
export async function fetchGoogleAuthUrl(): Promise<string> {
  const response = await fetch(GOOGLE_REDIRECT_ENDPOINT, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(
      typeof data.message === "string"
        ? data.message
        : "Could not start Google sign-in. Please try again.",
    );
  }

  const url = data.url;
  if (typeof url !== "string" || !url) {
    throw new Error(
      "Google sign-in is misconfigured — no consent URL returned.",
    );
  }

  return url;
}

/**
 * Fallback for when we are handed a raw `code` instead of a finished token.
 *
 * Only reachable if the backend's `redirect_uri` is ever pointed at this app
 * rather than at its own callback. It is cheap to support and means the
 * frontend does not have to change if that decision is revisited.
 */

export async function exchangeGoogleCode(
  code: string,
  extraParams: Record<string, string> = {},
): Promise<string> {
  const params = new URLSearchParams({ code, ...extraParams });

  const response = await fetch(`${GOOGLE_CALLBACK_ENDPOINT}?${params}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(
      typeof data.message === "string"
        ? data.message
        : "Google sign-in could not be completed.",
    );
  }

  return readToken(data);
}

/**
 * Pulls the session token out of a response body.
 *
 * Accepts the same spread of key names the password login already had to
 * tolerate — the backend has been inconsistent about which one it returns, and
 * guessing wrong here fails silently at the last step of a working flow.
 */
export function readToken(data: Record<string, unknown>): string {
  const nested = data.data as Record<string, unknown> | undefined;
  const token =
    data.token ??
    data.access_token ??
    data.jwt ??
    nested?.token ??
    nested?.access_token;

  if (typeof token !== "string" || !token) {
    throw new Error(
      "Signed in with Google, but no session token was returned.",
    );
  }

  return token;
}

/*
  Where to land after Google sends the person back.

  `sessionStorage`, not React state or a URL param: the OAuth round trip leaves
  this origin entirely and comes back as a fresh page load, so every bit of
  in-memory state is gone. sessionStorage is per-tab and survives that, which
  also means two tabs signing in at once don't overwrite each other's
  destination.

  Not `localStorage` — a destination left behind by an abandoned sign-in would
  outlive the tab and hijack a later one.
*/
const RETURN_PATH_KEY = "mefie:google-return-path";

export function rememberGoogleReturnPath(path: string): void {
  try {
    // Only same-origin paths. A full URL here would turn a stored value into
    // an open redirect, sending someone to an attacker's site after a
    // legitimate-looking sign-in.
    if (path.startsWith("/") && !path.startsWith("//")) {
      sessionStorage.setItem(RETURN_PATH_KEY, path);
    }
  } catch {
    // Private browsing and locked-down storage settings throw. The flow still
    // works; it just falls back to the default destination.
  }
}

export function consumeGoogleReturnPath(): string | null {
  try {
    const path = sessionStorage.getItem(RETURN_PATH_KEY);
    sessionStorage.removeItem(RETURN_PATH_KEY);
    return path && path.startsWith("/") && !path.startsWith("//") ? path : null;
  } catch {
    return null;
  }
}
