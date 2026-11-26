"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrganizationsGate } from "@/components/dashboard/organizations/organizations-gate";
import { useOrganizations } from "@/hooks/useOrganizations";
import { getAdminOrganizations } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { AdminOrganizationPage } from "@/types/organization";
import { getAuthToken } from "@/lib/client-auth";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
  archived: "bg-gray-100 text-gray-700",
};

function AdminOrganizationsList() {
  const { lifecycle } = useOrganizations();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const debounced = useDebouncedValue(search, 300);
  const [result, setResult] = useState<AdminOrganizationPage | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!lifecycle) return;
    let cancelled = false;
    getAdminOrganizations(
      { search: debounced || undefined, status: status === "all" ? undefined : status, page },
      getAuthToken() ?? undefined,
    )
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        setFailed(false);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [lifecycle, debounced, status, page]);

  if (!lifecycle) return <p className="p-8 text-gray-600">Organization administration is not enabled.</p>;

  const lastPage = result?.meta?.last_page ?? 1;

  return (
    <div className="space-y-4 p-4 lg:p-8">
      <h1 className="text-xl font-bold text-[#1F3A4C]">Organizations</h1>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search by name"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="sm:max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {failed ? (
        <p className="text-sm text-red-600">We couldn&apos;t load organizations.</p>
      ) : !result ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : result.data.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-500">No organizations match.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Members</TableHead>
                <TableHead className="text-right">Listings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((organization) => (
                <TableRow key={organization.id}>
                  <TableCell>
                    <Link href={`/dashboard/admin-organizations/${organization.slug}`} className="font-medium text-[#1F3A4C] hover:underline">
                      {organization.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_STYLE[organization.status] ?? ""} variant="secondary">
                      {organization.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{organization.active_memberships_count ?? "-"}</TableCell>
                  <TableCell className="text-right">{organization.listings_count ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {lastPage}
          </span>
          <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AdminOrganizationsPage() {
  return (
    <OrganizationsGate>
      <AdminOrganizationsList />
    </OrganizationsGate>
  );
}
