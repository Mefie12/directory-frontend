"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/context/auth-context";
import {
  consumeGoogleReturnPath,
  exchangeGoogleCode,
} from "@/lib/google-auth";

/**
 * Where Google sign-in lands when the backend sends the person back.
 *
 * The backend runs the OAuth exchange, so by the time this page loads the work
 * is done and the only job left is to read the result out of the URL, hand the
 * token to the auth context, and get out of the way. Nothing here should ever
 * be visible for more than a moment.
 *
 * Two shapes are accepted, because they are the two reasonable things the
 * backend can redirect with and supporting both costs nothing:
 *
 *   ?token=…  the finished mefie session token — the expected case.
 *   ?code=…   a raw Google authorization code, exchanged here instead. Only
 *             reachable if the backend's `redirect_uri` is ever pointed at this
 *             app rather than at its own callback.
 *
 * An `?error=` or `?message=` param wins over both, so a backend that reports a
 * failure by redirecting is rendered properly rather than falling through to
 * "no token".
 */
function GoogleCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState("");

  /*
    React 18+ runs effects twice in development StrictMode. Without this guard
    the token would be submitted twice, and on a single-use `code` the second
    attempt fails and overwrites a successful sign-in with an error.
  */
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const finish = async () => {
      // Google's own failures (`access_denied` when someone declines consent)
      // and the backend's both arrive as query params.
      const failure =
        searchParams.get("error") ??
        searchParams.get("message") ??
        searchParams.get("error_description");

      if (failure) {
        setError(
          failure === "access_denied"
            ? "Google sign-in was cancelled."
            : failure,
        );
        return;
      }

      const token = searchParams.get("token") ?? searchParams.get("access_token");
      const code = searchParams.get("code");

      if (!token && !code) {
        setError(
          "Google didn't return a sign-in token. Please try signing in again.",
        );
        return;
      }

      try {
        const sessionToken = token ?? (await exchangeGoogleCode(code as string));

        // Same handoff as the password form — stores the token and fetches the
        // profile, so the role lookup below reads a populated value.
        await login(sessionToken);

        // Restored from sessionStorage, since the OAuth round trip left this
        // origin and took every bit of in-memory state with it.
        const returnPath = consumeGoogleReturnPath();

        if (returnPath && returnPath !== "/") {
          router.replace(returnPath);
          return;
        }

        // Otherwise the same role-based routing the password login uses, so the
        // two paths cannot drift apart.
        const userRole = localStorage.getItem("userRole")?.toLowerCase();
        router.replace(
          userRole === "customer" || userRole === "user"
            ? "/discover"
            : "/dashboard",
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not complete Google sign-in.",
        );
      }
    };

    void finish();
    // Intentionally runs once: `hasRun` guards re-entry, and re-running on a
    // changed searchParams reference would re-submit a spent code.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div
          role="alert"
          className="w-full max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm"
        >
          <h1 className="text-lg font-semibold text-gray-900">
            Couldn&apos;t sign you in
          </h1>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <Link
            href="/auth/login"
            className="mt-5 inline-flex h-9 w-full items-center justify-center rounded-md bg-[#93C01F] px-4 text-sm font-medium text-white transition-colors hover:bg-[#84ad1b]"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    // `role="status"` so a screen reader announces the wait rather than
    // landing on a page that reads as empty.
    <div
      role="status"
      className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-4"
    >
      <Loader2 className="h-6 w-6 animate-spin text-[#93C01F]" aria-hidden="true" />
      <p className="text-sm text-gray-500">Signing you in with Google…</p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    // `useSearchParams` needs a Suspense boundary for this route to be
    // statically prerenderable — without one the build fails.
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#93C01F]" />
        </div>
      }
    >
      <GoogleCallback />
    </Suspense>
  );
}
