"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { cn } from "@/lib/utils";

/**
 * The Google sign-in button.
 *
 * No configuration guard any more. The backend builds the Google consent URL,
 * so there is no client id for this app to hold and nothing that can be
 * missing here — if Google sign-in is misconfigured it is a backend concern,
 * and it surfaces as an inline error on click rather than as a button that
 * silently isn't there.
 */
export function GoogleSignIn({
  label,
  loadingLabel = "Redirecting to Google…",
  redirectTo,
  onError,
  disabled,
  className,
}: {
  label: string;
  loadingLabel?: string;
  /** Where to land after signing in. Preserved across the round trip. */
  redirectTo: string;
  onError: (message: string) => void;
  /** True while the sibling password form is submitting. */
  disabled?: boolean;
  className?: string;
}) {
  const google = useGoogleAuth({ redirectTo });

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void google.signIn(onError)}
      disabled={disabled || google.isLoading}
      // `aria-busy` rather than only swapping the label: a screen reader that
      // has already announced the button won't re-read a changed label, but it
      // will report the busy state.
      aria-busy={google.isLoading}
      /*
        Deliberately thin. Border colour, background, hover, disabled opacity,
        radius and icon gap all come from the `outline` variant and the shared
        base layer, which is what keeps this matching the inputs and the Sign in
        button beneath it.

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
      {google.isLoading ? (
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
      {google.isLoading ? loadingLabel : label}
    </Button>
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
