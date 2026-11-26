"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useOrganizations } from "@/hooks/useOrganizations";
import { normalizeRole } from "@/lib/roles";
import {
  organizationPath,
  organizationSlugFromPath,
  PERSONAL_HOME,
  writeLastWorkspace,
  type WorkspaceRef,
} from "@/lib/workspace";
import type { OrganizationMembership } from "@/types/organization";

/**
 * The dashboard workspace the user is in, read from the URL (see lib/workspace.ts).
 *
 * `enabled` is true only while organizations are on and the user is a vendor
 * or customer. Admins and listing agents keep their own dashboards, and with
 * organizations off everything behaves as before.
 */
export function useWorkspace() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { enabled: organizationsEnabled, organizations } = useOrganizations();
  const role = normalizeRole(user?.role ?? "customer");

  const enabled = organizationsEnabled && (role === "vendor" || role === "customer");
  const slug = enabled ? organizationSlugFromPath(pathname) : null;
  const organization: OrganizationMembership | null = slug
    ? (organizations.find((membership) => membership.slug === slug) ?? null)
    : null;

  const workspace: WorkspaceRef = useMemo(
    () => (slug ? { kind: "organization", slug } : { kind: "personal" }),
    [slug],
  );

  // Remember the last workspace actually opened, for the next landing on /dashboard.
  // Only organizations the user belongs to count; a stray slug never sticks.
  // /dashboard itself is the landing page, so it never records anything: the
  // switcher records Personal explicitly when the user picks it.
  const userId = user?.id;
  const rememberable =
    (workspace.kind === "personal" && pathname !== PERSONAL_HOME) || organization !== null;
  useEffect(() => {
    if (enabled && userId && rememberable) writeLastWorkspace(userId, workspace);
  }, [enabled, userId, rememberable, workspace]);

  return {
    enabled,
    workspace,
    /** The open organization's membership; null in Personal or for a non-member slug. */
    organization,
    isOrganization: workspace.kind === "organization",
    /** Build a link inside the open organization (falls back to Personal home). */
    orgPath: (subPath = "") => (slug ? organizationPath(slug, subPath) : "/dashboard"),
  };
}
