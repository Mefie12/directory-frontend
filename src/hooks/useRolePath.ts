"use client";

import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/hooks/useWorkspace";
import { normalizeRole, ROLE_BASE_PATH } from "@/lib/roles";
import { organizationPath } from "@/lib/workspace";

/**
 * Where listing-management links point. Inside an organization workspace they
 * stay inside it (/dashboard/org/{slug}/listings/...); everywhere else they use
 * the classic /dashboard/my-listing routes (admins, agents, organizations off).
 */
export function useRolePath() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role ?? "customer");
  const { workspace } = useWorkspace();

  if (workspace.kind === "organization") {
    const slug = workspace.slug;
    const listings = organizationPath(slug, "listings");
    return {
      role,
      basePath: ROLE_BASE_PATH,
      myListings: listings,
      listingCreate: (type: string) =>
        `${listings}/new?type=${type}&organization=${encodeURIComponent(slug)}`,
      listingEdit: (type: string, listingSlug: string) => `${listings}/edit?type=${type}&slug=${listingSlug}`,
      listingDetail: (listingSlug: string) => `${listings}/${listingSlug}`,
    };
  }

  return {
    role,
    basePath: ROLE_BASE_PATH,
    myListings: `${ROLE_BASE_PATH}/my-listing`,
    listingCreate: (type: string) => `${ROLE_BASE_PATH}/my-listing/create?type=${type}`,
    listingEdit: (type: string, slug: string) =>
      `${ROLE_BASE_PATH}/my-listing/edit?type=${type}&slug=${slug}`,
    listingDetail: (slug: string) => `${ROLE_BASE_PATH}/my-listing/${slug}`,
  };
}
