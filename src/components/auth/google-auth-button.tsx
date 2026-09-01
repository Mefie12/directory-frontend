"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { isGoogleAuthConfigured } from "@/lib/google-auth";
import { cn } from "@/lib/utils";

interface GoogleButtonProps {
  label: string;
  loadingLabel?: string;
  /** Where to land after a successful exchange. */
  redirectTo: string;
  onError: (message: string) => void;
  /** True while the sibling password form is submitting. */
  disabled?: boolean;
  className?: string;
}

/**
 * The button's appearance, with no knowledge of Google.
 *
 * Split out so the configured and unconfigured paths cannot drift visually —
 * the dev preview below has to look exactly like the real thing to be worth
 * anything for styling.
 */
function GoogleButtonShell({
  label,
  isLoading,
  loadingLabel,
  onClick,
  disabled,
  className,
}: {
  label: string;
  isLoading: boolean;
  loadingLabel: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled || isLoading}
      // `aria-busy` rather than only swapping the label: a screen reader that
      // has already announced the button won't re-read a changed label, but it
      // will report the busy state.
      aria-busy={isLoading}
      /*
        Deliberately thin. Everything this button doesn't override — border
        colour, background, hover, disabled opacity, radius, icon gap — comes
        from the `outline` variant and the shared base layer, which is what
        keeps it matching the inputs and the Sign in button beneath it.

        `h-9` is the same height as `Input` and the default `Button` size, so
        the three stack without a step. The only real override is the focus
        ring: the Button default is a neutral grey, while every input on these
        forms rings in mefie green, and the odd one out is the control people
        reach first.
      */
      className={cn(
        "w-full h-9 cursor-pointer",
        "focus-visible:border-[#93c01f] focus-visible:ring-[#93c01f]/20",
        className,
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        // 16px to match `size-4`, the icon size every other button in the app
        // uses — and the spinner it swaps with, so the label doesn't shift.
        <Image
          src="/images/icons/google.svg"
          alt=""
          aria-hidden="true"
          width={16}
          height={16}
        />
      )}
      {isLoading ? loadingLabel : label}
    </Button>
  );
}

/**
 * The live Google sign-in button, and the only place `useGoogleAuth` is called.
 *
 * That containment is the point. `useGoogleLogin` runs an effect that calls
 * Google's `initTokenClient({ client_id })`, and Google **throws** when the id
 * is an empty string. Calling the hook at the top of an auth form and merely
 * hiding the button when unconfigured does not work — a hook cannot be
 * conditional, so the effect still runs, still throws, and takes the whole page
 * down during hydration. The server renders fine and the client dies, which is
 * the confusing kind of failure.
 *
 * Never render this directly — go through `GoogleSignIn`, which is what decides
 * whether mounting it is safe.
 */
function GoogleAuthButton({
  label,
  loadingLabel = "Signing you in…",
  redirectTo,
  onError,
  disabled,
  className,
}: GoogleButtonProps) {
  const google = useGoogleAuth({ redirectTo });

  return (
    <GoogleButtonShell
      label={label}
      loadingLabel={loadingLabel}
      isLoading={google.isLoading}
      onClick={() => google.signIn(onError)}
      disabled={disabled}
      className={className}
    />
  );
}

/**
 * Stand-in shown when no client id is configured.
 *
 * The button stays on the screen either way — the backend route and the Google
 * credentials are still being set up, and the auth screens are being designed
 * around a Google option that is going to exist. It calls no hook, so none of
 * the `initTokenClient` throw applies.
 *
 * Clicking reports why it can't run rather than doing nothing: a button that
 * silently ignores clicks is the failure mode that costs the most time to
 * diagnose. The copy differs by environment because the audiences do — a
 * visitor needs to know what to do instead, a developer needs to know which
 * variable is missing.
 */
function GoogleAuthButtonPreview({
  label,
  onError,
  disabled,
  className,
}: GoogleButtonProps) {
  return (
    <GoogleButtonShell
      label={label}
      loadingLabel=""
      isLoading={false}
      onClick={() =>
        onError(
          process.env.NODE_ENV === "development"
            ? "Google sign-in isn't configured — set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env and restart the dev server."
            : "Google sign-in isn't available yet. Please sign in with your email and password.",
        )
      }
      disabled={disabled}
      className={className}
    />
  );
}

/**
 * Renders the Google button, live or inert. This is the component the auth
 * pages use — the button is always on the screen.
 *
 * - Client id set → the real button, running the full OAuth flow.
 * - No client id → an identical inert button that explains itself on click.
 *
 * It switches to the live flow the moment `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is
 * set; nothing at the call sites changes.
 *
 * The branch has to be here rather than inside `GoogleAuthButton`, because
 * *mounting* that component is what runs `useGoogleAuth` — and the hook throws
 * on an empty client id. An early `return null` inside it would be too late,
 * since hooks run before it.
 */
export function GoogleSignIn(props: GoogleButtonProps) {
  return isGoogleAuthConfigured ? (
    <GoogleAuthButton {...props} />
  ) : (
    <GoogleAuthButtonPreview {...props} />
  );
}

/**
 * The "or" rule between the Google button and the email form.
 *
 * `aria-hidden` because it is purely visual punctuation — a screen reader
 * announcing "or" between two already-labelled controls adds noise without
 * adding orientation.
 */
export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative flex items-center py-1" aria-hidden="true">
      {/*
        `border-t` with no colour picks up `border-border` from the base layer —
        the same token the inputs and the Google button border use, so the three
        horizontals on this card are all one weight. `text-gray-400` matches the
        input placeholders, the app's established secondary text colour.
      */}
      <div className="grow border-t" />
      <span className="mx-3 text-xs font-medium uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <div className="grow border-t" />
    </div>
  );
}
