"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

import {
  getOrgVerification,
  requestOrgVerification,
  withdrawOrgVerification,
  type OrgVerificationOverview,
  type OrgVerificationStatus,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STATUS_COPY: Record<OrgVerificationStatus, { label: string; help: string }> = {
  unverified: { label: "Not verified", help: "Send a registration document or similar proof and our team will review it." },
  pending: { label: "Pending review", help: "Your request is with our team. You can withdraw it while it is pending." },
  verified: { label: "Verified", help: "This organization is verified." },
  rejected: { label: "Declined", help: "Your last request was declined. You can send a new one." },
  revoked: { label: "Verification removed", help: "Verification was removed. You can send a new request." },
};

const MAX_FILES = 3;
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";

interface Props {
  slug: string;
  /** Holds organization.verify: may request or withdraw. Others see the status only. */
  canRequest: boolean;
}

/** Settings panel: verification status, request form, withdraw and history (V2 Phase 4.2). */
export function OrganizationVerification({ slug, canRequest }: Props) {
  const [overview, setOverview] = useState<OrgVerificationOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const token = () => localStorage.getItem("authToken") ?? undefined;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOverview(await getOrgVerification(slug, token()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load verification");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    if (files.length === 0) {
      setFormError("Add at least one document.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await requestOrgVerification(slug, { note, documents: files }, token());
      toast.success("Verification request sent.");
      setFiles([]);
      setNote("");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    setBusy(true);
    try {
      await withdrawOrgVerification(slug, token());
      toast.success("Request withdrawn.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not withdraw");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex max-w-xl items-center gap-2 rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-500 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading verification…
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="max-w-xl rounded-2xl border border-red-100 bg-white p-5 text-sm text-red-700 shadow-sm">
        {error ?? "Could not load verification"}{" "}
        <Button variant="link" className="h-auto p-0" onClick={() => void load()}>Retry</Button>
      </div>
    );
  }

  const status = overview.verification_status;
  const copy = STATUS_COPY[status];
  const canAsk = canRequest && ["unverified", "rejected", "revoked"].includes(status);
  const latest = overview.latest_request;

  return (
    <div className="max-w-xl space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-semibold text-[#1F3A4C]">
          <BadgeCheck className="h-5 w-5" /> Verification
        </h3>
        <Badge variant={status === "verified" ? "default" : "outline"}>{copy.label}</Badge>
      </div>
      <p className="text-sm text-gray-600">{copy.help}</p>

      {(status === "rejected" || status === "revoked") && (latest?.decision_reason || overview.history[0]?.reason) && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Reason given: {status === "rejected" ? latest?.decision_reason : overview.history[0]?.reason}
        </p>
      )}

      {status === "pending" && canRequest && (
        <Button variant="outline" disabled={busy} onClick={() => void withdraw()}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Withdraw request
        </Button>
      )}

      {canAsk && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="verification-docs">Documents (up to {MAX_FILES}; PDF or image, 5 MB each)</Label>
            <input
              id="verification-docs"
              type="file"
              accept={ACCEPT}
              multiple
              className="block w-full text-sm"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, MAX_FILES))}
            />
            {files.length > 0 && <p className="text-xs text-gray-500">{files.map((f) => f.name).join(", ")}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="verification-note">Note (optional)</Label>
            <Textarea id="verification-note" value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Button disabled={busy} onClick={() => void submit()}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Request verification
          </Button>
        </div>
      )}

      {overview.history.length > 0 && (
        <details className="text-sm text-gray-600">
          <summary className="cursor-pointer font-medium text-[#1F3A4C]">History</summary>
          <ul className="mt-2 space-y-1">
            {overview.history.map((h, i) => (
              <li key={i}>
                {new Date(h.created_at).toLocaleDateString()}: {h.from_status} → {h.to_status}
                {h.reason ? ` (${h.reason})` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
