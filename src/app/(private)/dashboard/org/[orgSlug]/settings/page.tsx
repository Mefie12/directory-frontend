"use client";

import {
  OrganizationWorkspaceHeader,
  OrganizationSettingsSection,
} from "@/components/dashboard/organizations/organization-workspace";

export default function OrganizationSettingsPage() {
  return (
    <div className="space-y-6 p-4 lg:p-8">
      <OrganizationWorkspaceHeader />
      <OrganizationSettingsSection />
    </div>
  );
}
