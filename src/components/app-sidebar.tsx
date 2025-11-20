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

// Menu items
const items = [
  {
    title: "Home",
    url: "/dashboard",
    iconUrl: "/images/icons/home.svg",
  },
  {
    title: "My Listing",
    url: "/dashboard/my-listing",
    iconUrl: "/images/icons/listings.svg",
  },
  {
    title: "Inquiries",
    url: "/dashboard/inquiries",
    iconUrl: "/images/icons/chat.svg",
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    iconUrl: "/images/icons/curves.svg",
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    iconUrl: "/images/icons/setting.svg",
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  // Direct DOM manipulation - this WILL work
  const handleCloseSidebar = () => {
    // Method 1: Find and click the sidebar trigger button
    const sidebarTrigger = document.querySelector('[data-sidebar="trigger"]');
    if (sidebarTrigger) {
      (sidebarTrigger as HTMLElement).click();
    }
    
    // Method 2: Look for any button with sidebar-related attributes
    const sidebarButtons = document.querySelectorAll('button');
    sidebarButtons.forEach(button => {
      if (button.getAttribute('data-state') === 'open' || 
          button.classList.contains('sidebar-trigger') ||
          button.getAttribute('aria-expanded') === 'true') {
        button.click();
      }
    });
    
    // Method 3: Look for the sidebar and add collapsed class
    const sidebar = document.querySelector('[data-sidebar="sidebar"]') || 
                   document.querySelector('.sidebar') ||
                   document.querySelector('[data-collapsible="icon"]');
    
    if (sidebar) {
      sidebar.setAttribute('data-state', 'collapsed');
      sidebar.classList.add('collapsed');
    }
  };

  return (
    <Sidebar variant="inset" collapsible="icon" className="bg-[#1C3C59] text-white h-screen">
      <SidebarHeader className="bg-[#1C3C59]">
        <div className="flex items-center justify-between w-full">
          {/* Logo */}
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

          {/* Close Button - Simple and direct */}
          <button 
            onClick={handleCloseSidebar}
            className="md:hidden p-2 rounded-md hover:bg-white/10 text-white cursor-pointer transition-colors flex items-center justify-center"
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
                      <Image src={item.iconUrl} alt={item.title} width={20} height={20} />
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