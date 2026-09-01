/**
 * Google sign-in configuration and the token exchange.
 *
 * Kept as its own module rather than living in `providers/` so the auth pages
 * can read `isGoogleAuthConfigured` without pulling the whole provider tree
 * (auth context, bookmarks, country, nuqs) into their module graph to read a
 * single string.
 *
 * The `NEXT_PUBLIC_` prefix is required — Next.js only inlines those into the
 * browser bundle, and this is read client-side. A hosting dashboard may flag a
 * variable named `*_CLIENT_ID` as sensitive; for Google OAuth that warning is
 * wrong. The client id is public by design: it travels in every OAuth request
 * and is visible in devtools on any site using Google sign-in. The client
 * *secret* is the confidential half, and it never leaves the backend.
 */
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

/**
 * Whether Google sign-in can run at all.
 *
 * Callers **must** check this before mounting anything that calls
 * `useGoogleAuth`. Google's `initTokenClient` throws on an empty client id, and
 * because that happens inside an effect it takes down the whole page during
 * hydration rather than failing quietly — a server-rendered 200 followed by a
 * blank screen. Hiding the button is not enough; the hook must not run, which
 * means not mounting the component that calls it.
 */
export const isGoogleAuthConfigured = Boolean(GOOGLE_CLIENT_ID);

/**
 * The endpoint that trades a Google credential for a mefie session.
 *
 * **Not implemented on the backend yet.** The frontend flow is complete and
 * calls this for real; until the route exists the request 404s and
 * `exchangeGoogleToken` surfaces the "not enabled yet" message below rather
 * than a raw parse error. Nothing here changes when the route lands.
 *
 * Named to match the existing `/api/login` and `/api/register` routes this app
 * already posts to.
 */
const GOOGLE_AUTH_ENDPOINT = "/api/auth/google";

export interface GoogleAuthPayload {
  /**
   * Send one of the two, not both. This app sends `access_token` — see
   * `use-google-auth.ts` for why that flow was chosen over the ID-token one.
   */
  id_token?: string;
  access_token?: string;
}

/**
 * Posts the Google credential and returns the mefie bearer token.
 *
 * Reads the same spread of token keys the password login accepts
 * (`token` / `access_token` / `jwt` / `data.token`), because the backend has
 * been inconsistent about which it returns and the login page already had to
 * accommodate all four.
 */
export async function exchangeGoogleToken(
  payload: GoogleAuthPayload,
): Promise<string> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

  const response = await fetch(`${apiUrl}${GOOGLE_AUTH_ENDPOINT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  // A 404/405 here means the route isn't deployed rather than that the
  // credential was rejected — worth saying plainly, since during rollout it is
  // by far the likeliest failure and "sign-in failed" would send someone
  // hunting their Google account for a problem that isn't there.
  if (response.status === 404 || response.status === 405) {
    throw new Error(
      "Google sign-in isn't enabled on this account yet. Please sign in with your email and password.",
    );
  }

  // Errors are not guaranteed to be JSON — a proxy or gateway failure returns
  // HTML, and calling .json() on that throws a SyntaxError that would mask the
  // real status.
  const raw = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : "Could not sign you in with Google. Please try again.";
    throw new Error(message);
  }

  const nested = data.data as Record<string, unknown> | undefined;
  const token =
    data.token ?? data.access_token ?? data.jwt ?? nested?.token;

  if (typeof token !== "string" || !token) {
    throw new Error("Signed in with Google, but no session token was returned.");
  }

  return token;
}
