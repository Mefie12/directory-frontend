import { toast } from "sonner";

// Guards against firing more than once when several requests 401 together
// (e.g. Promise.all'd calls) or when both the global interceptor and a
// call site's own check observe the same expired session.
let sessionExpiredHandled = false;

/**
 * Detects an expired/invalid session (401) from a failed API response and,
 * if found, clears the stale token and redirects to login instead of
 * surfacing the raw backend message (e.g. "Unauthenticated.") to the user.
 * Returns true when the response was a session expiry, so the caller can
 * bail out immediately without also showing a generic error toast.
 */
export function handleSessionExpired(status: number): boolean {
  if (status !== 401) return false;
  if (sessionExpiredHandled) return true;
  sessionExpiredHandled = true;

  localStorage.removeItem("authToken");
  toast.error("Your session has expired. Please sign in again.");

  const redirect = encodeURIComponent(
    window.location.pathname + window.location.search,
  );
  window.location.href = `/auth/login?redirect=${redirect}`;

  return true;
}

/**
 * Reads the bearer token a fetch call was made with, from whatever shape
 * its headers were passed in as.
 */
function getBearerToken(init: RequestInit | undefined): string | null {
  const headers = init?.headers;
  if (!headers) return null;

  let raw: string | null | undefined;
  if (headers instanceof Headers) {
    raw = headers.get("Authorization");
  } else if (Array.isArray(headers)) {
    raw = headers.find(([key]) => key.toLowerCase() === "authorization")?.[1];
  } else {
    const record = headers as Record<string, string>;
    raw =
      record.Authorization ??
      record.authorization ??
      Object.entries(record).find(
        ([key]) => key.toLowerCase() === "authorization",
      )?.[1];
  }

  return raw?.replace(/^Bearer\s+/i, "") ?? null;
}

/**
 * Installs a one-time global fetch interceptor so any authenticated API
 * call, anywhere in the app, is automatically redirected to login on a 401
 * — without every call site needing its own handleSessionExpired() check.
 * Only reacts to requests that carried our own stored bearer token, so
 * public/unauthenticated fetches (e.g. a failed login attempt) are left
 * alone. Safe to call more than once; only patches window.fetch once.
 */
export function installSessionExpiryInterceptor(): void {
  if (typeof window === "undefined") return;
  if ((window as unknown as { __sessionInterceptorInstalled?: boolean }).__sessionInterceptorInstalled) {
    return;
  }
  (window as unknown as { __sessionInterceptorInstalled?: boolean }).__sessionInterceptorInstalled = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const response = await originalFetch(...args);

    if (response.status === 401) {
      const init = args[1];
      const requestToken = getBearerToken(init);
      const storedToken = localStorage.getItem("authToken");

      if (requestToken && storedToken && requestToken === storedToken) {
        handleSessionExpired(401);
      }
    }

    return response;
  };
}
