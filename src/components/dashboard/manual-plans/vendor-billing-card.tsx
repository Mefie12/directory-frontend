"use client";

import { useEffect, useState } from "react";
import { Gem } from "lucide-react";

import { ListingBillingSummary, getListingManagement } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { formatUtcDate, tierLabel } from "./manual-plan-utils";
import { getAuthToken } from "@/lib/client-auth";

interface Props {
  slug: string;
  /** Told whether a manual plan exists, so the page can avoid showing a second, contradicting plan label. */
  onLoaded?: (billing: ListingBillingSummary | null) => void;
}

const STATUS_COPY: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-50 text-green-700 border-green-200" },
  grace: { label: "Renewal due", className: "bg-amber-50 text-amber-800 border-amber-200" },
  ended: { label: "Ended", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

/**
 * Read-only plan summary for a listing owner whose plan is billed by invoice.
 * It only ever shows the tier, the state, the renewal date and who to contact.
 * The backend never sends price, invoice, notes or custom limits to this view.
 * Renders nothing for listings without a manually billed plan.
 */
export function VendorBillingCard({ slug, onLoaded }: Props) {
  const [billing, setBilling] = useState<ListingBillingSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token = getAuthToken() ?? undefined;

    getListingManagement(slug, token)
      .then((data) => {
        if (cancelled) return;
        setBilling(data.billing ?? null);
        onLoaded?.(data.billing ?? null);
      })
      // A missing card must never break the page it sits on.
      .catch(() => {
        if (!cancelled) setBilling(null);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, onLoaded]);

  if (!billing) return null;

  const status = STATUS_COPY[billing.status ?? "active"] ?? STATUS_COPY.active;
  const ended = billing.status === "ended";

  return (
    <section aria-label="Your plan" className="rounded-lg border bg-slate-50 p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Gem className="h-4 w-4 text-[#548235]" />
        <h3 className="font-semibold text-slate-900">{tierLabel(billing.plan)} plan</h3>
        <Badge variant="outline" className={status.className}>{status.label}</Badge>
      </div>
      <p className="mt-1 text-slate-500">This plan is managed for you by Mefie.</p>

      <div className="mt-2">
        {billing.renews_on && (
          <Row label={ended ? "Ended on" : "Renews on"}>{formatUtcDate(billing.renews_on)}</Row>
        )}
        {billing.access_until && billing.status === "grace" && (
          <Row label="Features stay on until">{formatUtcDate(billing.access_until)}</Row>
        )}
      </div>

      {billing.contact_email && (
        <p className="mt-2 text-slate-600">
          To renew or change your plan, contact{" "}
          <a href={`mailto:${billing.contact_email}`} className="text-[#548235] hover:underline">{billing.contact_email}</a>.
        </p>
      )}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-200/70 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900">{children}</span>
    </div>
  );
}
