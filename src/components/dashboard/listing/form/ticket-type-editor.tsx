"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash, Plus } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface TicketType {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  price: string | number;
  sort_order: number;
  is_active: boolean;
}

interface Props {
  listingSlug: string;
  eventSlug: string;
}

const EMPTY_ROW = { name: "", description: "", price: "" };

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("authToken");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" };
}

export function TicketTypeEditor({ listingSlug, eventSlug }: Props) {
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRow, setNewRow] = useState(EMPTY_ROW);
  const [savingRow, setSavingRow] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listing/${listingSlug}/event/${eventSlug}/ticket-types`, { headers: authHeaders() });
      if (res.ok) {
        const json = await res.json();
        setTicketTypes(json.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (listingSlug && eventSlug) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingSlug, eventSlug]);

  const activeCount = ticketTypes.filter((t) => t.is_active).length;

  const updateRow = (slug: string, patch: Partial<TicketType>) => {
    setTicketTypes((prev) => prev.map((t) => (t.slug === slug ? { ...t, ...patch } : t)));
  };

  const saveRow = async (ticketType: TicketType) => {
    if (!ticketType.name.trim()) {
      toast.error("Enter a name for this ticket type.");
      return;
    }
    setSavingRow(ticketType.slug);
    try {
      const res = await fetch(`/api/ticket-types/${ticketType.slug}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ name: ticketType.name, description: ticketType.description, price: ticketType.price }),
      });
      if (!res.ok) throw new Error();
      toast.success("Ticket type saved");
    } catch {
      toast.error("Could not save this ticket type.");
    } finally {
      setSavingRow(null);
    }
  };

  const removeRow = async (ticketType: TicketType) => {
    setSavingRow(ticketType.slug);
    try {
      const res = await fetch(`/api/ticket-types/${ticketType.slug}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error();
      setTicketTypes((prev) => prev.map((t) => (t.slug === ticketType.slug ? { ...t, is_active: false } : t)));
      toast.success("Ticket type removed");
    } catch {
      toast.error("Could not remove this ticket type.");
    } finally {
      setSavingRow(null);
    }
  };

  const reactivateRow = async (ticketType: TicketType) => {
    setSavingRow(ticketType.slug);
    try {
      const res = await fetch(`/api/ticket-types/${ticketType.slug}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ is_active: true }),
      });
      if (!res.ok) throw new Error();
      setTicketTypes((prev) => prev.map((t) => (t.slug === ticketType.slug ? { ...t, is_active: true } : t)));
    } catch {
      toast.error("Could not restore this ticket type.");
    } finally {
      setSavingRow(null);
    }
  };

  const addRow = async () => {
    if (!newRow.name.trim() || newRow.price === "") {
      toast.error("Enter a name and price for the new ticket type.");
      return;
    }
    setSavingRow("new");
    try {
      const res = await fetch(`/api/listing/${listingSlug}/event/${eventSlug}/ticket-types`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(newRow),
      });
      if (!res.ok) throw new Error();
      setNewRow(EMPTY_ROW);
      await load();
      toast.success("Ticket type added");
    } catch {
      toast.error("Could not add this ticket type.");
    } finally {
      setSavingRow(null);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading ticket types…</p>;

  const inactive = ticketTypes.filter((t) => !t.is_active);

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Ticket types</p>
        <p className={cn("text-xs", activeCount < 2 ? "text-amber-600" : "text-muted-foreground")}>
          {activeCount} active {activeCount === 1 ? "type" : "types"} — at least 2 required
        </p>
      </div>

      {ticketTypes.filter((t) => t.is_active).map((t) => (
        <div key={t.slug} className="grid gap-2 sm:grid-cols-[2fr_2fr_1fr_auto] items-start rounded-lg border p-3">
          <Input value={t.name} onChange={(e) => updateRow(t.slug, { name: e.target.value })} placeholder="Name (e.g. VIP)" />
          <Input value={t.description ?? ""} onChange={(e) => updateRow(t.slug, { description: e.target.value })} placeholder="Description (optional)" />
          <Input type="number" min="0" step="0.01" value={t.price} onChange={(e) => updateRow(t.slug, { price: e.target.value })} placeholder="Price" />
          <div className="flex gap-1">
            <Button type="button" size="sm" variant="outline" disabled={savingRow === t.slug} onClick={() => saveRow(t)}>Save</Button>
            <Button type="button" size="icon" variant="ghost" disabled={savingRow === t.slug} onClick={() => removeRow(t)}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {inactive.length > 0 && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">Removed ticket types ({inactive.length})</summary>
          <div className="mt-2 space-y-2">
            {inactive.map((t) => (
              <div key={t.slug} className="flex items-center justify-between rounded-lg border border-dashed p-2">
                <span>{t.name} — {t.price}</span>
                <Button type="button" size="sm" variant="outline" disabled={savingRow === t.slug} onClick={() => reactivateRow(t)}>
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="grid gap-2 sm:grid-cols-[2fr_2fr_1fr_auto] items-start rounded-lg border border-dashed p-3">
        <Input value={newRow.name} onChange={(e) => setNewRow((r) => ({ ...r, name: e.target.value }))} placeholder="Name (e.g. Regular)" />
        <Input value={newRow.description} onChange={(e) => setNewRow((r) => ({ ...r, description: e.target.value }))} placeholder="Description (optional)" />
        <Input type="number" min="0" step="0.01" value={newRow.price} onChange={(e) => setNewRow((r) => ({ ...r, price: e.target.value }))} placeholder="Price" />
        <Button type="button" size="sm" disabled={savingRow === "new"} onClick={addRow}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </div>
  );
}
