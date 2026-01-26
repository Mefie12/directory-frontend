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
import { usePathname } from "next/navigation";
import { X, Newspaper, type LucideIcon, Folder } from "lucide-react";

type UserRole = "vendor" | "customer" | "admin";

// Updated interface to accept either a string URL or a Lucide Component
interface MenuItem {
  title: string;
  url: string;
  icon: string | LucideIcon;
}

interface AppSidebarProps {
  role: UserRole;
}

// Navigation items for each role
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
      title: "Categories",
      url: "/dashboard/admin/categories",
      icon: Folder
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
};

export function AppSidebar({ role }: AppSidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const items = navigationItems[role];

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

  return (
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
                // If it is a component, we rename it to PascalCase for JSX rendering
                const IconComponent = isLucideIcon
                  ? (item.icon as LucideIcon)
                  : null;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        className={`flex items-center gap-3 px-3 py-4 rounded-lg hover:bg-white/10 text-white transition-colors ${
                          isActive(item.url) ? "bg-[#93C01F]" : ""
                        }`}
                      >
                        {/* Conditional Rendering logic */}
                        {isLucideIcon && IconComponent ? (
                          <IconComponent className="w-5 h-5 text-white" />
                        ) : (
                          <Image
                            src={item.icon as string}
                            alt={item.title}
                            width={20}
                            height={20}
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
  );
}
