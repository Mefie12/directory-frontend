export type UserRole = "vendor" | "customer" | "admin" | "listing_agent";

// All roles share the same /dashboard base — routing is flat, role guard handles access
export const ROLE_BASE_PATH = "/dashboard";

// Default landing page per role (used for redirects after login, role change, etc.)
export const ROLE_HOME: Record<UserRole, string> = {
  vendor: "/dashboard",
  listing_agent: "/dashboard/agent",
  admin: "/dashboard",
  customer: "/dashboard",
} as const;

export function normalizeRole(role: string): UserRole {
  const r = role.toLowerCase();
  if (r === "vendor" || r === "seller" || r === "business") return "vendor";
  if (r === "admin" || r === "administrator" || r === "superadmin") return "admin";
  if (r === "listing_agent" || r === "agent") return "listing_agent";
  return "customer";
}

// ── Platform permissions (V2 Phase 3b.6) ────────────────────────────────────
// The backend sends the permissions the signed-in user holds right now
// (user.platform.permissions). Components ask for a permission through
// usePlatformAccess(); they never infer one from the role name. UI hint only:
// Laravel enforces every one of them.

export type PlatformRole = "super_admin" | "admin" | "listing_agent" | "vendor" | "user";

export type PlatformPermission =
  | "platform.listings.moderate"
  | "platform.claims.review"
  | "platform.reviews.moderate"
  | "platform.revisions.decide"
  | "platform.duplicates.resolve"
  | "platform.stewardship.manage"
  | "platform.categories.manage"
  | "platform.collections.manage"
  | "platform.blog.manage"
  | "platform.faqs.manage"
  | "platform.users.view"
  | "platform.users.suspend"
  | "platform.users.roles"
  | "platform.organizations.manage"
  | "platform.billing.manage"
  | "platform.audit.view"
  | "platform.diagnostics.view"
  | "platform.listings.create_unowned"
  | "platform.admins.manage"
  | "platform.billing.grant"
  | "platform.organizations.transfer"
  | "platform.system.manage";

export interface PlatformInfo {
  role: PlatformRole;
  permissions: PlatformPermission[];
}
