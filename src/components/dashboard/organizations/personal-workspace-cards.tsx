"use client";

import Link from "next/link";
import { ArrowRight, Building2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useWorkspace } from "@/hooks/useWorkspace";
import { organizationPath } from "@/lib/workspace";
import { ORG_ROLE_LABEL } from "@/types/organization";

/**
 * Top of the Personal home (V2 workspaces): a card per organization the user
 * belongs to, and the "List your business" call to action. The create wizard
 * offers a new organization named after the user when they have none, so a
 * first listing is also how a person becomes a business on Mefie.
 */
export function PersonalWorkspaceCards() {
  const { enabled } = useWorkspace();
  const { organizations } = useOrganizations();

  if (!enabled) return null;

  return (
    <div className="space-y-4 px-1 pt-3 lg:px-8">
      {organizations.length > 0 && (
        <section aria-labelledby="your-organizations">
          <h2 id="your-organizations" className="mb-3 text-lg font-semibold text-[#0F1A2A]">
            Your organizations
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {organizations.map((membership) => (
              <li key={membership.id}>
                <Link
                  href={organizationPath(membership.slug)}
                  className="flex items-center gap-3 rounded-2xl border border-[#E3E8EF] bg-white p-4 shadow-xs transition-colors hover:border-[#93C01F]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1F3A4C]">
                    <Building2 className="h-5 w-5 text-[#93C01F]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-[#1F3A4C]">{membership.name}</span>
                    <span className="block text-xs text-gray-500">
                      {ORG_ROLE_LABEL[membership.role]}
                      {membership.listings_count !== null &&
                        ` · ${membership.listings_count} listing${membership.listings_count === 1 ? "" : "s"}`}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {organizations.length === 0 && (
        <section className="flex flex-col gap-4 rounded-2xl border border-[#E3E8EF] bg-white p-5 shadow-xs sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#93C01F]/15">
            <Store className="h-6 w-6 text-[#93C01F]" />
          </span>
          <div className="flex-1">
            <h2 className="font-semibold text-[#0F1A2A]">List your business, event or community</h2>
            <p className="text-sm text-gray-500">
              Reach people in Ghana and the diaspora. We&apos;ll set up an organization for you to manage it.
            </p>
          </div>
          <Button asChild className="bg-[#93C01F] text-white hover:bg-[#82ab1b]">
            <Link href="/dashboard/my-listing/create?type=business">Get started</Link>
          </Button>
        </section>
      )}
    </div>
  );
}
