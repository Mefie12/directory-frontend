"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Building2, Crown, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getOrganization,
  getOrganizationListings,
  getOrganizationMembers,
  OrganizationApiError,
  updateOrganization,
} from "@/lib/api";
import { getImageUrl } from "@/lib/directory/image-utils";
import { useOrganizations } from "@/hooks/useOrganizations";
import {
  ORG_ENTITY_KIND_LABEL,
  ORG_ROLE_LABEL,
  type OrganizationDetail,
  type OrganizationListingItem,
  type OrganizationMember,
} from "@/types/organization";
import { OrganizationForm } from "./organization-form";
import { ProfileCompletionBanner } from "./profile-completion-banner";

const LISTING_STATUS_LABEL: Record<OrganizationListingItem["status"], string> = {
  draft: "Draft",
  pending: "In review",
  approved: "Published",
  rejected: "Rejected",
  suspended: "Suspended",
  changes_requested: "Changes requested",
};

const token = () => localStorage.getItem("authToken") ?? undefined;

/**
 * Organization hub (V2 Phase 1 release 1.4b): profile, its listings, members
 * and settings. Every action is permission-driven, never role-name-driven.
 */
export function OrganizationHub({ slug }: { slug: string }) {
  const { active, refresh } = useOrganizations();
  const [detail, setDetail] = useState<OrganizationDetail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "not_found" | "error">("loading");
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get("tab") ?? "listings");

  // State is only set in the request's callbacks, never synchronously in the effect.
  const fetchDetail = useCallback(
    () =>
      getOrganization(slug, token())
        .then((result) => {
          setDetail(result);
          setState("ready");
        })
        .catch((error: unknown) => {
          setState(error instanceof OrganizationApiError && error.status === 404 ? "not_found" : "error");
        }),
    [slug],
  );

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const load = async () => {
    setState("loading");
    await fetchDetail();
  };

  if (state === "loading") {
    return (
      <div className="space-y-4 p-4 lg:p-8">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (state === "not_found") {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <h1 className="text-xl font-semibold text-[#1F3A4C]">Organization not found</h1>
        <p className="mt-2 text-gray-600">It may not exist, or you aren&apos;t a member of it.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/org">Back to your organizations</Link>
        </Button>
      </div>
    );
  }

  if (state === "error" || !detail) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="text-gray-700">We couldn&apos;t load this organization.</p>
        <Button variant="outline" className="mt-4" onClick={() => void load()}>
          Try again
        </Button>
      </div>
    );
  }

  const { data: organization, membership } = detail;
  const can = (permission: string) => (membership.permissions as string[]).includes(permission);

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {active && (
        <ProfileCompletionBanner
          organization={active}
          onCompleteProfile={() => setTab("settings")}
          onDismissed={async () => {
            await refresh();
            await load();
          }}
        />
      )}

      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#1F3A4C]">
            <Building2 className="h-7 w-7 text-[#93C01F]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1F3A4C]">{organization.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              {organization.country && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {organization.country}
                </span>
              )}
              {organization.entity_kind && <span>· {ORG_ENTITY_KIND_LABEL[organization.entity_kind]}</span>}
              <Badge variant="secondary" className="flex items-center gap-1">
                {membership.is_primary_owner && <Crown className="h-3 w-3" />}
                {ORG_ROLE_LABEL[membership.role]}
              </Badge>
            </div>
          </div>
        </div>
        {can("listing.create") && (
          <Button asChild className="bg-[#93C01F] text-white hover:bg-[#82ab1b]">
            <Link href={`/dashboard/my-listing/create?organization=${encodeURIComponent(organization.slug)}`}>
              <Plus className="mr-1 h-4 w-4" /> Create listing
            </Link>
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          {can("organization.update") && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="listings" className="mt-4">
          <OrganizationListings slug={organization.slug} />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <OrganizationMembers slug={organization.slug} />
        </TabsContent>

        {can("organization.update") && (
          <TabsContent value="settings" className="mt-4">
            <div className="max-w-xl rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <OrganizationForm
                showContact
                submitLabel="Save changes"
                initialValues={{
                  name: organization.name,
                  country: organization.country ?? "",
                  entity_kind: organization.entity_kind,
                  email: organization.email ?? "",
                  primary_phone: organization.primary_phone ?? "",
                }}
                onSubmit={async (values) => {
                  await updateOrganization(
                    organization.slug,
                    {
                      name: values.name,
                      country: values.country,
                      entity_kind: values.entity_kind,
                      email: values.email || null,
                      primary_phone: values.primary_phone || null,
                    },
                    token(),
                  );
                  toast.success("Organization updated.");
                  await refresh();
                  await load();
                }}
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function OrganizationListings({ slug }: { slug: string }) {
  const [listings, setListings] = useState<OrganizationListingItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOrganizationListings(slug, token())
      .then((page) => !cancelled && setListings(page.data))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (failed) return <p className="text-sm text-red-600">We couldn&apos;t load this organization&apos;s listings.</p>;
  if (!listings) return <Skeleton className="h-40 w-full rounded-2xl" />;
  if (listings.length === 0) {
    return <p className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-500">No listings yet.</p>;
  }

  return (
    <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
      {listings.map((listing) => {
        const cover = listing.images?.[0];
        return (
          <li key={listing.id}>
            <Link href={`/dashboard/my-listing/${listing.slug}`} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                <Image src={getImageUrl(cover?.thumb || cover?.original)} alt="" fill className="object-cover" sizes="48px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[#1F3A4C]">{listing.name}</p>
                <p className="text-xs capitalize text-gray-500">{listing.type}</p>
              </div>
              <Badge variant="outline">{LISTING_STATUS_LABEL[listing.status] ?? listing.status}</Badge>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function OrganizationMembers({ slug }: { slug: string }) {
  const [members, setMembers] = useState<OrganizationMember[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOrganizationMembers(slug, token())
      .then((rows) => !cancelled && setMembers(rows))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (failed) return <p className="text-sm text-red-600">We couldn&apos;t load the members.</p>;
  if (!members) return <Skeleton className="h-32 w-full rounded-2xl" />;

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        {members.map((member) => (
          <li key={member.user_id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-[#1F3A4C]">{member.name || "Unnamed member"}</p>
              {member.email && <p className="truncate text-xs text-gray-500">{member.email}</p>}
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              {member.is_primary_owner && <Crown className="h-3 w-3" />}
              {member.is_primary_owner ? "Primary owner" : ORG_ROLE_LABEL[member.role]}
            </Badge>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500">Inviting team members is coming soon.</p>
    </div>
  );
}
