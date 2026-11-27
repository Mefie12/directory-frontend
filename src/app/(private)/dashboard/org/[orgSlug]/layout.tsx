"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { OrganizationsGate } from "@/components/dashboard/organizations/organizations-gate";
import { OrganizationWorkspaceProvider } from "@/components/dashboard/organizations/organization-workspace";

/**
 * Every page of an organization workspace (/dashboard/org/[orgSlug]/...).
 * Dark while organizations are off (OrganizationsGate), and loads the
 * organization once for all its pages. Non-members are sent back to /dashboard/org.
 */
export default function OrganizationWorkspaceLayout({ children }: { children: ReactNode }) {
  const { orgSlug } = useParams<{ orgSlug: string }>();

  return (
    <OrganizationsGate>
      <OrganizationWorkspaceProvider key={orgSlug} slug={orgSlug}>
        {children}
      </OrganizationWorkspaceProvider>
    </OrganizationsGate>
  );
}
