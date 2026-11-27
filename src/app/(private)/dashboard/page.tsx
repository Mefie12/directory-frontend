"use client";

import { useAuth } from "@/context/auth-context";
import { normalizeRole, ROLE_HOME } from "@/lib/roles";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { OrganizationProfilePrompt } from "@/components/dashboard/organizations/organization-profile-prompt";
import { PersonalWorkspaceCards } from "@/components/dashboard/organizations/personal-workspace-cards";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useWorkspace } from "@/hooks/useWorkspace";
import { organizationPath, readLastWorkspace } from "@/lib/workspace";

const VendorHome = dynamic(() => import("@/components/dashboard/home/vendor-home"));
const CustomerHome = dynamic(() => import("@/components/dashboard/home/customer-home"));
const AdminHome = dynamic(() => import("@/components/dashboard/home/admin-home"));

const landedKey = (userId: string) => `mefie.workspaceLanded.${userId}`;

/**
 * Where /dashboard should send a vendor or customer on their first visit of this
 * browser session (V2 workspaces): the last workspace they used, or on a first
 * ever visit their default organization. Null means stay on the Personal home.
 */
function landingOrganization(userId: string, slugs: string[], defaultSlug: string | null): string | null {
  if (typeof window === "undefined" || window.sessionStorage.getItem(landedKey(userId))) return null;
  const last = readLastWorkspace(userId);
  if (last?.kind === "organization") return slugs.includes(last.slug) ? last.slug : defaultSlug;
  if (last?.kind === "personal") return null;
  return defaultSlug;
}

export default function DashboardHome() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const role = normalizeRole(user?.role ?? "customer");
  const { enabled: workspacesEnabled } = useWorkspace();
  const { organizations, defaultOrganization } = useOrganizations();

  const landingSlug =
    !loading && user && workspacesEnabled
      ? landingOrganization(
          user.id,
          organizations.map((organization) => organization.slug),
          defaultOrganization?.slug ?? null,
        )
      : null;

  // Listing agents use their dedicated workspace as the role home.
  useEffect(() => {
    if (!loading && user && role === "listing_agent") {
      router.replace(ROLE_HOME[role]);
    }
  }, [loading, user, role, router]);

  // Land in the last workspace once per session; afterwards /dashboard is simply Personal home.
  useEffect(() => {
    if (!user || !workspacesEnabled) return;
    window.sessionStorage.setItem(landedKey(user.id), "1");
    if (landingSlug) router.replace(organizationPath(landingSlug));
  }, [user, workspacesEnabled, landingSlug, router]);

  if (loading || landingSlug) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#93C01F]" />
      </div>
    );
  }

  // V2 workspaces: /dashboard is the Personal home for vendors and customers alike.
  if (workspacesEnabled) {
    return (
      <>
        <OrganizationProfilePrompt />
        <PersonalWorkspaceCards />
        <CustomerHome />
      </>
    );
  }

  if (role === "vendor") {
    return (
      <>
        {/* V2: renders nothing while organizations are off */}
        <OrganizationProfilePrompt />
        <VendorHome />
      </>
    );
  }
  if (role === "admin") return <AdminHome />;
  if (role === "customer") return <CustomerHome />;

  return null;
}
