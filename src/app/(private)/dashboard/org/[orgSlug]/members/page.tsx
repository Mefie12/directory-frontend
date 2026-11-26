"use client";

import {
  OrganizationWorkspaceHeader,
  OrganizationMembersSection,
} from "@/components/dashboard/organizations/organization-workspace";

export default function OrganizationMembersPage() {
  return (
    <div className="space-y-6 p-4 lg:p-8">
      <OrganizationWorkspaceHeader />
      <OrganizationMembersSection />
    </div>
  );
}
