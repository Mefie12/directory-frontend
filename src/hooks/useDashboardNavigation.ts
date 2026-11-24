"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { normalizeRole, ROLE_BASE_PATH, type UserRole } from "@/lib/roles";
import { Newspaper, Icon, SquaresFourIcon, Files, BookmarkSimple, QuestionMarkIcon, LifebuoyIcon, Buildings } from '@phosphor-icons/react';
import { useOrganizations } from "@/hooks/useOrganizations";

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
  /** V2 Phase 2.4: platform-level organization admin; shown only while the lifecycle flag is on. */
  requiresLifecycle?: boolean;
  /** V2 Phase 2.6: the admin review queue; shown only while sensitive-edit review is on. */
  requiresSensitiveReview?: boolean;
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
  },

  // ─── Users (Admin) ───
  {
    title: "Users",
    url: "/dashboard/users",
    icon: "/images/icons/users.svg",
    roles: ["admin"],
  },

  // ─── Organizations (Admin, V2 lifecycle) ───
  {
    title: "Organizations",
    url: "/dashboard/admin-organizations",
    icon: Buildings,
    roles: ["admin"],
    requiresLifecycle: true,
  },

  {
    title: "Edit Reviews",
    url: "/dashboard/sensitive-reviews",
    icon: Files,
    roles: ["admin"],
    requiresSensitiveReview: true,
  },

  // ─── Claims (Admin) ───
  {
    title: "Claims",
    url: "/dashboard/claim",
    icon: Files,
    roles: ["admin"],
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

export default function useDashboardNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = normalizeRole(user?.role ?? "customer");
  const { enabled: organizationsEnabled, organizations, lifecycle, sensitiveReview } = useOrganizations();

  const isActive = (path?: string) => !!path && pathname === path;

  // V2: an item is visible to its roles, plus its "when organizations are on"
  // roles while they are; organization-only items need a membership.
  const visibleTo = (item: MenuItem) => {
    if (item.requiresOrganizations && (!organizationsEnabled || organizations.length === 0)) return false;
    if (item.requiresLifecycle && !lifecycle) return false;
    if (item.requiresSensitiveReview && !sensitiveReview) return false;
    if (item.roles.includes(role)) return true;
    return organizationsEnabled && (item.rolesWhenOrganizationsEnabled ?? []).includes(role);
  };

  // Filter items by current role, then filter each dropdown's children by role
  // too, dropping any parent left with no reachable children. URLs are absolute.
  const items = MENU_CONFIG.filter(visibleTo)
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
    isActive,
    handleCloseSidebar,
  };
}
