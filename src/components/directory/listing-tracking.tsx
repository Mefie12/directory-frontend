"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import type { ListingActionKind } from "@/lib/directory/listing-actions";
import { trackListingAction, type ListingInteractionPlacement } from "@/lib/directory/listing-interactions";

/** The listing whose contact actions are being counted; null in preview mode (never counted). */
const ListingTrackingContext = createContext<string | null>(null);

/** V2 Phase 6.3: wraps a public listing page so its contact actions are counted. */
export function ListingTrackingProvider({ slug, children }: { slug: string | null; children: ReactNode }) {
  return <ListingTrackingContext.Provider value={slug}>{children}</ListingTrackingContext.Provider>;
}

/** A callback that reports a contact action used at `placement`; does nothing outside a provider. */
export function useTrackListingAction(placement: ListingInteractionPlacement): (action: ListingActionKind) => void {
  const slug = useContext(ListingTrackingContext);
  return useCallback(
    (action: ListingActionKind) => {
      if (slug) trackListingAction(slug, action, placement);
    },
    [slug, placement],
  );
}
