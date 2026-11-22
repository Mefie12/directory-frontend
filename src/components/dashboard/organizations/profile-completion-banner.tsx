"use client";

import { useState } from "react";
import { Building2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateOrganization } from "@/lib/api";
import type { OrganizationMembership } from "@/types/organization";

interface Props {
  organization: OrganizationMembership;
  onCompleteProfile: () => void;
  onDismissed: () => Promise<void> | void;
}

/**
 * One-time prompt for organizations created automatically (backfill or first
 * listing) to confirm their name and details (spec §9.9). Only shown to
 * members who may edit the profile. Not a gate: dismissing is always allowed.
 */
export function ProfileCompletionBanner({ organization, onCompleteProfile, onDismissed }: Props) {
  const [dismissing, setDismissing] = useState(false);

  if (organization.profile_completed || !organization.permissions.includes("organization.update")) {
    return null;
  }

  const dismiss = async () => {
    setDismissing(true);
    try {
      const token = localStorage.getItem("authToken") ?? undefined;
      await updateOrganization(organization.slug, { mark_profile_complete: true }, token);
      await onDismissed();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not dismiss. Please try again.");
    } finally {
      setDismissing(false);
    }
  };

  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#93C01F]/30 bg-[#93C01F]/10 px-4 py-3 text-sm text-[#1F3A4C]">
      <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-[#93C01F]" />
      <div className="flex-1">
        <p className="font-semibold">Complete your organization profile</p>
        <p className="mt-0.5 text-gray-600">
          We set up <span className="font-medium">{organization.name}</span> for you automatically. Check its name and country so it&apos;s ready
          when you add team members.
        </p>
        <div className="mt-2 flex gap-2">
          <Button size="sm" className="bg-[#93C01F] text-white hover:bg-[#82ab1b]" onClick={onCompleteProfile}>
            Complete profile
          </Button>
          <Button size="sm" variant="ghost" onClick={dismiss} disabled={dismissing}>
            {dismissing ? "Dismissing…" : "Dismiss"}
          </Button>
        </div>
      </div>
      <button type="button" onClick={dismiss} disabled={dismissing} aria-label="Dismiss" className="text-gray-400 hover:text-gray-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
