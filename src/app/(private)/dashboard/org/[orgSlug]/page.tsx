"use client";

import { Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { OrganizationWorkspaceHeader } from "@/components/dashboard/organizations/organization-workspace";
import { organizationPath } from "@/lib/workspace";

const VendorHome = dynamic(() => import("@/components/dashboard/home/vendor-home"));

/** Old hub links used ?tab=…; each tab is now its own page. */
const LEGACY_TABS = new Set(["listings", "members", "activity", "billing", "settings"]);

function LegacyTabRedirect({ slug }: { slug: string }) {
  const router = useRouter();
  const tab = useSearchParams().get("tab");

  useEffect(() => {
    if (tab && LEGACY_TABS.has(tab)) router.replace(organizationPath(slug, tab));
  }, [tab, slug, router]);

  return null;
}

/** Organization overview: the vendor home, scoped to this organization's listings. */
export default function OrganizationOverviewPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();

  return (
    <>
      <Suspense>
        <LegacyTabRedirect slug={orgSlug} />
      </Suspense>
      <div className="px-4 pt-4 lg:px-8 lg:pt-8">
        <OrganizationWorkspaceHeader />
      </div>
      <VendorHome organizationSlug={orgSlug} />
    </>
  );
}
