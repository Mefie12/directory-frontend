"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useWorkspace } from "@/hooks/useWorkspace";
import { organizationPath } from "@/lib/workspace";

/**
 * V2 workspaces: the old /dashboard/my-listing pages now live inside an
 * organization. While workspaces apply, send a vendor or customer to the same
 * page in their default organization (the listing detail page then moves to
 * the listing's own organization if it differs).
 *
 * Right after a first listing the auth payload may not list the new
 * organization yet, so the user is refreshed once before giving up and showing
 * the classic page.
 *
 * @param subPath Path inside the organization, e.g. "listings" or "listings/abc".
 * @returns true while a redirect is under way (render a spinner).
 */
export function useLegacyListingRedirect(subPath: string): boolean {
  const router = useRouter();
  const { loading } = useAuth();
  const { enabled } = useWorkspace();
  const { defaultOrganization, refresh } = useOrganizations();
  const refreshed = useRef(false);
  const targetSlug = defaultOrganization?.slug ?? null;

  useEffect(() => {
    if (loading || !enabled) return;
    if (targetSlug) {
      router.replace(organizationPath(targetSlug, subPath));
      return;
    }
    if (!refreshed.current) {
      refreshed.current = true;
      void refresh();
    }
  }, [loading, enabled, targetSlug, subPath, router, refresh]);

  return loading || (enabled && targetSlug !== null);
}
