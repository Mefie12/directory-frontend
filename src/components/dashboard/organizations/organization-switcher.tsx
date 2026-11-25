"use client";

import Link from "next/link";
import { Building2, Check, ChevronDown, Compass, LayoutList, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import { useOrganizations } from "@/hooks/useOrganizations";
import { normalizeRole } from "@/lib/roles";
import { ORG_ROLE_LABEL } from "@/types/organization";

/**
 * V2 Phase 1 organization switcher for the dashboard header. Renders nothing
 * while organizations are off, or when the user belongs to none.
 */
export function OrganizationSwitcher() {
  const { user } = useAuth();
  const { enabled, organizations, active } = useOrganizations();

  if (!enabled || organizations.length === 0) return null;

  const role = normalizeRole(user?.role ?? "customer");
  const canCreate = role !== "listing_agent";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex max-w-[220px] items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-[#1F3A4C] hover:bg-gray-50"
          aria-label="Switch organization"
        >
          <Building2 className="h-4 w-4 shrink-0 text-[#93C01F]" />
          <span className="truncate">{active ? active.name : "My organizations"}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Your organizations
        </DropdownMenuLabel>
        {organizations.map((organization) => (
          <DropdownMenuItem key={organization.id} asChild>
            <Link href={`/dashboard/org/${organization.slug}`} className="flex cursor-pointer items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[#1F3A4C]">{organization.name}</p>
                <p className="text-xs text-gray-500">
                  {ORG_ROLE_LABEL[organization.role]}
                  {organization.listings_count !== null && ` · ${organization.listings_count} listing${organization.listings_count === 1 ? "" : "s"}`}
                </p>
              </div>
              {active?.id === organization.id && <Check className="h-4 w-4 shrink-0 text-[#93C01F]" />}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/my-listing" className="flex cursor-pointer items-center gap-2 py-2">
            <LayoutList className="h-4 w-4 text-gray-500" /> All my listings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/discover" className="flex cursor-pointer items-center gap-2 py-2">
            <Compass className="h-4 w-4 text-gray-500" /> Browse as myself
          </Link>
        </DropdownMenuItem>
        {canCreate && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard/org/new" className="flex cursor-pointer items-center gap-2 py-2">
              <Plus className="h-4 w-4 text-gray-500" /> New organization
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
