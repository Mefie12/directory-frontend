"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { normalizeRole, type PlatformPermission } from "@/lib/roles";

/**
 * V2 Phase 3b.6: the one place components ask what the signed-in staff member may do at
 * platform level. `can()` checks a permission the backend sent (user.platform.permissions).
 * Never check role names in components. This only decides what is shown: Laravel enforces
 * every permission.
 *
 * Against an older backend that does not send `platform`, an admin is treated as holding
 * every permission except the exclusive ones, so nothing a plain admin used today disappears.
 */
const EXCLUSIVE: PlatformPermission[] = [
  "platform.admins.manage",
  "platform.billing.grant",
  "platform.organizations.transfer",
  "platform.system.manage",
];

export function usePlatformAccess() {
  const { user } = useAuth();

  return useMemo(() => {
    const platform = user?.platform;
    const isStaffAdmin = user ? normalizeRole(user.role) === "admin" : false;

    const can = (permission: PlatformPermission): boolean => {
      if (platform) return platform.permissions.includes(permission);
      return isStaffAdmin && !EXCLUSIVE.includes(permission);
    };

    return {
      role: platform?.role ?? null,
      isSuperAdmin: platform?.role === "super_admin",
      can,
    };
  }, [user]);
}
