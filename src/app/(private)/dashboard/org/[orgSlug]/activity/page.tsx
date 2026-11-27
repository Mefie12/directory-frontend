"use client";

import {
  OrganizationWorkspaceHeader,
  OrganizationActivitySection,
} from "@/components/dashboard/organizations/organization-workspace";

export default function OrganizationActivityPage() {
  return (
    <div className="space-y-6 p-4 lg:p-8">
      <OrganizationWorkspaceHeader />
      <OrganizationActivitySection />
    </div>
  );
}
