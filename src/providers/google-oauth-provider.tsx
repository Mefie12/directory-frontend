"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

import { GOOGLE_CLIENT_ID, isGoogleAuthConfigured } from "@/lib/google-auth";

/**
 * Wraps `@react-oauth/google`'s provider so it can be composed from
 * `AppProviders`, which the root layout (a server component) renders.
 * `@react-oauth/google` predates the App Router and ships no `"use client"`
 * directive of its own, so importing it into a server module fails the build.
 *
 * When no client id is configured this renders children untouched rather than
 * mounting the provider: the provider injects Google's GSI script on mount, and
 * there is no reason to load a third-party script on every page of the site for
 * a feature that cannot run. The auth pages already hide the button via
 * `isGoogleAuthConfigured`, so nothing below is reaching for this context.
 */
export function AppGoogleOAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isGoogleAuthConfigured) return <>{children}</>;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}
