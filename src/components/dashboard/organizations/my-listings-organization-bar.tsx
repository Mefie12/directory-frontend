"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { useOrganizations } from "@/hooks/useOrganizations";

/**
 * My Listings shows the listings of every organization the user belongs to.
 * This bar names those organizations and links to each one's hub, where its
 * listings are shown on their own (V2 Phase 1, owner decision 2026-11-22:
 * org hub now, per-org vendor pages in Phase 2). Renders nothing while
 * organizations are off.
 */
export function MyListingsOrganizationBar() {
  const { enabled, organizations } = useOrganizations();

  if (!enabled || organizations.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
      <span>{organizations.length === 1 ? "Listings of" : "Listings from"}</span>
      {organizations.map((organization) => (
        <Link
          key={organization.id}
          href={`/dashboard/org/${organization.slug}`}
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 font-medium text-[#1F3A4C] hover:border-[#93C01F]"
        >
          <Building2 className="h-3 w-3 text-[#93C01F]" />
          {organization.name}
          {organization.listings_count !== null && <span className="text-gray-400">· {organization.listings_count}</span>}
        </Link>
      ))}
    </div>
  );
}
