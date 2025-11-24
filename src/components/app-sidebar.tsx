"use client"

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
import { X } from "lucide-react";

type UserRole = "vendor" | "customer" | "admin";

interface MenuItem {
  title: string;
  url: string;
  iconUrl: string;
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
      iconUrl: "/images/icons/home.svg",
    },
    {
      title: "My Listing",
      url: "/dashboard/vendor/my-listing",
      iconUrl: "/images/icons/listings.svg",
    },
    {
      title: "Inquiries",
      url: "/dashboard/vendor/inquiries",
      iconUrl: "/images/icons/chat.svg",
    },
    {
      title: "Analytics",
      url: "/dashboard/vendor/analytics",
      iconUrl: "/images/icons/curves.svg",
    },
    {
      title: "Settings",
      url: "/dashboard/vendor/settings",
      iconUrl: "/images/icons/setting.svg",
    },
  ],
  customer: [
    {
      title: "Overview",
      url: "/dashboard/customer",
      iconUrl: "/images/icons/home.svg",
    },
    {
      title: "Bookmarks",
      url: "/dashboard/customer/bookmarks",
      iconUrl: "/images/icons/bookmark.svg",
    },
    {
      title: "Inquiries",
      url: "/dashboard/customer/inquiries",
      iconUrl: "/images/icons/chat.svg",
    },
    {
      title: "My Events",
      url: "/dashboard/customer/my-events",
      iconUrl: "/images/icons/d-calendar.svg",
    },
    {
      title: "Settings",
      url: "/dashboard/customer/settings",
      iconUrl: "/images/icons/setting.svg",
    },
  ],
  admin: [
    {
      title: "Dashboard",
      url: "/dashboard/admin",
      iconUrl: "/images/icons/home.svg",
    },
    {
      title: "Users",
      url: "/dashboard/admin/users",
      iconUrl: "/images/icons/users.svg",
    },
    {
      title: "Listings",
      url: "/dashboard/admin/listings",
      iconUrl: "/images/icons/listings.svg",
    },
    {
      title: "Reviews",
      url: "/dashboard/admin/reviews",
      iconUrl: "/images/icons/review.svg",
    },
    {
      title: "Monetization",
      url: "/dashboard/admin/monetization",
      iconUrl: "/images/icons/money.svg",
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
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className={`flex items-center gap-3 px-3 py-4 rounded-lg hover:bg-white/10 text-white transition-colors ${
                        isActive(item.url) ? "bg-[#93C01F]" : ""
                      }`}
                    >
                      <Image
                        src={item.iconUrl}
                        alt={item.title}
                        width={20}
                        height={20}
                      />
                      <span className="text-sm font-medium text-white">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}