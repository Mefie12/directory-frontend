/**
 * Pure helpers for the httpOnly session cookie (V2 Phase 5.2, md files/V2-phase5-auth-cookie-spec.md).
 * No Next.js imports, so scripts/verify-auth-cookie.mjs can exercise them directly.
 */

/** Matches the Sanctum token lifetime (720 minutes). */
export const SESSION_MAX_AGE_SECONDS = 720 * 60;

/** Non-secret, JS-readable marker so client code knows a session exists without reading the token. */
export const MARKER_COOKIE = "mefie_signed_in";

const SECURE_NAME = "__Host-mefie_session";
const PLAIN_NAME = "mefie_session";

/** `__Host-` needs Secure, Path=/ and no Domain, so it is only used over https. */
export function sessionCookieName(secure: boolean): string {
  return secure ? SECURE_NAME : PLAIN_NAME;
}

/** Off by default: with the flag off every route and the proxy behave exactly as before. */
export function authCookieEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.AUTH_COOKIE_ENABLED === "true";
}

export function isSecureRequest(protocol: string, forwardedProto: string | null): boolean {
  return protocol === "https:" || forwardedProto === "https";
}

/** The backend has been inconsistent about the key it returns the token under. */
export function tokenFromBody(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const body = data as Record<string, unknown>;
  const nested = typeof body.data === "object" && body.data !== null ? (body.data as Record<string, unknown>) : {};
  const token = body.token ?? body.access_token ?? body.jwt ?? nested.token ?? nested.access_token;
  return typeof token === "string" && token ? token : null;
}

const TOKEN_KEYS = ["token", "access_token", "jwt", "plainTextToken"];

/** The browser must never receive the token: remove it at every depth. */
export function stripTokens<T>(data: T): T {
  if (Array.isArray(data)) return data.map((item) => stripTokens(item)) as unknown as T;
  if (typeof data !== "object" || data === null) return data;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (TOKEN_KEYS.includes(key)) continue;
    out[key] = stripTokens(value);
  }
  return out as T;
}

/** Reads the session token from either cookie name (https and http variants). */
export function readSessionToken(get: (name: string) => string | undefined): string | null {
  return get(SECURE_NAME) || get(PLAIN_NAME) || null;
}

/**
 * Existing client code builds `Authorization: Bearer ${token}` even when it has no token,
 * which sends the literal "Bearer null". Treat that, and an empty value, as "no header" so
 * the cookie can take over without editing every caller.
 */
export function hasUsableAuthorization(value: string | null): boolean {
  if (!value) return false;
  const token = value.replace(/^Bearer\s+/i, "").trim();
  return token !== "" && token !== "null" && token !== "undefined";
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isUnsafeMethod(method: string): boolean {
  return !SAFE_METHODS.has(method.toUpperCase());
}

function hostOf(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

/**
 * CSRF guard for state-changing requests. It applies when the request relies on the
 * cookie (no explicit Authorization header) or is a session route (login CSRF).
 * Bearer-header clients are not exposed to CSRF, so they pass.
 */
export function csrfAllowed(input: {
  method: string;
  origin: string | null;
  referer: string | null;
  host: string | null;
  usesCookie: boolean;
  isSessionRoute: boolean;
}): boolean {
  if (!isUnsafeMethod(input.method)) return true;
  if (!input.usesCookie && !input.isSessionRoute) return true;

  const source = hostOf(input.origin) ?? hostOf(input.referer);
  return source !== null && input.host !== null && source === input.host;
}
