"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  decideVerification,
  getVerificationEvidenceUrl,
  listVerificationRequests,
  revokeOrgVerification,
  type OrgVerificationRequest,
} from "@/lib/api";
import { usePlatformAccess } from "@/hooks/usePlatformAccess";
import { RoleGuard } from "@/components/dashboard/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FILTERS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

type Action = { kind: "reject" | "revoke"; request: OrgVerificationRequest };

export default function AdminVerificationQueue() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <QueueBody />
    </RoleGuard>
  );
}

function QueueBody() {
  const { can } = usePlatformAccess();
  const allowed = can("platform.organizations.verify");

  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState<OrgVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const token = () => localStorage.getItem("authToken") ?? undefined;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listVerificationRequests(status, token()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load requests");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDocument = async (request: OrgVerificationRequest, evidenceId: number) => {
    try {
      const url = await getVerificationEvidenceUrl(request.id, evidenceId, token());
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open the document");
    }
  };

  const approve = async (request: OrgVerificationRequest) => {
    setBusyId(request.id);
    try {
      await decideVerification(request.id, "approve", undefined, token());
      toast.success(`${request.organization?.name ?? "Organization"} is verified.`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not approve");
    } finally {
      setBusyId(null);
    }
  };

  const closeDialog = () => {
    setAction(null);
    setReason("");
    setFormError(null);
  };

  const submitReason = async () => {
    if (!action) return;
    if (reason.trim().length < 5) {
      setFormError("Give a reason of at least 5 characters.");
      return;
    }
    setBusyId(action.request.id);
    setFormError(null);
    try {
      if (action.kind === "reject") {
        await decideVerification(action.request.id, "reject", reason.trim(), token());
        toast.success("Request declined.");
      } else {
        await revokeOrgVerification(action.request.organization?.slug ?? "", reason.trim(), token());
        toast.success("Verification removed.");
      }
      closeDialog();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Organization verifications</h1>
        <p className="text-sm text-gray-600">Review the documents owners send, then approve or decline. Removing a verification hides it everywhere at once.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button key={f.value} size="sm" variant={status === f.value ? "default" : "outline"} onClick={() => setStatus(f.value)}>
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : error ? (
        <div className="text-sm text-red-700">{error} <Button variant="link" className="h-auto p-0" onClick={() => void load()}>Retry</Button></div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">No requests here.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#1F3A4C]">{r.organization?.name}</p>
                  <p className="text-xs text-gray-500">
                    {r.organization?.country ?? "No country"} · requested by {r.requested_by?.name ?? "unknown"} on {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline">{r.status}</Badge>
              </div>
              {r.note && <p className="mt-2 text-sm text-gray-700">{r.note}</p>}
              {r.decision_reason && <p className="mt-2 text-sm text-amber-800">Reason: {r.decision_reason}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {(r.evidence ?? []).map((e) => (
                  <Button key={e.id} size="sm" variant="outline" onClick={() => void openDocument(r, e.id)}>
                    <FileText className="mr-1 h-4 w-4" />{e.filename}
                  </Button>
                ))}
              </div>
              {allowed && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" disabled={busyId === r.id} onClick={() => void approve(r)}>Approve</Button>
                      <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => setAction({ kind: "reject", request: r })}>Decline</Button>
                    </>
                  )}
                  {r.status === "approved" && r.organization?.verification_status === "verified" && (
                    <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => setAction({ kind: "revoke", request: r })}>Remove verification</Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={action !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action?.kind === "revoke" ? "Remove verification" : "Decline request"}</DialogTitle>
            <DialogDescription>
              {action?.request.organization?.name}. The owners are told the reason{action?.kind === "revoke" ? " and the badge disappears straight away" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="verification-reason">Reason</Label>
            <Textarea id="verification-reason" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />
            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button disabled={busyId !== null} onClick={() => void submitReason()}>
              {busyId !== null && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
