"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { OrganizationsGate } from "@/components/dashboard/organizations/organizations-gate";
import { OrganizationHub } from "@/components/dashboard/organizations/organization-hub";

export default function OrganizationPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();

  return (
    <OrganizationsGate>
      <Suspense>
        <OrganizationHub slug={orgSlug} />
      </Suspense>
    </OrganizationsGate>
  );
}
