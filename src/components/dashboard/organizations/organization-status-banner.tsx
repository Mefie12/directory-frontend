"use client";

import { useState } from "react";
import { Archive, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OrganizationApiError, restoreOrganization } from "@/lib/api";
import { getAuthToken } from "@/lib/client-auth";

interface Props {
  slug: string;
  status: "active" | "suspended" | "archived";
  reason?: string | null;
  /** Permission organization.archive: Owners may restore their own archived organization. */
  canRestore: boolean;
  onRestored: () => Promise<void> | void;
}

/** Explains why an archived or suspended organization is read-only (V2 Phase 2 spec §7.3). */
export function OrganizationStatusBanner({ slug, status, reason, canRestore, onRestored }: Props) {
  const [busy, setBusy] = useState(false);
  if (status === "active") return null;

  const archived = status === "archived";
  const Icon = archived ? Archive : ShieldAlert;

  const restore = async () => {
    setBusy(true);
    try {
      await restoreOrganization(slug, getAuthToken() ?? undefined);
      toast.success("Organization restored.");
      await onRestored();
    } catch (error) {
      toast.error(error instanceof OrganizationApiError ? error.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="status"
      className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
        archived ? "border-gray-200 bg-gray-50" : "border-red-200 bg-red-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${archived ? "text-gray-500" : "text-red-600"}`} />
        <div>
          <p className="font-medium text-[#1F3A4C]">
            {archived ? "This organization is archived." : "This organization is suspended."}
          </p>
          <p className="text-sm text-gray-600">
            {archived
              ? "It is read-only. Restore it to make changes again."
              : "Its published listings are not public and nothing can be changed until Me-fie restores it. Contact support if you think this is a mistake."}
            {reason && <> Reason: {reason}</>}
          </p>
        </div>
      </div>
      {archived && canRestore && (
        <Button variant="outline" disabled={busy} onClick={() => void restore()}>
          {busy ? "Restoring…" : "Restore organization"}
        </Button>
      )}
    </div>
  );
}
