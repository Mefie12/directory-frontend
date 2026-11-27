"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ListingDetailPage from "@/components/dashboard/listing/listing-detail-page";
import { getListingManagement, type ListingManagementCapabilities } from "@/lib/api";
import { getAuthToken } from "@/lib/client-auth";
import { organizationPath } from "@/lib/workspace";

const VIEW_ONLY: ListingManagementCapabilities = {
  can_edit: false,
  can_manage_services: false,
  can_reply_to_reviews: false,
};

/**
 * A listing inside an organization workspace. Asks Laravel what this member may
 * do (management capabilities) so view-only members never see buttons that
 * would 403, and moves the page to the listing's own organization if the URL
 * names a different one (e.g. an old /dashboard/my-listing link).
 */
export function OrganizationListingDetail({ orgSlug, listingSlug }: { orgSlug: string; listingSlug: string }) {
  const router = useRouter();
  const [capabilities, setCapabilities] = useState<ListingManagementCapabilities | null>(null);
  // ListingDetailPage unwraps params with use(); the promise must be stable across renders.
  const params = useMemo(() => Promise.resolve({ slug: listingSlug }), [listingSlug]);

  useEffect(() => {
    let cancelled = false;
    getListingManagement(listingSlug, getAuthToken() ?? undefined)
      .then((listing) => {
        if (cancelled) return;
        const owner = listing.organization?.slug;
        if (owner && owner !== orgSlug) {
          router.replace(`${organizationPath(owner, "listings")}/${encodeURIComponent(listingSlug)}`);
          return;
        }
        setCapabilities(listing.capabilities);
      })
      .catch(() => {
        // Typically 403: a member who may see the organization but not manage this listing.
        if (!cancelled) setCapabilities(VIEW_ONLY);
      });
    return () => {
      cancelled = true;
    };
  }, [listingSlug, orgSlug, router]);

  if (!capabilities) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#93C01F]" />
      </div>
    );
  }

  return <ListingDetailPage params={params} capabilities={capabilities} />;
}
