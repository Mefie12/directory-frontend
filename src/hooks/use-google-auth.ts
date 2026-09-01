"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";

import { exchangeGoogleToken } from "@/lib/google-auth";
import { useAuth } from "@/context/auth-context";

/**
 * Exchanges a Google credential for a mefie session.
 *
 * **Which of the two flows this uses, and why.** The backend can take either an
 * `id_token` or an `access_token`. The ID token is the one Google's guide calls
 * recommended, but Google only issues it through `<GoogleLogin>` — a button
 * Google renders into an iframe, which cannot be restyled beyond a handful of
 * theme props. Using it would mean surrendering the designed button on both
 * auth screens and shipping something that doesn't match the rest of the form.
 *
 * So this uses `useGoogleLogin`, the same package's hook-driven flow: it fires
 * from our own markup and returns an `access_token`, the documented supported
 * alternative.
 *
 * Switching to ID tokens later is a two-line change — swap `useGoogleLogin` for
 * the `<GoogleLogin>` component at the call site and send `id_token` below.
 * Everything after the exchange is identical either way, and
 * `GoogleAuthPayload` already types both keys.
 *
 * After the exchange this hands the bearer token to `useAuth().login()`, the
 * same entry point the password form uses — so profile fetch, role storage and
 * the unverified-email branch all behave identically no matter how someone
 * signed in.
 */
export function useGoogleAuth({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  /*
    A ref, not state.

    Google's callbacks are captured when `useGoogleLogin` is called, so they
    close over whatever `onError` existed at that render. Storing the handler in
    state and then calling `signIn()` in the same tick would fire the popup with
    the *previous* render's handler — on a first click, the initial no-op — and
    the failure would vanish silently.

    Only ever written from `signIn`, which is an event handler, so nothing here
    touches a ref during render.
  */
  const onErrorRef = useRef<(message: string) => void>(() => {});

  const login_ = useGoogleLogin({
    // The default `implicit` flow hands the token straight to the browser,
    // which is what we forward. The `auth-code` flow would return a code that
    // only the backend could redeem, and there is no endpoint for that.
    flow: "implicit",
    // The two scopes needed to identify the account and nothing more: every
    // extra scope is another line on Google's consent screen and another reason
    // to abandon the flow.
    scope: "openid email profile",
    onSuccess: async ({ access_token }) => {
      if (!access_token) {
        setIsLoading(false);
        onErrorRef.current(
          "Google did not return a sign-in token. Please try again.",
        );
        return;
      }

      try {
        const token = await exchangeGoogleToken({ access_token });

        // Same handoff as the password form: `login()` stores the token and
        // fetches the profile, so role-based routing below reads a populated
        // `userRole`.
        await login(token);

        // An explicit redirect target wins; otherwise fall back to the same
        // role-based routing the password login uses, so the two paths cannot
        // drift apart.
        if (redirectTo && redirectTo !== "/") {
          router.push(redirectTo);
          return;
        }

        const userRole = localStorage.getItem("userRole")?.toLowerCase();
        router.push(
          userRole === "customer" || userRole === "user"
            ? "/discover"
            : "/dashboard",
        );
      } catch (err) {
        setIsLoading(false);
        onErrorRef.current(
          err instanceof Error
            ? err.message
            : "Could not sign you in with Google.",
        );
      }
    },
    // Google rejected the request itself — bad scope, bad client, refused
    // consent. Its own `error_description` is more specific than anything we
    // could invent, so it is shown when present.
    onError: (error) => {
      setIsLoading(false);
      onErrorRef.current(
        error?.error_description ??
          error?.error ??
          "Google sign-in was cancelled.",
      );
    },
    /*
      Fires for failures outside the OAuth exchange, and the `type` matters —
      the two cases need completely different actions from the person reading
      the message.

      `popup_closed` is the one that misleads. It is genuine when someone
      dismisses the window, but it also fires when Google renders an error
      *inside* the popup — most commonly "Error 401: invalid_client / no
      registered origin" — and the person closes that. Blaming them for closing
      it sends them in circles, so the copy names the likely cause instead.
    */
    onNonOAuthError: (error) => {
      setIsLoading(false);
      onErrorRef.current(
        error?.type === "popup_failed_to_open"
          ? "Your browser blocked the Google popup. Allow popups for this site and try again."
          : "Google sign-in didn't complete. If the popup showed an error, this site's address isn't registered with Google yet.",
      );
    },
  });

  /**
   * Call directly from a click handler — `useGoogleLogin` opens a popup, and a
   * popup only survives if it is opened inside the gesture that asked for it.
   */
  const signIn = (handleError: (message: string) => void) => {
    onErrorRef.current = handleError;
    setIsLoading(true);
    login_();
  };

  return { signIn, isLoading };
}
