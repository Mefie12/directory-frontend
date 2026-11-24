"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getOrganizationActivity } from "@/lib/api";
import { ACTIVITY_LABEL, ORG_ROLE_LABEL, type ActivityEntry, type OrgRole } from "@/types/organization";

const token = () => localStorage.getItem("authToken") ?? undefined;

function describe(entry: ActivityEntry): string {
  const actor = entry.actor?.name ?? "Someone";
  const verb = ACTIVITY_LABEL[entry.action] ?? entry.action;
  const target = entry.target ? ` (${entry.target.name})` : "";
  const { from, to, role } = entry.details;
  const roleNote =
    from && to
      ? `: ${ORG_ROLE_LABEL[from as OrgRole] ?? from} to ${ORG_ROLE_LABEL[to as OrgRole] ?? to}`
      : role
        ? ` as ${ORG_ROLE_LABEL[role as OrgRole] ?? role}`
        : "";
  return `${actor} ${verb}${target}${roleNote}`;
}

/** Owner-only audit trail (permission activity.view). */
export function OrganizationActivity({ slug }: { slug: string }) {
  const [entries, setEntries] = useState<ActivityEntry[] | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOrganizationActivity(slug, page, token())
      .then((result) => {
        if (cancelled) return;
        setEntries((previous) => (page === 1 ? result.data : [...(previous ?? []), ...result.data]));
        setLastPage(result.last_page);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [slug, page]);

  if (failed) return <p className="text-sm text-red-600">We couldn&apos;t load the activity.</p>;
  if (!entries) return <Skeleton className="h-40 w-full rounded-2xl" />;
  if (entries.length === 0) {
    return <p className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-500">No activity yet.</p>;
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
            <span className="text-[#1F3A4C]">{describe(entry)}</span>
            <time className="shrink-0 text-xs text-gray-500" dateTime={entry.created_at}>
              {new Date(entry.created_at).toLocaleString()}
            </time>
          </li>
        ))}
      </ul>
      {page < lastPage && (
        <Button variant="outline" onClick={() => setPage((current) => current + 1)}>
          Load more
        </Button>
      )}
    </div>
  );
}
