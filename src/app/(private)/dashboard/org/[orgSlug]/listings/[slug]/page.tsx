"use client";

import { useParams } from "next/navigation";
import { OrganizationListingDetail } from "@/components/dashboard/organizations/organization-listing-detail";

export default function OrganizationListingDetailPage() {
  const { orgSlug, slug } = useParams<{ orgSlug: string; slug: string }>();
  return <OrganizationListingDetail orgSlug={orgSlug} listingSlug={slug} />;
}
