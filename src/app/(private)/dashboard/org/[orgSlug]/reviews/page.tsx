"use client";

import { useParams } from "next/navigation";
import ReviewsView from "@/components/dashboard/reviews/reviews-view";

export default function OrganizationReviewsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  return <ReviewsView organizationSlug={orgSlug} />;
}
