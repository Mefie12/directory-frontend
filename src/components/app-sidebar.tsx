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
  //   SidebarSeparator,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

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
  // Active state
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <Sidebar variant="inset" collapsible="icon" className="bg-[#1C3C59] text-white h-screen">
      <SidebarHeader className="bg-[#1C3C59]">
        <div className="flex items-center gap-2">
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
        </div>
      </SidebarHeader>
      {/* <SidebarSeparator className="bg-white/20" /> */}
      <SidebarContent className="bg-[#1C3C59]">
        <SidebarGroup className="bg-[#1C3C59]">
          <SidebarGroupContent className="bg-[#1C3C59]">
            <SidebarMenu className="pt-10 space-y-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className={`flex items-center gap-2 px-2 py-5 rounded-lg hover:bg-white/10 text-white transition-colors ${
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
