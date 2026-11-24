"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import type { OrganizationMembership, OrgPermission } from "@/types/organization";

/**
 * V2 Phase 1: the one place components ask about organizations.
 *
 * - `enabled` follows the backend (user.features.organizations). When false,
 *   every organization UI must render nothing, so the app looks exactly as
 *   before.
 * - `active` is the organization in the URL (/dashboard/org/[orgSlug]/…).
 * - `defaultOrganization` mirrors the backend's default (the user's primary-
 *   owner organization, oldest first).
 * - `can()` checks a permission on the active organization. Never check role
 *   names in components.
 */
export function useOrganizations() {
  const { user, refreshUser } = useAuth();
  const params = useParams<{ orgSlug?: string }>();

  return useMemo(() => {
    const enabled = user?.features?.organizations === true;
    // V2 Phase 2: teams (invites, member management, activity) follow their own backend flag.
    const teams = enabled && user?.features?.teams === true;
    // V2 Phase 2.4: archive / restore / suspend follow their own backend flag.
    const lifecycle = enabled && user?.features?.lifecycle === true;
    // V2 Phase 2.6: held review of sensitive edits on live organization listings.
    const sensitiveReview = enabled && user?.features?.sensitive_review === true;
    // V2 Phase 3a.3: the organization Billing tab for billing holders.
    const orgBilling = enabled && user?.features?.org_billing === true;
    const organizations: OrganizationMembership[] = enabled ? (user?.organizations ?? []) : [];
    const activeSlug = typeof params?.orgSlug === "string" ? params.orgSlug : null;
    const active = activeSlug ? (organizations.find((org) => org.slug === activeSlug) ?? null) : null;
    const defaultOrganization =
      organizations.find((org) => org.is_primary_owner) ?? organizations[0] ?? null;

    const can = (permission: OrgPermission, organization: OrganizationMembership | null = active) =>
      !!organization && organization.permissions.includes(permission);

    return {
      enabled,
      teams,
      lifecycle,
      sensitiveReview,
      orgBilling,
      organizations,
      active,
      activeSlug,
      defaultOrganization,
      can,
      /** Organizations where the user may create listings (wizard picker). */
      creatable: organizations.filter((org) => org.permissions.includes("listing.create")),
      /** Re-fetch the user after creating or editing an organization. */
      refresh: refreshUser,
    };
  }, [user, params?.orgSlug, refreshUser]);
}
