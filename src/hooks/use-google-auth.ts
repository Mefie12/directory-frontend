"use client";

import { useState } from "react";

import {
  fetchGoogleAuthUrl,
  rememberGoogleReturnPath,
} from "@/lib/google-auth";

/**
 * Starts the Google sign-in round trip.
 *
 * This is a full-page navigation, not a popup. The backend runs the
 * authorization-code flow, so the browser has to actually visit Google and come
 * back — which means nothing in this component survives to see the result. The
 * other half lives in `app/(private)/auth/google/callback`.
 *
 * The previous implementation used `@react-oauth/google`'s popup and handed an
 * `access_token` straight to the backend. That package is gone: with the
 * backend owning the exchange, the browser never speaks to Google, so there is
 * no client id to initialise and no popup to be blocked.
 */
export function useGoogleAuth({ redirectTo }: { redirectTo: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (onError: (message: string) => void) => {
    setIsLoading(true);

    try {
      // Stored before navigating away — this is the last moment we still know
      // where the person was trying to go.
      rememberGoogleReturnPath(redirectTo);

      const url = await fetchGoogleAuthUrl();

      // `assign`, not `replace`: Back should return to the sign-in page rather
      // than skipping past it to whatever came before.
      window.location.assign(url);

      // Deliberately left loading. The navigation is in flight and clearing the
      // spinner now would show a live button for the instant before the page
      // unloads, inviting a second click.
    } catch (err) {
      setIsLoading(false);
      onError(
        err instanceof Error
          ? err.message
          : "Could not start Google sign-in. Please try again.",
      );
    }
  };

  return { signIn, isLoading };
}
