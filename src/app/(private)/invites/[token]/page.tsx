"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { acceptInvite, declineInvite, getInvitePreview, OrganizationApiError } from "@/lib/api";
import { ORG_ROLE_LABEL, type InvitePreview } from "@/types/organization";

type View =
  | { kind: "loading" }
  | { kind: "ready"; preview: InvitePreview }
  | { kind: "gone"; title: string; text: string }
  | { kind: "declined" };

const GONE_TEXT: Record<string, { title: string; text: string }> = {
  invite_expired: { title: "This invitation has expired", text: "Ask the team to send you a new invitation." },
  invite_used: { title: "This invitation was already used", text: "It has been accepted, declined or withdrawn. Ask the team for a new one if you still need access." },
  invite_unavailable: { title: "This invitation is no longer available", text: "The organization is not accepting new members right now." },
};

/**
 * Invitation landing page (V2 Phase 2 spec §5, §10). Works signed out: the
 * link only previews; sign-up / log-in return here, and accepting needs the
 * signed-in account whose email matches the invitation.
 */
export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { isAuthenticated, loading, user, refreshUser, logout } = useAuth();
  const [view, setView] = useState<View>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [wrongAccount, setWrongAccount] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getInvitePreview(token)
      .then((preview) => !cancelled && setView({ kind: "ready", preview }))
      .catch((error: unknown) => {
        if (cancelled) return;
        const reason = error instanceof OrganizationApiError ? error.reason : undefined;
        setView({
          kind: "gone",
          ...(reason && GONE_TEXT[reason]
            ? GONE_TEXT[reason]
            : { title: "This invitation link isn't valid", text: "Check that you copied the whole link from the email." }),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const redirect = encodeURIComponent(`/invites/${token}`);

  const accept = async () => {
    setBusy(true);
    try {
      const result = await acceptInvite(token, localStorage.getItem("authToken") ?? undefined);
      toast.success(`You joined ${result.organization.name}.`);
      await refreshUser();
      router.push(`/dashboard/org/${result.organization.slug}`);
    } catch (error) {
      if (error instanceof OrganizationApiError && error.reason === "invite_wrong_account") {
        setWrongAccount(true);
      } else {
        toast.error(error instanceof OrganizationApiError ? error.message : "Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    setBusy(true);
    try {
      await declineInvite(token);
      setView({ kind: "declined" });
    } catch (error) {
      toast.error(error instanceof OrganizationApiError ? error.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg items-center p-4">
      <div className="w-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {(view.kind === "loading" || loading) && <Skeleton className="h-40 w-full rounded-xl" />}

        {view.kind === "gone" && !loading && (
          <div className="text-center">
            <h1 className="text-xl font-semibold text-[#1F3A4C]">{view.title}</h1>
            <p className="mt-2 text-gray-600">{view.text}</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/">Go to Me-fie</Link>
            </Button>
          </div>
        )}

        {view.kind === "declined" && (
          <div className="text-center">
            <h1 className="text-xl font-semibold text-[#1F3A4C]">Invitation declined</h1>
            <p className="mt-2 text-gray-600">No problem. You can close this page.</p>
          </div>
        )}

        {view.kind === "ready" && !loading && (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#1F3A4C]">
              <Building2 className="h-7 w-7 text-[#93C01F]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1F3A4C]">Join {view.preview.organization.name}</h1>
              <p className="mt-2 text-gray-600">
                {view.preview.invited_by ? `${view.preview.invited_by} invited` : "You were invited"} <strong>{view.preview.email}</strong>{" "}
                to join as <strong>{ORG_ROLE_LABEL[view.preview.role]}</strong>.
              </p>
              <p className="mt-1 text-xs text-gray-500">Expires {new Date(view.preview.expires_at).toLocaleDateString()}</p>
            </div>

            {!isAuthenticated ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {view.preview.account_exists
                    ? `Log in as ${view.preview.email} to accept.`
                    : `Create an account with ${view.preview.email} to accept.`}
                </p>
                <Button asChild className="w-full bg-[#93C01F] text-white hover:bg-[#82ab1b]">
                  <Link href={`/auth/${view.preview.account_exists ? "login" : "signup"}?redirect=${redirect}`}>
                    {view.preview.account_exists ? "Log in" : "Sign up"}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/auth/${view.preview.account_exists ? "signup" : "login"}?redirect=${redirect}`}>
                    {view.preview.account_exists ? "I need an account" : "I already have an account"}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {wrongAccount && (
                  <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    This invitation was sent to {view.preview.email}, but you&apos;re signed in as {user?.email}. Log out and sign in with the invited
                    address.{" "}
                    <button
                      type="button"
                      className="font-medium underline"
                      onClick={() => {
                        logout();
                        router.push(`/auth/login?redirect=${redirect}`);
                      }}
                    >
                      Log out
                    </button>
                  </p>
                )}
                <Button className="w-full bg-[#93C01F] text-white hover:bg-[#82ab1b]" disabled={busy} onClick={() => void accept()}>
                  {busy ? "Joining…" : "Accept invitation"}
                </Button>
                <Button variant="ghost" className="w-full" disabled={busy} onClick={() => void decline()}>
                  Decline
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
