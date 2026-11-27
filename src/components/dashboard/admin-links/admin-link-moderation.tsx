"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import {
  blockLinkDomain,
  disableListingLink,
  getAdminListingLinks,
  getBlockedLinkDomains,
  restoreListingLink,
  unblockLinkDomain,
  type AdminListingLinksRow,
  type BlockedLinkDomain,
  type ListingLinkCheck,
} from "@/lib/api";
import { getAuthToken } from "@/lib/client-auth";
import { RoleGuard } from "@/components/dashboard/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const token = () => getAuthToken() ?? undefined;

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "ok", label: "Shown" },
  { value: "invalid", label: "Failing checks" },
  { value: "blocked", label: "Blocked domain" },
  { value: "disabled_by_admin", label: "Taken down" },
];

const STATUS_BADGE: Record<ListingLinkCheck["status"], { label: string; className: string }> = {
  none: { label: "None", className: "bg-gray-100 text-gray-600" },
  ok: { label: "Shown", className: "bg-green-50 text-green-700" },
  invalid: { label: "Hidden: fails checks", className: "bg-amber-50 text-amber-800" },
  blocked: { label: "Hidden: blocked domain", className: "bg-red-50 text-red-700" },
  disabled_by_admin: { label: "Taken down", className: "bg-red-50 text-red-700" },
};

const FIELD_LABEL: Record<ListingLinkCheck["field"], string> = {
  website: "Website",
  whatsapp: "WhatsApp",
  tickets: "Tickets",
  registration: "Registration",
  online: "Online event",
};

/** What the destination resolver found, in one line for the admin; null when there's nothing to add. */
function resolutionNote(link: ListingLinkCheck): string | null {
  const resolution = link.resolution;
  if (!resolution) return null;
  const route = resolution.hosts.filter((host, index, hosts) => host !== hosts[index - 1]).join(" → ");
  switch (resolution.outcome) {
    case "ok":
      return resolution.final_host && resolution.final_host !== link.host ? `Redirects: ${route}` : null;
    case "blocked":
    case "unsafe":
      return `Redirects: ${route}`;
    case "unreachable":
      return "Couldn't be reached on the last check (still shown).";
    case "too_many_redirects":
      return `Too many redirects (still shown): ${route}`;
  }
}

/**
 * V2 Phase 6.1 admin screen: every listing's website / WhatsApp link with its policy
 * status, take-down and restore, and the domain blocklist (spec §4.3 step 5).
 * 6.2: event links too, and where each link really leads (destination resolver).
 * Platform permission: platform.listings.moderate (enforced by Laravel).
 */
export default function AdminLinkModeration() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-6 p-4 lg:p-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Listing links</h1>
          <p className="mt-1 text-sm text-gray-500">
            Websites and WhatsApp links shown on listing pages. Links go live after automatic checks; take one down or
            block its domain if it slips through.
          </p>
        </div>
        <Tabs defaultValue="links">
          <TabsList>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="domains">Blocked domains</TabsTrigger>
          </TabsList>
          <TabsContent value="links" className="mt-4">
            <LinksPanel />
          </TabsContent>
          <TabsContent value="domains" className="mt-4">
            <DomainsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}

type TakeDown = { row: AdminListingLinksRow; link: ListingLinkCheck };

function LinksPanel() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminListingLinksRow[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [takeDown, setTakeDown] = useState<TakeDown | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    return getAdminListingLinks(token(), { q: search || undefined, status: status || undefined, page })
      .then((result) => {
        setRows(result.data);
        setLastPage(result.meta?.last_page ?? 1);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [search, status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const replaceRow = (updated: AdminListingLinksRow) =>
    setRows((current) => current.map((row) => (row.listing.id === updated.listing.id ? updated : row)));

  const restore = async (row: AdminListingLinksRow, link: ListingLinkCheck) => {
    setBusy(`${row.listing.id}-${link.field}`);
    try {
      const result = await restoreListingLink(row.listing.slug, link.field, token());
      replaceRow(result.data);
      toast.success("Link restored.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't restore the link.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch(query.trim());
        }}
      >
        <div className="relative sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search listing, link or domain"
            aria-label="Search listing, link or domain"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.value || "all"}
              type="button"
              size="sm"
              variant={status === filter.value ? "default" : "outline"}
              onClick={() => {
                setPage(1);
                setStatus(filter.value);
              }}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </form>

      {state === "loading" && (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#93C01F]" />
        </div>
      )}
      {state === "error" && (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-gray-700">We couldn&apos;t load listing links.</p>
          <Button variant="outline" className="mt-3" onClick={() => void load()}>
            Try again
          </Button>
        </div>
      )}
      {state === "ready" && rows.length === 0 && (
        <p className="rounded-xl border border-dashed p-8 text-center text-gray-500">No listings match.</p>
      )}

      {state === "ready" && rows.length > 0 && (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border bg-white">
          {rows.map((row) => (
            <li key={row.listing.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={`/dashboard/listings/${row.listing.slug}`} className="font-medium text-gray-900 hover:underline">
                  {row.listing.name}
                </Link>
                <span className="text-xs text-gray-500">
                  {row.listing.organization?.name ?? "No organization"} · {row.listing.type} · {row.listing.status}
                </span>
              </div>
              {row.links
                .filter((link) => link.status !== "none")
                .map((link) => {
                  const badge = STATUS_BADGE[link.status];
                  const key = `${row.listing.id}-${link.field}`;
                  return (
                    <div key={link.field} className="flex flex-col gap-2 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center">
                      <span className="w-24 shrink-0 text-xs font-semibold uppercase text-gray-500">{FIELD_LABEL[link.field] ?? link.field}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-sm text-gray-800" title={link.value ?? ""}>
                          {link.value}
                        </p>
                        {link.message && <p className="text-xs text-gray-500">{link.message}</p>}
                        {resolutionNote(link) && (
                          <p className="truncate text-xs text-gray-500" title={resolutionNote(link) ?? ""}>
                            {resolutionNote(link)}
                          </p>
                        )}
                      </div>
                      <Badge className={badge.className} variant="secondary">
                        {badge.label}
                      </Badge>
                      {link.status === "disabled_by_admin" ? (
                        <Button size="sm" variant="outline" disabled={busy === key} onClick={() => void restore(row, link)}>
                          Restore
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setTakeDown({ row, link })}
                        >
                          Take down
                        </Button>
                      )}
                    </div>
                  );
                })}
            </li>
          ))}
        </ul>
      )}

      {state === "ready" && lastPage > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {lastPage}
          </span>
          <Button size="sm" variant="outline" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <TakeDownDialog
        target={takeDown}
        onClose={() => setTakeDown(null)}
        onDone={(updated) => {
          replaceRow(updated);
          setTakeDown(null);
        }}
      />
    </div>
  );
}

function TakeDownDialog({
  target,
  onClose,
  onDone,
}: {
  target: TakeDown | null;
  onClose: () => void;
  onDone: (row: AdminListingLinksRow) => void;
}) {
  const [reason, setReason] = useState("");
  const [blockDomain, setBlockDomain] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setReason("");
    setBlockDomain(false);
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!target) return;
    if (reason.trim().length < 5) {
      setError("Give a reason of at least 5 characters. The business will see it.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await disableListingLink(target.row.listing.slug, target.link.field, { reason: reason.trim(), block_domain: blockDomain }, token());
      toast.success(blockDomain ? "Link taken down and domain blocked." : "Link taken down.");
      setReason("");
      setBlockDomain(false);
      onDone(result.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't take the link down.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Take down this link?</DialogTitle>
          <DialogDescription>
            It stops showing on {target?.row.listing.name} at once. The business is notified with your reason and must
            use a different link to show one again.
          </DialogDescription>
        </DialogHeader>
        <p className="break-all rounded-lg bg-gray-50 p-3 font-mono text-sm text-gray-800">{target?.link.value}</p>
        <div className="space-y-2">
          <Label htmlFor="takedown-reason">Reason</Label>
          <Textarea
            id="takedown-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="For example: redirects to a phishing page"
            maxLength={500}
          />
        </div>
        {target?.link.host && (
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <Checkbox checked={blockDomain} onCheckedChange={(checked) => setBlockDomain(checked === true)} className="mt-0.5" />
            <span>
              Also block <span className="font-mono">{target.link.host}</span> and its subdomains for every listing
            </span>
          </label>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => void submit()} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Take down
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DomainsPanel() {
  const [domains, setDomains] = useState<BlockedLinkDomain[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [domain, setDomain] = useState("");
  const [reason, setReason] = useState("");
  const [includeSubdomains, setIncludeSubdomains] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(
    () =>
      getBlockedLinkDomains(token())
        .then((result) => {
          setDomains(result.data);
          setState("ready");
        })
        .catch(() => setState("error")),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    if (!domain.trim() || reason.trim().length < 5) {
      setFormError("Enter a domain and a reason of at least 5 characters.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const result = await blockLinkDomain({ domain: domain.trim(), reason: reason.trim(), include_subdomains: includeSubdomains }, token());
      setDomains((current) => [result.data, ...current]);
      setDomain("");
      setReason("");
      toast.success(
        result.affected_listings > 0
          ? `Blocked. ${result.affected_listings} listing${result.affected_listings === 1 ? "" : "s"} affected and notified.`
          : "Blocked. No current listings use it.",
      );
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Couldn't block the domain.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: BlockedLinkDomain) => {
    setBusyId(item.id);
    try {
      await unblockLinkDomain(item.id, token());
      setDomains((current) => current.filter((entry) => entry.id !== item.id));
      toast.success(`${item.domain} unblocked.`);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Couldn't unblock the domain.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <form
        className="space-y-3 rounded-xl border bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void add();
        }}
      >
        <h2 className="font-semibold text-gray-900">Block a domain</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="block-domain">Domain</Label>
            <Input id="block-domain" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="example.com" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="block-reason">Reason</Label>
            <Input id="block-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Phishing site" maxLength={500} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <Checkbox checked={includeSubdomains} onCheckedChange={(checked) => setIncludeSubdomains(checked === true)} />
          Include subdomains
        </label>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <Button type="submit" disabled={saving} className="bg-red-600 text-white hover:bg-red-700">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Block domain
        </Button>
      </form>

      {state === "loading" && (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#93C01F]" />
        </div>
      )}
      {state === "error" && (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <p className="text-gray-700">We couldn&apos;t load the blocklist.</p>
          <Button variant="outline" className="mt-3" onClick={() => void load()}>
            Try again
          </Button>
        </div>
      )}
      {state === "ready" && domains.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-center text-gray-500">No domains are blocked.</p>
      )}
      {state === "ready" && domains.length > 0 && (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border bg-white">
          {domains.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-medium text-gray-900">
                  {item.domain}
                  {item.include_subdomains && <span className="ml-2 font-sans text-xs text-gray-500">+ subdomains</span>}
                </p>
                <p className="text-xs text-gray-500">
                  {item.reason}
                  {item.created_by ? ` · by ${item.created_by.name}` : ""}
                </p>
              </div>
              <Button size="sm" variant="outline" disabled={busyId === item.id} onClick={() => void remove(item)}>
                Unblock
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
