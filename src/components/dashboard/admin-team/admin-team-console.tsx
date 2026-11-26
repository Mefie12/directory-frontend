"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { ApiRequestError, getPlatformTeam, setSuperAdmin, type PlatformTeam, type PlatformTeamMember } from "@/lib/api";
import { usePlatformAccess } from "@/hooks/usePlatformAccess";
import { RoleGuard } from "@/components/dashboard/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuthToken } from "@/lib/client-auth";

const ROLE_LABEL: Record<PlatformTeamMember["platform_role"], string> = {
  super_admin: "Super admin",
  admin: "Admin",
  listing_agent: "Listing agent",
};

export default function AdminTeamConsole() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <ConsoleBody />
    </RoleGuard>
  );
}

function ConsoleBody() {
  const { can } = usePlatformAccess();
  const canManage = can("platform.admins.manage");

  const [team, setTeam] = useState<PlatformTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [target, setTarget] = useState<PlatformTeamMember | null>(null);
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken() ?? undefined;
      setTeam(await getPlatformTeam(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the admin team");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const close = () => {
    setTarget(null);
    setReason("");
    setPassword("");
    setFormError(null);
  };

  const submit = async () => {
    if (!target) return;
    if (reason.trim().length < 5) {
      setFormError("Give a reason of at least 5 characters.");
      return;
    }
    if (!password) {
      setFormError("Enter your own password to confirm.");
      return;
    }

    setSaving(true);
    setFormError(null);
    const grant = !target.is_super_admin;
    try {
      const token = getAuthToken() ?? undefined;
      await setSuperAdmin(target.id, grant, { reason: reason.trim(), password }, token);
      toast.success(grant ? `${target.name} is now a super admin.` : `${target.name} is no longer a super admin.`);
      close();
      await load();
    } catch (err) {
      setFormError(err instanceof ApiRequestError || err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin team</h1>
        <p className="text-sm text-gray-600">
          Everyone with a platform role. Super admins can also manage admins and other super admins.
        </p>
      </div>

      {team?.below_floor && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>
            {team.active_super_admins === 0
              ? "There is no active super admin."
              : "There is only one active super admin."}{" "}
            Add a second one so a single lost account cannot lock the team out.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" aria-label="Loading" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => void load()}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Super admin</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {team?.members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={member.is_super_admin ? "default" : "outline"}>
                      {member.is_super_admin && <ShieldCheck className="mr-1 h-3 w-3" aria-hidden />}
                      {ROLE_LABEL[member.platform_role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.is_suspended ? <Badge className="bg-red-500 text-white hover:bg-red-500">Suspended</Badge> : "Active"}
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      {member.role === "admin" ? (
                        <Button
                          size="sm"
                          variant={member.is_super_admin ? "outline" : "default"}
                          onClick={() => setTarget(member)}
                        >
                          {member.is_super_admin ? "Remove" : "Make super admin"}
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">Admins only</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!canManage && !loading && !error && (
        <p className="text-xs text-gray-500">Only a super admin can change who is a super admin.</p>
      )}

      <Dialog open={target !== null} onOpenChange={(open) => !open && !saving && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {target?.is_super_admin ? "Remove super admin" : "Make super admin"}
            </DialogTitle>
            <DialogDescription>
              {target?.is_super_admin
                ? `${target?.name} will keep their admin role but lose the super admin powers.`
                : `${target?.name} will be able to create and remove admins and manage super admins.`}{" "}
              This is recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="team-reason">Reason</Label>
              <Textarea
                id="team-reason"
                value={reason}
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Why is this change needed?"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="team-password">Your password</Label>
              <Input
                id="team-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {formError && (
              <p role="alert" className="text-sm text-red-600">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void submit()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
