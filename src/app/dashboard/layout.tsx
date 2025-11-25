"use client"

import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/dashboard/header";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#93C01F] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user
  if (!user) {
    return null;
  }
  // Normalize role to lowercase and map to expected roles
  const normalizeRole = (role: string): "vendor" | "customer" | "admin" => {
    const lowercaseRole = role.toLowerCase();

    // Map common role variations
    if (
      lowercaseRole === "vendor" ||
      lowercaseRole === "seller" ||
      lowercaseRole === "business"
    ) {
      return "vendor";
    }
    if (
      lowercaseRole === "admin" ||
      lowercaseRole === "administrator" ||
      lowercaseRole === "superadmin"
    ) {
      return "admin";
    }
    // Default to customer for any other role
    return "customer";
  };

  const userRole = normalizeRole(user.role);
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar role={userRole} />

        <main className="flex-1 flex flex-col overflow-y-auto max-w-8xl w-full">
          <div className="shrink-0">
            <div className="flex items-center justify-between pt-4">
              <SidebarTrigger />
              <Header />
            </div>
            <div className="border-b border-gray-100 pt-2" />
          </div>
          <div className="flex-1  px-2 pb-2">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
