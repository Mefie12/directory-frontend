"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrganizationsGate } from "@/components/dashboard/organizations/organizations-gate";
import { useOrganizations } from "@/hooks/useOrganizations";
import { decideSensitiveReview, getSensitiveReviews, OrganizationApiError } from "@/lib/api";
import { SENSITIVE_FIELD_LABEL, type PendingReviewField, type SensitiveReviewItem, type SensitiveReviewPage } from "@/types/organization";
import { getAuthToken } from "@/lib/client-auth";

const token = () => getAuthToken() ?? undefined;

function show(field: PendingReviewField, side: "current" | "proposed"): string {
  const labels = side === "current" ? field.current_labels : field.proposed_labels;
  if (labels) return labels.join(", ") || "none";
  const value = field[side];
  return value === null || value === undefined || value === "" ? "empty" : String(value);
}

type Pending = { item: SensitiveReviewItem; decision: "reject" | "changes_requested" };

function ReviewQueue() {
  const { sensitiveReview } = useOrganizations();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<SensitiveReviewPage | null>(null);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [asking, setAsking] = useState<Pending | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(
    () =>
      getSensitiveReviews("pending", page, token())
        .then((data) => {
          setResult(data);
          setFailed(false);
        })
        .catch(() => setFailed(true)),
    [page],
  );

  useEffect(() => {
    if (sensitiveReview) void load();
  }, [sensitiveReview, load]);

  if (!sensitiveReview) return <p className="p-8 text-gray-600">Edit review is not enabled.</p>;

  const decide = async (item: SensitiveReviewItem, decision: "approve" | "reject" | "changes_requested", why?: string) => {
    setBusyId(item.id);
    try {
      await decideSensitiveReview(item.id, { decision, reason: why, expected_revision_version: item.revision_version }, token());
      toast.success(decision === "approve" ? "Change approved and published." : "Decision recorded.");
      setAsking(null);
      setReason("");
      await load();
    } catch (error) {
      toast.error(error instanceof OrganizationApiError ? error.message : "Something went wrong. Please try again.");
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4 p-4 lg:p-8">
      <div>
        <h1 className="text-xl font-bold text-[#1F3A4C]">Edit reviews</h1>
        <p className="text-sm text-gray-500">Changes to name, category, location or contact email on published organization listings. The live values stay until you approve.</p>
      </div>

      {failed ? (
        <p className="text-sm text-red-600">We couldn&apos;t load the review queue.</p>
      ) : !result ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : result.data.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-500">Nothing is waiting for review.</p>
      ) : (
        <ul className="space-y-3">
          {result.data.map((item) => {
            const inactive = item.listing.organization && item.listing.organization.status !== "active";
            const notLive = item.listing.status !== "approved";
            return (
              <li key={item.id} className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Link href={`/dashboard/listings/${item.listing.slug}`} className="font-semibold text-[#1F3A4C] hover:underline">
                      {item.listing.name}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {item.listing.organization?.name ?? "No organization"} · by {item.author?.name ?? "unknown"}
                      {item.submitted_at && ` · ${new Date(item.submitted_at).toLocaleString()}`}
                    </p>
                  </div>
                  {inactive && <Badge variant="secondary">Organization {item.listing.organization?.status}</Badge>}
                  {notLive && <Badge variant="secondary">Listing {item.listing.status}</Badge>}
                </div>

                <ul className="space-y-1 rounded-lg bg-gray-50 p-3 text-sm">
                  {item.review?.fields.map((field) => (
                    <li key={field.field}>
                      <strong>{SENSITIVE_FIELD_LABEL[field.field] ?? field.field}:</strong>{" "}
                      <span className="text-gray-500 line-through">{show(field, "current")}</span> → <span className="font-medium">{show(field, "proposed")}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-2">
                  <Button
                    className="bg-[#93C01F] text-white hover:bg-[#82ab1b]"
                    disabled={busyId === item.id || !!inactive || notLive}
                    onClick={() => void decide(item, "approve")}
                  >
                    Approve
                  </Button>
                  <Button variant="outline" disabled={busyId === item.id} onClick={() => setAsking({ item, decision: "changes_requested" })}>
                    Request changes
                  </Button>
                  <Button variant="outline" className="text-red-700" disabled={busyId === item.id} onClick={() => setAsking({ item, decision: "reject" })}>
                    Reject
                  </Button>
                </div>
                {(inactive || notLive) && (
                  <p className="text-xs text-gray-500">Approval is unavailable while the organization or listing is not live.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {result && result.last_page > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {result.last_page}
          </span>
          <Button variant="outline" size="sm" disabled={page >= result.last_page} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <Dialog open={asking !== null} onOpenChange={(open) => !open && setAsking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{asking?.decision === "reject" ? "Reject this change?" : "Request changes"}</DialogTitle>
            <DialogDescription>The author sees your reason. The live listing stays unchanged.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="review-reason">Reason</Label>
            <Input id="review-reason" value={reason} maxLength={1000} onChange={(event) => setReason(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAsking(null)}>
              Cancel
            </Button>
            <Button
              variant={asking?.decision === "reject" ? "destructive" : "default"}
              disabled={!reason.trim() || busyId !== null}
              onClick={() => asking && void decide(asking.item, asking.decision, reason.trim())}
            >
              {asking?.decision === "reject" ? "Reject" : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SensitiveReviewsPage() {
  return (
    <OrganizationsGate>
      <ReviewQueue />
    </OrganizationsGate>
  );
}
