// components/app-sidebar.tsx (updated)
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { X, Newspaper, type LucideIcon, Folder, StickyNote } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useRealtimeRole } from "@/hooks/useRealtimeRole";
import { useEffect, useState, useMemo } from "react";

type UserRole = "vendor" | "customer" | "admin" | "listing_agent";

interface MenuItem {
  title: string;
  url: string;
  icon: string | LucideIcon;
}

interface AppSidebarProps {
  role: UserRole;
}

// Navigation items for each role (keep your existing navigationItems)
const navigationItems: Record<UserRole, MenuItem[]> = {
  vendor: [
    {
      title: "Home",
      url: "/dashboard/vendor",
      icon: "/images/icons/home.svg",
    },
    {
      title: "My Listings",
      url: "/dashboard/vendor/my-listing",
      icon: "/images/icons/listings.svg",
    },
    {
      title: "Inquiries",
      url: "/dashboard/vendor/inquiries",
      icon: "/images/icons/chat.svg",
    },
    {
      title: "Settings",
      url: "/dashboard/vendor/settings",
      icon: "/images/icons/setting.svg",
    },
  ],
  customer: [
    {
      title: "Bookmarks",
      url: "/dashboard/customer/bookmarks",
      icon: "/images/icons/bookmark.svg",
    },
    {
      title: "My Events",
      url: "/dashboard/customer/my-events",
      icon: "/images/icons/d-calendar.svg",
    },
    {
      title: "Reviews",
      url: "/dashboard/customer/reviews",
      icon: "/images/icons/review.svg",
    },
    {
      title: "Settings",
      url: "/dashboard/customer/settings",
      icon: "/images/icons/setting.svg",
    },
  ],
  admin: [
    {
      title: "Dashboard",
      url: "/dashboard/admin",
      icon: "/images/icons/home.svg",
    },
    {
      title: "Users",
      url: "/dashboard/admin/users",
      icon: "/images/icons/users.svg",
    },
    {
      title: "Listings",
      url: "/dashboard/admin/listings",
      icon: "/images/icons/listings.svg",
    },
    {
      title: "Claims",
      url: "/dashboard/admin/claim",
      icon: StickyNote,
    },
    {
      title: "Categories",
      url: "/dashboard/admin/categories",
      icon: Folder,
    },
    {
      title: "News Post",
      url: "/dashboard/admin/news-post",
      icon: Newspaper,
    },
    {
      title: "Reviews",
      url: "/dashboard/admin/reviews",
      icon: "/images/icons/review.svg",
    },
    {
      title: "Monetization",
      url: "/dashboard/admin/monetization",
      icon: "/images/icons/money.svg",
    },
  ],
  listing_agent: [
    {
      title: "My Listing",
      url: "/dashboard/listing-agent/my-listing",
      icon: "/images/icons/listings.svg",
    },
  ],
};

// Role to URL prefix mapping
const roleUrlPrefix: Record<UserRole, string> = {
  vendor: "/dashboard/vendor",
  customer: "/dashboard/customer",
  admin: "/dashboard/admin",
  listing_agent: "/dashboard/listing-agent",
};

export function AppSidebar({ role: initialRole }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [currentRole, setCurrentRole] = useState<UserRole>(initialRole);
  const [showRoleNotification, setShowRoleNotification] = useState(false);
  
  // Use the realtime role hook
  const { isRoleChanging } = useRealtimeRole({
    enableLogging: true,
    onRoleChange: (oldRole, newRole) => {
      // Normalize and update the role
      const normalizedNewRole = normalizeRole(newRole);
      setCurrentRole(normalizedNewRole);
      setShowRoleNotification(true);
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => setShowRoleNotification(false), 3000);
      
      // Check if we need to redirect based on new role
      const currentBasePath = `/${pathname.split('/')[1]}/${pathname.split('/')[2]}`;
      const expectedBasePath = roleUrlPrefix[normalizedNewRole];
      
      // If current path doesn't match new role's base path, redirect
      if (currentBasePath !== expectedBasePath && normalizedNewRole !== 'admin') {
        router.push(expectedBasePath);
      }
    }
  });

  // Update role if initial role changes
  useEffect(() => {
    setCurrentRole(initialRole);
  }, [initialRole]);

  // Normalize role function
  const normalizeRole = (role: string): UserRole => {
    const lowercaseRole = role.toLowerCase();
    
    if (lowercaseRole === "vendor" || lowercaseRole === "seller" || lowercaseRole === "business") {
      return "vendor";
    }
    if (lowercaseRole === "admin" || lowercaseRole === "administrator" || lowercaseRole === "superadmin") {
      return "admin";
    }
    if (lowercaseRole === "listing_agent" || lowercaseRole === "agent") {
      return "listing_agent";
    }
    return "customer";
  };

  const isActive = (path: string) => pathname === path;

  // Get items based on current role
  const items = useMemo(() => {
    return navigationItems[currentRole] || navigationItems.customer;
  }, [currentRole]);

  const handleCloseSidebar = () => {
    const sidebarTrigger = document.querySelector('[data-sidebar="trigger"]');
    if (sidebarTrigger) {
      (sidebarTrigger as HTMLElement).click();
    }

    const sidebarButtons = document.querySelectorAll("button");
    sidebarButtons.forEach((button) => {
      if (
        button.getAttribute("data-state") === "open" ||
        button.classList.contains("sidebar-trigger") ||
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

  if (!user) return null;

  return (
    <>
      {/* Role change notification */}
      {showRoleNotification && (
        <div className="fixed top-4 right-4 z-50 bg-[#93C01F] text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-top">
          <p className="text-sm font-medium">
            Role updated to {currentRole}
            {isRoleChanging && " ⚡"}
          </p>
        </div>
      )}

      <Sidebar
        variant="inset"
        collapsible="icon"
        className="bg-[#1C3C59] text-white h-screen"
      >
        <SidebarHeader className="bg-[#1C3C59]">
          <div className="flex items-center justify-between w-full">
            <div className="shrink-0 group-data-[collapsible=icon]:hidden">
              <Link href="/">
                <Image
                  src="/images/logos/mefie-logo.svg"
                  alt="MeFie Logo"
                  width={200}
                  height={100}
                  className="h-auto w-auto"
                  priority
                />
              </Link>
            </div>

            <button
              onClick={handleCloseSidebar}
              className="md:hidden p-2 rounded-md hover:bg-white/10 text-white cursor-pointer transition-colors flex items-center justify-center"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </SidebarHeader>

        <SidebarContent className="bg-[#1C3C59]">
          <SidebarGroup className="bg-[#1C3C59]">
            <SidebarGroupContent className="bg-[#1C3C59]">
              <SidebarMenu className="pt-4 space-y-2">
                {items.map((item) => {
                  const isLucideIcon = typeof item.icon !== "string";
                  const IconComponent = isLucideIcon ? (item.icon as LucideIcon) : null;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link
                          href={item.url}
                          className={`flex items-center gap-3 px-3 py-4 rounded-lg hover:bg-white/10 text-white transition-colors ${
                            isActive(item.url) ? "bg-[#93C01F]" : ""
                          }`}
                          onClick={() => {
                            if (window.innerWidth < 768) {
                              handleCloseSidebar();
                            }
                          }}
                        >
                          {isLucideIcon && IconComponent ? (
                            <IconComponent className="w-5 h-5 text-white" />
                          ) : (
                            <Image
                              src={item.icon as string}
                              alt={item.title}
                              width={20}
                              height={20}
                              className="w-5 h-5"
                            />
                          )}
                          <span className="text-sm font-medium text-white">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </>
  );
}