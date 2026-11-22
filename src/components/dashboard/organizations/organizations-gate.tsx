"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useOrganizations } from "@/hooks/useOrganizations";

/**
 * Renders organization pages only while the backend has organizations on.
 * Otherwise it sends the user back to the normal dashboard, so the routes
 * behave as if they don't exist before launch.
 */
export function OrganizationsGate({ children }: { children: ReactNode }) {
  const { loading } = useAuth();
  const { enabled } = useOrganizations();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !enabled) router.replace("/dashboard");
  }, [loading, enabled, router]);

  if (loading || !enabled) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#93C01F]" />
      </div>
    );
  }

  return <>{children}</>;
}
