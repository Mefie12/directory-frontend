"use client";

import { useEffect, useState } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { getListingManagement, type ListingLinkCheck } from "@/lib/api";
import { getAuthToken } from "@/lib/client-auth";

/** One request per listing while the editor is open; both link fields share it. */
const cache = new Map<string, Promise<ListingLinkCheck[]>>();

function linkChecks(slug: string): Promise<ListingLinkCheck[]> {
  let pending = cache.get(slug);
  if (!pending) {
    pending = getListingManagement(slug, getAuthToken() ?? undefined)
      .then((listing) => listing.link_checks ?? [])
      .catch(() => []);
    cache.set(slug, pending);
    // Re-read next time the editor opens: the vendor may have fixed the link.
    setTimeout(() => cache.delete(slug), 30_000);
  }
  return pending;
}

/**
 * V2 Phase 6.1 (decision C-9): a saved website or WhatsApp link that fails the link
 * policy is hidden from the public page without a notification. This notice is how
 * the business finds out, next to the field, with what to fix.
 */
export function LinkCheckNotice({ listingSlug, field }: { listingSlug?: string; field: ListingLinkCheck["field"] }) {
  const [check, setCheck] = useState<ListingLinkCheck | null>(null);

  useEffect(() => {
    if (!listingSlug) return;
    let cancelled = false;
    void linkChecks(listingSlug).then((checks) => {
      if (!cancelled) setCheck(checks.find((item) => item.field === field) ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [listingSlug, field]);

  if (!check || check.status === "ok" || check.status === "none") return null;

  return (
    <div role="status" className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      <WarningCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" weight="fill" aria-hidden="true" />
      <p>
        <span className="font-semibold">This link isn&apos;t shown on your public page.</span>{" "}
        {check.message ?? "It doesn't meet Mefie's link rules."} Update it to show it again.
      </p>
    </div>
  );
}
