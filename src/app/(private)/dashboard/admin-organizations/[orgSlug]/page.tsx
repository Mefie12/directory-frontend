"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrganizationsGate } from "@/components/dashboard/organizations/organizations-gate";
import { OrganizationActivity } from "@/components/dashboard/organizations/organization-activity";
import { useOrganizations } from "@/hooks/useOrganizations";
import {
  getAdminOrganization,
  getAdminOrganizationActivity,
  OrganizationApiError,
  restoreOrganizationListings,
  suspendOrganization,
  unsuspendOrganization,
} from "@/lib/api";
import { ORG_ROLE_LABEL, type AdminOrganizationDetail } from "@/types/organization";
import { getAuthToken } from "@/lib/client-auth";

const token = () => getAuthToken() ?? undefined;
const errorText = (error: unknown) => (error instanceof OrganizationApiError ? error.message : "Something went wrong. Please try again.");

function AdminOrganizationDetailView({ slug }: { slug: string }) {
  const { lifecycle } = useOrganizations();
  const [detail, setDetail] = useState<AdminOrganizationDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [dialog, setDialog] = useState<null | "suspend" | "restore">(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () =>
      getAdminOrganization(slug, token())
        .then((data) => {
          setDetail(data);
          setFailed(false);
        })
        .catch(() => setFailed(true)),
    [slug],
  );

  useEffect(() => {
    if (lifecycle) void load();
  }, [lifecycle, load]);

  const activityLoader = useMemo(() => (page: number) => getAdminOrganizationActivity(slug, page, token()), [slug]);

  if (!lifecycle) return <p className="p-8 text-gray-600">Organization administration is not enabled.</p>;
  if (failed) return <p className="p-8 text-sm text-red-600">We couldn&apos;t load this organization.</p>;
  if (!detail) return <Skeleton className="m-8 h-64 rounded-2xl" />;

  const { data: organization, members, listings } = detail;
  const approved = listings.filter((listing) => listing.status === "approved").length;
  const suspendedListings = listings.filter((listing) => listing.status === "suspended").length;

  const run = async (action: () => Promise<string>) => {
    setBusy(true);
    try {
      toast.success(await action());
      setDialog(null);
      setReason("");
      await load();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard/admin-organizations" className="text-sm text-gray-500 hover:underline">
            ← All organizations
          </Link>
          <h1 className="mt-1 text-xl font-bold text-[#1F3A4C]">{organization.name}</h1>
          <p className="text-sm text-gray-500">
            <Badge variant="secondary" className="mr-2 capitalize">
              {organization.status}
            </Badge>
            {organization.status_reason && <>Reason: {organization.status_reason}</>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {organization.status === "suspended" ? (
            <Button variant="outline" onClick={() => setDialog("restore")}>
              Restore organization
            </Button>
          ) : organization.status === "active" ? (
            <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => setDialog("suspend")}>
              Suspend organization
            </Button>
          ) : null}
          {organization.status === "active" && suspendedListings > 0 && (
            <Button
              variant="outline"
              onClick={() =>
                void run(async () => {
                  const result = await restoreOrganizationListings(slug, token());
                  return `${result.listings_restored} listing(s) returned to review.`;
                })
              }
            >
              Return suspended listings to review
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="listings">
        <TabsList>
          <TabsTrigger value="listings">Listings ({listings.length})</TabsTrigger>
          <TabsTrigger value="members">Members ({members.filter((m) => m.status === "active").length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-4">
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
            {listings.length === 0 && <li className="p-6 text-center text-gray-500">No listings.</li>}
            {listings.map((listing) => (
              <li key={listing.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="truncate text-[#1F3A4C]">{listing.name}</span>
                <Badge variant="outline" className="capitalize">
                  {listing.status}
                </Badge>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
            {members.map((member) => (
              <li key={member.user_id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#1F3A4C]">{member.name}</p>
                  {member.email && <p className="truncate text-xs text-gray-500">{member.email}</p>}
                </div>
                <Badge variant="secondary">
                  {member.is_primary_owner ? "Primary owner" : ORG_ROLE_LABEL[member.role]}
                  {member.status !== "active" && ` (${member.status})`}
                </Badge>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <OrganizationActivity slug={slug} loader={activityLoader} />
        </TabsContent>
      </Tabs>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog === "suspend" ? `Suspend ${organization.name}?` : `Restore ${organization.name}?`}</DialogTitle>
            <DialogDescription>
              {dialog === "suspend"
                ? `${approved} approved listing${approved === 1 ? "" : "s"} will be suspended and owners and admins will be emailed. Pending listings stay pending but cannot be approved until it is restored.`
                : "The organization becomes active again. Its listings are not republished automatically; use 'Return suspended listings to review' afterwards."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="org-reason">{dialog === "suspend" ? "Reason (required, min 5 characters)" : "Note (optional)"}</Label>
            <Input id="org-reason" value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            {dialog === "suspend" ? (
              <Button
                variant="destructive"
                disabled={busy || reason.trim().length < 5}
                onClick={() =>
                  void run(async () => {
                    const result = await suspendOrganization(slug, reason.trim(), token());
                    return `Suspended. ${result.listings_suspended} listing(s) suspended.`;
                  })
                }
              >
                {busy ? "Suspending…" : "Suspend"}
              </Button>
            ) : (
              <Button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await unsuspendOrganization(slug, reason.trim() || undefined, token());
                    return "Organization restored.";
                  })
                }
              >
                {busy ? "Restoring…" : "Restore"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminOrganizationDetailPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();

  return (
    <OrganizationsGate>
      <AdminOrganizationDetailView slug={orgSlug} />
    </OrganizationsGate>
  );
}
