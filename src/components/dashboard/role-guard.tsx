"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { normalizeRole, type UserRole } from "@/lib/roles";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const role = normalizeRole(user?.role ?? "customer");
  const isAllowed = allowedRoles.includes(role);

  useEffect(() => {
    if (!loading && user && !isAllowed) {
      router.replace("/dashboard");
    }
  }, [loading, user, isAllowed, router]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#93C01F]" />
      </div>
    );
  }

  if (!isAllowed) return null;

  return <>{children}</>;
}
