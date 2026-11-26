"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Crown, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrganization, OrganizationApiError, updateOrganization } from "@/lib/api";
import { getAuthToken } from "@/lib/client-auth";
import { organizationPath } from "@/lib/workspace";
import { useOrganizations } from "@/hooks/useOrganizations";
import {
  ORG_ENTITY_KIND_LABEL,
  ORG_ROLE_LABEL,
  type OrganizationDetail,
  type OrgPermission,
} from "@/types/organization";
import { ArchiveOrganizationSection } from "./archive-organization-section";
import { OrganizationActivity } from "./organization-activity";
import { OrganizationBilling } from "./organization-billing";
import { OrganizationForm } from "./organization-form";
import { OrganizationMembers } from "./organization-members";
import { OrganizationStatusBanner } from "./organization-status-banner";
import { OrganizationVerification } from "./organization-verification";
import { ProfileCompletionBanner } from "./profile-completion-banner";

const token = () => getAuthToken() ?? undefined;

interface OrganizationWorkspaceValue {
  detail: OrganizationDetail;
  /** True while the organization is archived or suspended: the backend refuses writes too. */
  readOnly: boolean;
  /** Membership permission check; always false while read-only. */
  can: (permission: OrgPermission | string) => boolean;
  /** Membership permission check that ignores read-only (for read-only views like Activity). */
  holds: (permission: OrgPermission | string) => boolean;
  reload: () => Promise<void>;
}

const OrganizationWorkspaceContext = createContext<OrganizationWorkspaceValue | null>(null);

/** The open organization's profile and the user's membership of it. Only inside /dashboard/org/[orgSlug]. */
export function useOrganizationWorkspace(): OrganizationWorkspaceValue {
  const value = useContext(OrganizationWorkspaceContext);
  if (!value) throw new Error("useOrganizationWorkspace must be used inside OrganizationWorkspaceProvider");
  return value;
}

/**
 * Loads one organization for every page of its workspace (V2 workspaces).
 *
 * A slug the user is not a member of is a 404 from Laravel (the organization's
 * existence is not disclosed); the user is sent back to their organization list.
 */
export function OrganizationWorkspaceProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const router = useRouter();
  const { refresh } = useOrganizations();
  const [detail, setDetail] = useState<OrganizationDetail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  // State is only set in the request's callbacks, never synchronously in the effect.
  const fetchDetail = useCallback(
    () =>
      getOrganization(slug, token())
        .then((result) => {
          setDetail(result);
          setState("ready");
        })
        .catch((error: unknown) => {
          if (error instanceof OrganizationApiError && error.status === 404) {
            toast.error("That organization isn't available to you.");
            router.replace("/dashboard/org");
            return;
          }
          setState("error");
        }),
    [slug, router],
  );

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const reload = useCallback(async () => {
    await refresh();
    await fetchDetail();
  }, [refresh, fetchDetail]);

  if (state === "error") {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="text-gray-700">We couldn&apos;t load this organization.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setState("loading");
            void fetchDetail();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (state === "loading" || !detail) {
    return (
      <div className="space-y-4 p-4 lg:p-8">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const readOnly = detail.data.status !== "active";
  const permissions = detail.membership.permissions as string[];
  const value: OrganizationWorkspaceValue = {
    detail,
    readOnly,
    holds: (permission) => permissions.includes(permission),
    can: (permission) => !readOnly && permissions.includes(permission),
    reload,
  };

  return <OrganizationWorkspaceContext.Provider value={value}>{children}</OrganizationWorkspaceContext.Provider>;
}

/** Status and profile banners plus the organization header, shown on every workspace page. */
export function OrganizationWorkspaceHeader() {
  const router = useRouter();
  const { active } = useOrganizations();
  const { detail, readOnly, can, holds, reload } = useOrganizationWorkspace();
  const { data: organization, membership } = detail;

  return (
    <div className="space-y-4">
      <OrganizationStatusBanner
        slug={organization.slug}
        status={organization.status}
        reason={organization.status_reason}
        canRestore={holds("organization.archive")}
        onRestored={reload}
      />

      {active && !readOnly && (
        <ProfileCompletionBanner
          organization={active}
          onCompleteProfile={() => router.push(organizationPath(organization.slug, "settings"))}
          onDismissed={reload}
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
            <Link href={`${organizationPath(organization.slug, "listings")}/new?organization=${encodeURIComponent(organization.slug)}`}>
              <Plus className="mr-1 h-4 w-4" /> Create listing
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

/** Shown when a section's flag or the user's permission does not allow it. */
function SectionUnavailable({ slug }: { slug: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
      <p className="text-gray-600">This section isn&apos;t available for your role in this organization.</p>
      <Button asChild variant="outline" className="mt-4">
        <Link href={organizationPath(slug)}>Back to overview</Link>
      </Button>
    </div>
  );
}

export function OrganizationMembersSection() {
  const { teams } = useOrganizations();
  const { detail, readOnly } = useOrganizationWorkspace();
  return (
    <OrganizationMembers
      slug={detail.data.slug}
      permissions={detail.membership.permissions}
      isPrimaryOwner={detail.membership.is_primary_owner}
      teams={teams && !readOnly}
    />
  );
}

export function OrganizationActivitySection() {
  const { teams } = useOrganizations();
  const { detail, holds } = useOrganizationWorkspace();
  if (!teams || !holds("activity.view")) return <SectionUnavailable slug={detail.data.slug} />;
  return <OrganizationActivity slug={detail.data.slug} />;
}

export function OrganizationBillingSection() {
  const { orgBilling } = useOrganizations();
  const { detail, holds } = useOrganizationWorkspace();
  if (!orgBilling || !holds("billing.manage")) return <SectionUnavailable slug={detail.data.slug} />;
  return <OrganizationBilling slug={detail.data.slug} />;
}

export function OrganizationSettingsSection() {
  const { lifecycle } = useOrganizations();
  const { detail, can, reload } = useOrganizationWorkspace();
  const organization = detail.data;
  if (!can("organization.update")) return <SectionUnavailable slug={organization.slug} />;

  return (
    <div className="space-y-4">
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
            await reload();
          }}
        />
      </div>
      <OrganizationVerification slug={organization.slug} canRequest={can("organization.verify")} />
      {lifecycle && can("organization.archive") && (
        <ArchiveOrganizationSection slug={organization.slug} name={organization.name} onArchived={reload} />
      )}
    </div>
  );
}
