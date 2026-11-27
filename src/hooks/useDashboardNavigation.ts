"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { normalizeRole, ROLE_BASE_PATH, type PlatformPermission, type UserRole } from "@/lib/roles";
import { usePlatformAccess } from "@/hooks/usePlatformAccess";
import { Newspaper, Icon, SquaresFourIcon, Files, BookmarkSimple, QuestionMarkIcon, LifebuoyIcon, Buildings, Receipt, UsersThree, SealCheck, LinkSimple } from '@phosphor-icons/react';
import { useOrganizations } from "@/hooks/useOrganizations";
import { useWorkspace } from "@/hooks/useWorkspace";
import { organizationPath } from "@/lib/workspace";
import type { OrganizationMembership } from "@/types/organization";

export type { UserRole };

export interface MenuItem {
  title: string;
  // Parent (dropdown) items have no url of their own — only their children navigate.
  url?: string;
  icon: string | Icon;
  roles: UserRole[];
  children?: MenuItem[];
  /**
   * V2 "browse as myself": extra roles that see this item only while
   * organizations are on (vendors keep their customer features).
   */
  rolesWhenOrganizationsEnabled?: UserRole[];
  /** V2: shown only while organizations are on and the user belongs to one. */
  requiresOrganizations?: boolean;
  /** V2 Phase 4.2: shown whenever organizations are on (no membership or lifecycle needed). */
  requiresOrganizationsEnabled?: boolean;
  /** V2 Phase 2.4: platform-level organization admin; shown only while the lifecycle flag is on. */
  requiresLifecycle?: boolean;
  /** V2 Phase 2.6: the admin review queue; shown only while sensitive-edit review is on. */
  requiresSensitiveReview?: boolean;
  /** Extra capability the user must hold. UI convenience only: the API enforces it. */
  permission?: "manage_billing";
  /** V2 Phase 3b.6: platform permission the user must hold (from user.platform). UI convenience only. */
  platformPermission?: PlatformPermission;
  /** V2 Phase 3a.2: shown only while the backend has the manual-plans admin API on. */
  requiresBillingAdmin?: boolean;
  /** Also highlight the item on its sub pages (e.g. Listings → a listing's detail page). */
  matchPrefix?: boolean;
}

const MENU_CONFIG: MenuItem[] = [
  // ─── Home / Dashboard ───
  {
    title: "Home",
    url: "/dashboard",
    icon: "/images/icons/home.svg",
    roles: ["vendor"],
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: "/images/icons/home.svg",
    roles: ["admin"],
  },

  // ─── Listings ───
  {
    title: "My Listings",
    url: "/dashboard/my-listing",
    icon: "/images/icons/listings.svg",
    roles: ["vendor"],
  },
  {
    title: "Agent Workspace",
    url: "/dashboard/agent",
    icon: "/images/icons/listings.svg",
    roles: ["listing_agent"],
  },
  {
    title: "My Listings",
    url: "/dashboard/agent/listings",
    icon: "/images/icons/listings.svg",
    roles: ["listing_agent"],
  },
  {
    title: "Listings",
    url: "/dashboard/listings",
    icon: "/images/icons/listings.svg",
    roles: ["admin"],
    platformPermission: "platform.listings.moderate",
  },

  // ─── Users (Admin) ───
  {
    title: "Users",
    url: "/dashboard/users",
    icon: "/images/icons/users.svg",
    roles: ["admin"],
    platformPermission: "platform.users.view",
  },

  // ─── Admin team (Admin, V2 Phase 3b.6) ───
  {
    title: "Admin Team",
    url: "/dashboard/admin-team",
    icon: UsersThree,
    roles: ["admin"],
    platformPermission: "platform.users.view",
  },

  // ─── Organizations (Admin, V2 lifecycle) ───
  {
    title: "Organizations",
    url: "/dashboard/admin-organizations",
    icon: Buildings,
    roles: ["admin"],
    platformPermission: "platform.organizations.manage",
    requiresLifecycle: true,
  },

  // ─── Outbound link moderation (Admin, V2 Phase 6.1) ───
  {
    title: "Listing Links",
    url: "/dashboard/admin-links",
    icon: LinkSimple,
    roles: ["admin"],
    platformPermission: "platform.listings.moderate",
  },

  // ─── Organization verification queue (Admin, V2 Phase 4.2) ───
  {
    title: "Verifications",
    url: "/dashboard/admin-verifications",
    icon: SealCheck,
    roles: ["admin"],
    platformPermission: "platform.organizations.verify",
    requiresOrganizationsEnabled: true,
  },

  {
    title: "Edit Reviews",
    url: "/dashboard/sensitive-reviews",
    icon: Files,
    roles: ["admin"],
    requiresSensitiveReview: true,
  },

  // ─── Manually billed plans (Admin with the billing permission) ───
  {
    title: "Manual Plans",
    url: "/dashboard/monetization/manual-plans",
    icon: Receipt,
    roles: ["admin"],
    permission: "manage_billing",
    requiresBillingAdmin: true,
  },

  // ─── Claims (Admin) ───
  {
    title: "Claims",
    url: "/dashboard/claim",
    icon: Files,
    roles: ["admin"],
    platformPermission: "platform.claims.review",
  },
  {
    title: "Agent Operations",
    icon: Files,
    roles: ["admin"],
    children: [
      {
        title: "Stewardship Queue",
        url: "/dashboard/agent-operations/stewardship",
        icon: Files,
        roles: ["admin"],
      },
      {
        title: "Duplicate Collisions",
        url: "/dashboard/agent-operations/duplicates",
        icon: Files,
        roles: ["admin"],
      },
    ],
  },

  // ─── Categories (Admin) ───
  {
    title: "Categories",
    url: "/dashboard/categories",
    icon: SquaresFourIcon,
    roles: ["admin"],
  },

  // ─── Curated Collections (Admin) ───
  {
    title: "Collections",
    url: "/dashboard/collections",
    icon: BookmarkSimple,
    roles: ["admin"],
  },

  // ─── News Post (Admin) ───
  {
    title: "News Post",
    url: "/dashboard/news-post",
    icon: Newspaper,
    roles: ["admin"],
  },

  // ─── Support (Admin) ───
  {
    title: "Support",
    icon: LifebuoyIcon,
    roles: ["admin"],
    children: [
      {
        title: "FAQs",
        url: "/dashboard/faqs",
        icon: QuestionMarkIcon,
        roles: ["admin"],
      },
    ],
  },

  // ─── Inquiries ───
  {
    title: "Inquiries",
    url: "/dashboard/inquiries",
    icon: "/images/icons/chat.svg",
    roles: ["vendor"],
  },

  // ─── Organizations (V2; only when organizations are on) ───
  {
    title: "Organizations",
    url: "/dashboard/org",
    icon: Buildings,
    roles: ["vendor", "customer"],
    requiresOrganizations: true,
  },

  // ─── My Claims (Customer + Vendor) ───
  {
    title: "My Claims",
    url: "/dashboard/my-claims",
    icon: Files,
    roles: ["customer", "vendor"],
  },

  // ─── Bookmarks (Customer) ───
  {
    title: "Bookmarks",
    url: "/dashboard/bookmarks",
    icon: "/images/icons/bookmark.svg",
    roles: ["customer"],
    rolesWhenOrganizationsEnabled: ["vendor"],
  },

  // ─── My Events (Customer) ───
  {
    title: "My Events",
    url: "/dashboard/my-events",
    icon: "/images/icons/d-calendar.svg",
    roles: ["customer"],
    rolesWhenOrganizationsEnabled: ["vendor"],
  },

  // ─── Reviews ───
  {
    title: "Reviews",
    url: "/dashboard/reviews",
    icon: "/images/icons/review.svg",
    roles: ["customer", "admin", "vendor" ],
  },

  // ─── Monetization (Admin) ───
  {
    title: "Monetization",
    url: "/dashboard/monetization",
    icon: "/images/icons/money.svg",
    roles: ["admin"],
  },

  // ─── Analytics (Vendor) ───
  // {
  //   title: "Analytics",
  //   url: "/dashboard/analytics",
  //   icon: "/images/icons/home.svg",
  //   roles: ["vendor"],
  // },

  // ─── Settings ───
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: "/images/icons/setting.svg",
    roles: ["vendor", "customer", "listing_agent"],
  },
];

// ─── V2 workspaces (organizations on, vendor or customer) ───────────────────
// The sidebar shows one workspace at a time; the URL decides which (lib/workspace.ts).

const PERSONAL_MENU: MenuItem[] = [
  { title: "Home", url: "/dashboard", icon: "/images/icons/home.svg", roles: ["vendor", "customer"] },
  { title: "Bookmarks", url: "/dashboard/bookmarks", icon: "/images/icons/bookmark.svg", roles: ["vendor", "customer"] },
  { title: "My Events", url: "/dashboard/my-events", icon: "/images/icons/d-calendar.svg", roles: ["vendor", "customer"] },
  { title: "Reviews I wrote", url: "/dashboard/reviews", icon: "/images/icons/review.svg", roles: ["vendor", "customer"] },
  { title: "My Claims", url: "/dashboard/my-claims", icon: Files, roles: ["vendor", "customer"] },
  { title: "Organizations", url: "/dashboard/org", icon: Buildings, roles: ["vendor", "customer"] },
  { title: "Account settings", url: "/dashboard/settings", icon: "/images/icons/setting.svg", roles: ["vendor", "customer"] },
];

interface OrganizationMenuOptions {
  slug: string;
  /** The membership from the auth payload; null for an archived/suspended organization (not in the payload). */
  membership: OrganizationMembership | null;
  teams: boolean;
  orgBilling: boolean;
}

function organizationMenu({ slug, membership, teams, orgBilling }: OrganizationMenuOptions): MenuItem[] {
  const holds = (permission: string) => (membership?.permissions as string[] | undefined)?.includes(permission) ?? false;
  const roles: UserRole[] = ["vendor", "customer"];
  const items: MenuItem[] = [
    { title: "Overview", url: organizationPath(slug), icon: "/images/icons/home.svg", roles },
    { title: "Listings", url: organizationPath(slug, "listings"), icon: "/images/icons/listings.svg", roles, matchPrefix: true },
    { title: "Reviews", url: organizationPath(slug, "reviews"), icon: "/images/icons/review.svg", roles },
    { title: "Members", url: organizationPath(slug, "members"), icon: UsersThree, roles },
  ];
  if (teams && holds("activity.view")) {
    items.push({ title: "Activity", url: organizationPath(slug, "activity"), icon: "/images/icons/chart.svg", roles });
  }
  if (orgBilling && holds("billing.manage")) {
    items.push({ title: "Billing", url: organizationPath(slug, "billing"), icon: Receipt, roles });
  }
  if (holds("organization.update")) {
    items.push({ title: "Organization settings", url: organizationPath(slug, "settings"), icon: "/images/icons/setting.svg", roles });
  }
  return items;
}

export default function useDashboardNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = normalizeRole(user?.role ?? "customer");
  const { enabled: organizationsEnabled, organizations, lifecycle, sensitiveReview, teams, orgBilling } = useOrganizations();
  const { can: canPlatform } = usePlatformAccess();
  const { enabled: workspacesEnabled, workspace, organization } = useWorkspace();

  const isActive = (path?: string) => !!path && pathname === path;

  // V2: an item is visible to its roles, plus its "when organizations are on"
  // roles while they are; organization-only items need a membership.
  const visibleTo = (item: MenuItem) => {
    // With lifecycle on, an archived or suspended organization is not in the auth payload
    // (which lists active ones only), so keep the entry reachable for everyone: its list page
    // shows inactive organizations and explains why they are read-only.
    if (item.requiresOrganizations && (!organizationsEnabled || (organizations.length === 0 && !lifecycle))) return false;
    if (item.requiresOrganizationsEnabled && !organizationsEnabled) return false;
    if (item.requiresLifecycle && !lifecycle) return false;
    if (item.requiresSensitiveReview && !sensitiveReview) return false;
    if (item.requiresBillingAdmin && user?.features?.billing_admin !== true) return false;
    if (item.permission && user?.permissions?.[item.permission] !== true) return false;
    if (item.platformPermission && !canPlatform(item.platformPermission)) return false;
    if (item.roles.includes(role)) return true;
    return organizationsEnabled && (item.rolesWhenOrganizationsEnabled ?? []).includes(role);
  };

  const workspaceMenu = !workspacesEnabled
    ? null
    : workspace.kind === "organization"
      ? organizationMenu({ slug: workspace.slug, membership: organization, teams, orgBilling })
      : PERSONAL_MENU;

  // Filter items by current role, then filter each dropdown's children by role
  // too, dropping any parent left with no reachable children. URLs are absolute.
  const items = (workspaceMenu ?? MENU_CONFIG.filter(visibleTo))
    .map((item) => {
      if (!item.children) return item;
      const children = item.children.filter(visibleTo);
      return { ...item, children };
    })
    .filter(
      (item) => item.url || (item.children && item.children.length > 0),
    );

  const handleCloseSidebar = () => {
    const sidebarTrigger = document.querySelector('[data-sidebar="trigger"]');
    if (sidebarTrigger) (sidebarTrigger as HTMLElement).click();

    document.querySelectorAll("button").forEach((button) => {
      if (
        button.getAttribute("data-state") === "open" ||
        button.getAttribute("aria-expanded") === "true"
      ) {
        button.click();
      }
    });

    const sidebar =
      document.querySelector('[data-sidebar="sidebar"]') ||
      document.querySelector(".sidebar") ||
      document.querySelector('[data-collapsible="icon"]');

    if (sidebar) {
      sidebar.setAttribute("data-state", "collapsed");
      sidebar.classList.add("collapsed");
    }
  };

  return {
    items,
    role,
    basePath: ROLE_BASE_PATH,
    isActive: (path?: string) => {
      if (isActive(path)) return true;
      const item = items.find((candidate) => candidate.url === path);
      return !!(item?.matchPrefix && path && pathname?.startsWith(`${path}/`));
    },
    handleCloseSidebar,
  };
}
