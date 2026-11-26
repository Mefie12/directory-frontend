"use client";

import { usePathname, useRouter } from "next/navigation";
import { Building2, Check, ChevronsUpDown, Plus, User } from "lucide-react";
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
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  organizationPath,
  organizationSectionFromPath,
  PERSONAL_HOME,
  writeLastWorkspace,
} from "@/lib/workspace";
import { ORG_ROLE_LABEL } from "@/types/organization";

/**
 * Sidebar workspace switcher (V2 workspaces): Personal, each organization the
 * user belongs to, and "New organization". Renders nothing unless workspaces
 * apply (organizations on, vendor or customer).
 *
 * Switching between organizations keeps the current section when the target
 * has it (Reviews → Reviews); otherwise it opens the target's overview.
 */
export function WorkspaceSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { organizations } = useOrganizations();
  const { enabled, workspace, organization } = useWorkspace();

  if (!enabled) return null;

  const currentLabel = workspace.kind === "organization" ? (organization?.name ?? "Organization") : "Personal";
  const section = organizationSectionFromPath(pathname);

  const go = (href: string) => {
    onNavigate?.();
    router.push(href);
  };

  const openPersonal = () => {
    // Record Personal first so the /dashboard landing never bounces back into an organization.
    if (user?.id) writeLastWorkspace(user.id, { kind: "personal" });
    go(PERSONAL_HOME);
  };

  const openOrganization = (slug: string) => {
    // Section-level pages exist in every organization; listing detail pages do not.
    const keep = workspace.kind === "organization" && section !== "" && !pathname?.match(/\/listings\/.+/);
    go(organizationPath(slug, keep ? section : ""));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Current workspace: ${currentLabel}. Switch workspace`}
          className="flex w-full items-center gap-3 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-left text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C01F] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#93C01F]/20">
            {workspace.kind === "organization" ? (
              <Building2 className="h-4 w-4 text-[#93C01F]" />
            ) : (
              <User className="h-4 w-4 text-[#93C01F]" />
            )}
          </span>
          <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <span className="block text-[11px] uppercase tracking-wide text-white/60">Workspace</span>
            <span className="block truncate text-sm font-semibold">{currentLabel}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-white/60 group-data-[collapsible=icon]:hidden" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuItem onSelect={openPersonal} className="flex cursor-pointer items-center gap-3 py-2">
          <User className="h-4 w-4 shrink-0 text-gray-500" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[#1F3A4C]">Personal</p>
            <p className="text-xs text-gray-500">Bookmarks, events, your reviews and claims</p>
          </div>
          {workspace.kind === "personal" && <Check className="h-4 w-4 shrink-0 text-[#93C01F]" />}
        </DropdownMenuItem>

        {organizations.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Organizations
            </DropdownMenuLabel>
            {organizations.map((membership) => (
              <DropdownMenuItem
                key={membership.id}
                onSelect={() => openOrganization(membership.slug)}
                className="flex cursor-pointer items-center gap-3 py-2"
              >
                <Building2 className="h-4 w-4 shrink-0 text-gray-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#1F3A4C]">{membership.name}</p>
                  <p className="text-xs text-gray-500">
                    {ORG_ROLE_LABEL[membership.role]}
                    {membership.listings_count !== null &&
                      ` · ${membership.listings_count} listing${membership.listings_count === 1 ? "" : "s"}`}
                  </p>
                </div>
                {workspace.kind === "organization" && workspace.slug === membership.slug && (
                  <Check className="h-4 w-4 shrink-0 text-[#93C01F]" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => go("/dashboard/org/new")} className="flex cursor-pointer items-center gap-2 py-2">
          <Plus className="h-4 w-4 text-gray-500" /> New organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
