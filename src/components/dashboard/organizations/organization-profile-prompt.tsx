"use client";

import { useRouter } from "next/navigation";
import { useOrganizations } from "@/hooks/useOrganizations";
import { ProfileCompletionBanner } from "./profile-completion-banner";

/**
 * Dashboard-home version of the "complete your organization profile" prompt
 * (spec §9.9): backfilled vendors land on their home page, not the org hub.
 * Shows the first organization the user can edit that is still incomplete.
 * Renders nothing while organizations are off.
 */
export function OrganizationProfilePrompt() {
  const router = useRouter();
  const { enabled, organizations, refresh } = useOrganizations();

  if (!enabled) return null;

  const incomplete = organizations.find(
    (org) => !org.profile_completed && org.permissions.includes("organization.update"),
  );
  if (!incomplete) return null;

  return (
    <div className="px-1 pt-3 lg:px-8">
      <ProfileCompletionBanner
        organization={incomplete}
        onCompleteProfile={() => router.push(`/dashboard/org/${incomplete.slug}?tab=settings`)}
        onDismissed={refresh}
      />
    </div>
  );
}
