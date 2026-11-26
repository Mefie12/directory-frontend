"use client";

import {
  OrganizationWorkspaceHeader,
  OrganizationBillingSection,
} from "@/components/dashboard/organizations/organization-workspace";

export default function OrganizationBillingPage() {
  return (
    <div className="space-y-6 p-4 lg:p-8">
      <OrganizationWorkspaceHeader />
      <OrganizationBillingSection />
    </div>
  );
}
