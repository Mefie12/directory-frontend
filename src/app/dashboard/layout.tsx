import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/dashboard/header";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />

        <main className="flex-1 flex flex-col overflow-y-auto max-w-8xl w-full">
          <div className="shrink-0">
            <SidebarTrigger />
            <Header />
            <div className="border-b border-gray-100" />
          </div>
          <div className="flex-1  px-2 pb-2">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
