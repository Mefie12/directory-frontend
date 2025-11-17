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
import { Home, Tag, BarChart3, Settings, MessageCircle } from "lucide-react";
import Image from "next/image"

// Menu items
const items = [
  {
    title: "Home",
    url: "/dashboard/",
    Icon: Home,
  },
  {
    title: "My Listing",
    url: "/dashboard/my-listing",
    Icon: Tag,
  },
  {
    title: "Inquiries",
    url: "/dashboard/inquiries",
    Icon: MessageCircle,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    Icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    Icon: Settings,
  },
];

export function AppSidebar() {
  return (
    <Sidebar variant="inset" className="bg-[#1C3C59] text-white">
      <SidebarHeader className="bg-[#1C3C59]">
        <div className="flex items-center gap-2">
          {/* Logo */}
          <div className="shrink-0">
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
            <SidebarMenu className="pt-10 space-y-5">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10 text-white transition-colors"
                    >
                      <item.Icon className="w-5 h-5 text-white" />
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