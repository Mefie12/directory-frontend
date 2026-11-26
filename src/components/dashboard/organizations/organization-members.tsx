"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Mail, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  changeMemberRole,
  getOrganizationInvites,
  getOrganizationMembers,
  leaveOrganization,
  OrganizationApiError,
  removeOrganizationMember,
  resendOrganizationInvite,
  revokeOrganizationInvite,
  sendOrganizationInvite,
  transferOrganizationOwnership,
} from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { useOrganizations } from "@/hooks/useOrganizations";
import {
  ORG_ROLE_LABEL,
  type OrganizationInvite,
  type OrganizationMember,
  type OrgPermission,
  type OrgRole,
} from "@/types/organization";
import { getAuthToken } from "@/lib/client-auth";

const ROLES: OrgRole[] = ["owner", "admin", "editor", "viewer"];
const token = () => getAuthToken() ?? undefined;
const message = (error: unknown) => (error instanceof OrganizationApiError ? error.message : "Something went wrong. Please try again.");

interface Props {
  slug: string;
  permissions: OrgPermission[];
  isPrimaryOwner: boolean;
  /** Teams features (invites, role changes). Off: read-only list as in Phase 1. */
  teams: boolean;
}

/**
 * Members tab. Controls come from the viewer's permissions, never role names:
 * `members.manage` shows invite/remove/role controls, and `ownership.transfer`
 * is what allows granting or touching Owners. The backend enforces every rule.
 */
export function OrganizationMembers({ slug, permissions, isPrimaryOwner, teams }: Props) {
  const { user } = useAuth();
  const { refresh } = useOrganizations();
  const router = useRouter();
  const [members, setMembers] = useState<OrganizationMember[] | null>(null);
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [failed, setFailed] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | { kind: "remove" | "leave"; member?: OrganizationMember }>(null);

  const canManage = teams && permissions.includes("members.manage");
  const canTouchOwners = permissions.includes("ownership.transfer");
  const me = Number(user?.id);

  // State is only set in the request's callbacks, never synchronously in the effect.
  const load = useCallback(
    () =>
      getOrganizationMembers(slug, token())
        .then(async (rows) => {
          const pending = canManage ? await getOrganizationInvites(slug, token()) : [];
          setMembers(rows);
          setInvites(pending);
          setFailed(false);
        })
        .catch(() => setFailed(true)),
    [slug, canManage],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: () => Promise<void>, success: string) => {
    try {
      await action();
      toast.success(success);
      await load();
      await refresh();
    } catch (error) {
      toast.error(message(error));
    }
  };

  if (failed) return <p className="text-sm text-red-600">We couldn&apos;t load the members.</p>;
  if (!members) return <Skeleton className="h-32 w-full rounded-2xl" />;

  const mayChange = (member: OrganizationMember) =>
    canManage && member.user_id !== me && !member.is_primary_owner && (member.role !== "owner" || canTouchOwners);
  const grantable = ROLES.filter((role) => role !== "owner" || canTouchOwners);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {members.length} member{members.length === 1 ? "" : "s"}
        </p>
        {canManage && (
          <Button className="bg-[#93C01F] text-white hover:bg-[#82ab1b]" onClick={() => setInviteOpen(true)}>
            <Mail className="mr-1 h-4 w-4" /> Invite member
          </Button>
        )}
      </div>

      <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        {members.map((member) => (
          <li key={member.user_id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-[#1F3A4C]">
                {member.name || "Unnamed member"}
                {member.user_id === me && <span className="ml-2 text-xs text-gray-400">(you)</span>}
              </p>
              {member.email && <p className="truncate text-xs text-gray-500">{member.email}</p>}
            </div>
            <div className="flex items-center gap-2">
              {mayChange(member) ? (
                <Select
                  value={member.role}
                  onValueChange={(role) =>
                    void run(() => changeMemberRole(slug, member.user_id, role as OrgRole, token()), "Role updated.")
                  }
                >
                  <SelectTrigger className="h-8 w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {grantable.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ORG_ROLE_LABEL[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {member.is_primary_owner && <Crown className="h-3 w-3" />}
                  {member.is_primary_owner ? "Primary owner" : ORG_ROLE_LABEL[member.role]}
                </Badge>
              )}
              {teams && (mayChange(member) || member.user_id === me) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={`Actions for ${member.name}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {member.user_id === me && !member.is_primary_owner && (
                      <DropdownMenuItem onClick={() => setConfirm({ kind: "leave" })}>Leave organization</DropdownMenuItem>
                    )}
                    {mayChange(member) && (
                      <DropdownMenuItem className="text-red-600" onClick={() => setConfirm({ kind: "remove", member })}>
                        Remove from organization
                      </DropdownMenuItem>
                    )}
                    {isPrimaryOwner && member.role === "owner" && member.user_id !== me && (
                      <DropdownMenuItem onClick={() => setTransferOpen(true)}>Transfer primary ownership…</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </li>
        ))}
      </ul>

      {canManage && invites.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#1F3A4C]">Pending invitations</h3>
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
            {invites.map((invite) => (
              <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#1F3A4C]">{invite.email}</p>
                  <p className="text-xs text-gray-500">
                    {ORG_ROLE_LABEL[invite.role]} · expires {new Date(invite.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void run(() => resendOrganizationInvite(slug, invite.id, token()).then(() => undefined), "Invitation resent.")}
                  >
                    Resend
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => void run(() => revokeOrganizationInvite(slug, invite.id, token()), "Invitation revoked.")}
                  >
                    Revoke
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        roles={grantable.filter((role) => role !== "owner" || canTouchOwners)}
        onSend={async (email, role) => {
          await sendOrganizationInvite(slug, { email, role }, token());
          toast.success("Invitation sent.");
          await load();
        }}
      />

      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        owners={members.filter((member) => member.role === "owner" && member.user_id !== me)}
        onTransfer={async (userId, password) => {
          await transferOrganizationOwnership(slug, { user_id: userId, password }, token());
          toast.success("Primary ownership transferred.");
          await refresh();
          await load();
        }}
      />

      <Dialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm?.kind === "leave" ? "Leave this organization?" : "Remove this member?"}</DialogTitle>
            <DialogDescription>
              {confirm?.kind === "leave"
                ? "You will lose access to this organization and its listings."
                : `${confirm?.member?.name ?? "This person"} will lose access to this organization and its listings.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const current = confirm;
                setConfirm(null);
                if (!current) return;
                if (current.kind === "leave") {
                  await run(() => leaveOrganization(slug, token()), "You left the organization.");
                  router.push("/dashboard/org");
                } else if (current.member) {
                  await run(() => removeOrganizationMember(slug, current.member!.user_id, token()), "Member removed.");
                }
              }}
            >
              {confirm?.kind === "leave" ? "Leave" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  roles,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: OrgRole[];
  onSend: (email: string, role: OrgRole) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("editor");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onSend(email.trim(), role);
      setEmail("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof OrganizationApiError ? (err.fieldErrors.email?.[0] ?? err.message) : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
          <DialogDescription>They&apos;ll get an email with a link that works only for that address.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email address</Label>
            <Input id="invite-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as OrgRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ORG_ROLE_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-[#93C01F] text-white hover:bg-[#82ab1b]" disabled={busy || !email.trim()} onClick={() => void submit()}>
            {busy ? "Sending…" : "Send invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TransferDialog({
  open,
  onOpenChange,
  owners,
  onTransfer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: OrganizationMember[];
  onTransfer: (userId: number, password: string) => Promise<void>;
}) {
  const [userId, setUserId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onTransfer(Number(userId), password);
      setPassword("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof OrganizationApiError ? (err.fieldErrors.password?.[0] ?? err.message) : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer primary ownership</DialogTitle>
          <DialogDescription>
            Choose an existing Owner. You stay an Owner. Make someone an Owner first if they aren&apos;t one yet.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {owners.length === 0 ? (
            <p className="text-sm text-gray-600">There is no other Owner yet.</p>
          ) : (
            <>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an Owner" />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((owner) => (
                    <SelectItem key={owner.user_id} value={String(owner.user_id)}>
                      {owner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-1.5">
                <Label htmlFor="transfer-password">Confirm your password</Label>
                <Input id="transfer-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
            </>
          )}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={busy || !userId || !password} onClick={() => void submit()}>
            {busy ? "Transferring…" : "Transfer ownership"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
