import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/dashboard/header";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="max-w-8xl w-full border border-gray-100 rounded-3xl p-2">
        {/* <SidebarTrigger /> */}
        <Header />
        <div className="border-b border-gray-100 my-2" />
        {children}
      </main>
    </SidebarProvider>
  );
}
