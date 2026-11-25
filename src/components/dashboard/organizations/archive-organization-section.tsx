"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArchiveBlockedError, archiveOrganization, OrganizationApiError } from "@/lib/api";
import type { ArchiveBlockingListing } from "@/types/organization";

interface Props {
  slug: string;
  name: string;
  onArchived: () => Promise<void> | void;
}

/**
 * Settings "danger zone" for Owners. Archiving is refused while any listing is
 * published; the blocking listings are named so the owner knows what to do.
 */
export function ArchiveOrganizationSection({ slug, name, onArchived }: Props) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocking, setBlocking] = useState<ArchiveBlockingListing[]>([]);

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setPassword("");
      setError(null);
      setBlocking([]);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    setBlocking([]);
    try {
      await archiveOrganization(slug, { password, reason: reason.trim() || undefined }, localStorage.getItem("authToken") ?? undefined);
      toast.success("Organization archived.");
      close(false);
      await onArchived();
    } catch (err) {
      if (err instanceof ArchiveBlockedError) {
        setBlocking(err.listings);
        setError(err.message);
      } else {
        setError(err instanceof OrganizationApiError ? (err.fieldErrors.password?.[0] ?? err.message) : "Something went wrong.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-[#1F3A4C]">Archive this organization</h3>
      <p className="mt-1 text-sm text-gray-600">
        Archiving makes {name} read-only and cancels pending invitations. Members keep their access to view it, and you can restore it later. Published
        listings must be unpublished first.
      </p>
      <Button variant="outline" className="mt-3 border-red-200 text-red-700 hover:bg-red-50" onClick={() => setOpen(true)}>
        Archive organization
      </Button>

      <Dialog open={open} onOpenChange={close}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive {name}?</DialogTitle>
            <DialogDescription>Confirm with your password. You can restore it afterwards.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="archive-reason">Reason (optional)</Label>
              <Input id="archive-reason" value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="archive-password">Your password</Label>
              <Input id="archive-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            {blocking.length > 0 && (
              <ul className="space-y-1 rounded-lg bg-gray-50 p-3 text-sm">
                {blocking.map((listing) => (
                  <li key={listing.id}>
                    <Link href={`/dashboard/my-listing/${listing.slug}`} className="text-[#1F3A4C] underline">
                      {listing.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={busy || !password} onClick={() => void submit()}>
              {busy ? "Archiving…" : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
