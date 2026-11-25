"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight, Crown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganizationsGate } from "@/components/dashboard/organizations/organizations-gate";
import { useAuth } from "@/context/auth-context";
import { useOrganizations } from "@/hooks/useOrganizations";
import { getMyOrganizations } from "@/lib/api";
import { normalizeRole } from "@/lib/roles";
import { ORG_ROLE_LABEL, type OrganizationMembership } from "@/types/organization";

export default function OrganizationsPage() {
  const { user } = useAuth();
  const { organizations: activeOrganizations, lifecycle } = useOrganizations();
  // With lifecycle on, also list archived and suspended organizations (the auth payload only
  // carries active ones), so owners can still reach them to see why or to restore them.
  const [withInactive, setWithInactive] = useState<OrganizationMembership[] | null>(null);
  const organizations = lifecycle && withInactive ? withInactive : activeOrganizations;

  useEffect(() => {
    if (!lifecycle) return;
    let cancelled = false;
    getMyOrganizations(localStorage.getItem("authToken") ?? undefined)
      .then((rows) => !cancelled && setWithInactive(rows))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [lifecycle]);

  const canCreate = normalizeRole(user?.role ?? "customer") !== "listing_agent";

  return (
    <OrganizationsGate>
      <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1F3A4C]">Your organizations</h1>
            <p className="mt-1 text-sm text-gray-600">Each organization holds its own listings.</p>
          </div>
          {canCreate && (
            <Button asChild className="bg-[#93C01F] text-white hover:bg-[#82ab1b]">
              <Link href="/dashboard/org/new">
                <Plus className="mr-1 h-4 w-4" /> New organization
              </Link>
            </Button>
          )}
        </div>

        {organizations.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-500">
            You don&apos;t belong to any organization yet. Creating your first listing sets one up for you.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
            {organizations.map((organization) => (
              <li key={organization.id}>
                <Link href={`/dashboard/org/${organization.slug}`} className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F3A4C]">
                    <Building2 className="h-5 w-5 text-[#93C01F]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[#1F3A4C]">{organization.name}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      {organization.is_primary_owner && <Crown className="h-3 w-3" />}
                      {ORG_ROLE_LABEL[organization.role]}
                      {organization.listings_count !== null && ` · ${organization.listings_count} listing${organization.listings_count === 1 ? "" : "s"}`}
                      {organization.status !== "active" && ` · ${organization.status === "archived" ? "Archived" : "Suspended"}`}
                      {organization.status === "active" && !organization.profile_completed && " · Profile incomplete"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </OrganizationsGate>
  );
}
