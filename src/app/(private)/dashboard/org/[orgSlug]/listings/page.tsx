"use client";

import { useParams } from "next/navigation";
import MyListingsPage from "@/components/dashboard/listing/my-listings-page";

export default function OrganizationListingsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  return <MyListingsPage organizationSlug={orgSlug} />;
}
