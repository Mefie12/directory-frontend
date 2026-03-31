"use client";

import { useAuth } from "@/context/auth-context";
import { normalizeRole, ROLE_BASE_PATH } from "@/lib/roles";

export function useRolePath() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role ?? "customer");

  return {
    role,
    basePath: ROLE_BASE_PATH,
    myListings: `${ROLE_BASE_PATH}/my-listing`,
    listingCreate: (type: string) => `${ROLE_BASE_PATH}/my-listing/create?type=${type}`,
    listingEdit: (type: string, slug: string) =>
      `${ROLE_BASE_PATH}/my-listing/edit?type=${type}&slug=${slug}`,
  };
}
