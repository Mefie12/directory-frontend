"use client";

import { useEffect, useState } from "react";
import { Clock } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getPendingReview, OrganizationApiError, withdrawPendingReview } from "@/lib/api";
import { SENSITIVE_FIELD_LABEL, type PendingReview, type PendingReviewField } from "@/types/organization";

function show(field: PendingReviewField, side: "current" | "proposed"): string {
  const labels = side === "current" ? field.current_labels : field.proposed_labels;
  if (labels) return labels.join(", ") || "none";
  const value = field[side];
  return value === null || value === undefined || value === "" ? "empty" : String(value);
}

interface Props {
  listingSlug: string;
  /** Refetch after each save finishes. */
  isSaving: boolean;
  currentStep: number;
}

/**
 * Explains a held edit on a live listing (V2 Phase 2 spec §9): what is waiting
 * for review, what stays live meanwhile, and lets the author withdraw it.
 * Renders nothing when the feature is off (the endpoint 404s) or nothing is held.
 */
export function PendingReviewBanner({ listingSlug, isSaving, currentStep }: Props) {
  const [review, setReview] = useState<PendingReview | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!listingSlug || isSaving) return;
    let cancelled = false;
    getPendingReview(listingSlug, localStorage.getItem("authToken") ?? undefined)
      .then((result) => !cancelled && setReview(result))
      .catch(() => !cancelled && setReview(null));
    return () => {
      cancelled = true;
    };
  }, [listingSlug, isSaving, currentStep]);

  if (!review) return null;

  const needsChanges = review.status === "changes_requested";

  const withdraw = async () => {
    setBusy(true);
    try {
      await withdrawPendingReview(listingSlug, localStorage.getItem("authToken") ?? undefined);
      setReview(null);
      toast.success("Your pending change was withdrawn.");
    } catch (error) {
      toast.error(error instanceof OrganizationApiError ? error.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="status" className="border-b border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
      <div className="mx-auto flex max-w-4xl flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="flex items-center gap-2 font-medium">
            <Clock className="h-4 w-4" />
            {needsChanges ? "Changes are needed before this edit can go live." : "Awaiting review: your current details stay live."}
          </p>
          {needsChanges && review.moderation_reason && <p>Reviewer note: {review.moderation_reason}</p>}
          <ul className="list-disc pl-5">
            {review.fields.map((field) => (
              <li key={field.field}>
                <strong>{SENSITIVE_FIELD_LABEL[field.field] ?? field.field}:</strong> {show(field, "current")} <span aria-hidden>→</span>{" "}
                <span className="sr-only">changing to</span> {show(field, "proposed")}
              </li>
            ))}
          </ul>
          <p className="text-xs text-blue-900">
            Name, category, location and contact email changes on a published listing are reviewed before they appear. Everything else publishes
            immediately.{needsChanges ? " Edit the field again to resubmit." : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" disabled={busy} onClick={() => void withdraw()}>
          Withdraw change
        </Button>
      </div>
    </div>
  );
}
