"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X, ExternalLink, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import {
  ClaimCaseSummary,
  ClaimStatus,
  addClaimEvidence,
  getMyClaims,
  withdrawClaim,
} from "@/lib/api";

const STATUS_LABEL: Record<ClaimStatus, string> = {
  awaiting_email_verification: "Awaiting email verification",
  under_review: "Under review",
  more_evidence_requested: "Action needed",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  closed_other_claim_approved: "Closed",
  expired: "Expired",
};

const STATUS_COLOR: Record<ClaimStatus, string> = {
  awaiting_email_verification: "bg-blue-100 text-blue-700",
  under_review: "bg-amber-100 text-amber-700",
  more_evidence_requested: "bg-orange-100 text-orange-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  withdrawn: "bg-gray-100 text-gray-600",
  closed_other_claim_approved: "bg-gray-100 text-gray-600",
  expired: "bg-gray-100 text-gray-600",
};

const listingPath: Record<string, string> = {
  event: "events",
  community: "communities",
  business: "businesses",
};

function ClaimCard({ claim, onChanged }: { claim: ClaimCaseSummary; onChanged: () => void }) {
  const [isBusy, setIsBusy] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const token = () => localStorage.getItem("authToken") || undefined;

  const handleWithdraw = async () => {
    setIsBusy(true);
    try {
      await withdrawClaim(claim.id, token());
      toast.success("Claim withdrawn.");
      setIsWithdrawDialogOpen(false);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to withdraw claim.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).slice(0, 5);
    setPendingFiles(selected);
  };

  const handleSubmitEvidence = async () => {
    if (pendingFiles.length === 0) {
      toast.error("Select at least one file first.");
      return;
    }
    setIsBusy(true);
    try {
      await addClaimEvidence(claim.id, pendingFiles, token());
      toast.success("Evidence submitted.");
      setPendingFiles([]);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit evidence.");
    } finally {
      setIsBusy(false);
    }
  };

  const listingHref = `/${listingPath[claim.listing.type] ?? "businesses"}/${claim.listing.slug}`;

  return (
    <div className="border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="p-5 flex gap-4">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
          <Image
            src={claim.listing.image || "/images/no-image.jpg"}
            alt={claim.listing.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-[#1F3A4C] truncate">{claim.listing.name}</h3>
              <p className="text-xs text-gray-400 capitalize">
                {claim.case_type === "rectification" ? "Ownership review" : "Claim"} · {claim.method.replace(/_/g, " ")}
              </p>
            </div>
            <Badge className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase shrink-0 ${STATUS_COLOR[claim.status]}`}>
              {STATUS_LABEL[claim.status]}
            </Badge>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Submitted {new Date(claim.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {claim.status === "more_evidence_requested" && claim.evidence_instructions && (
        <div className="mx-5 mb-4 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{claim.evidence_instructions}</span>
        </div>
      )}

      {claim.status === "rejected" && claim.rejection_reason && (
        <div className="mx-5 mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 space-y-1">
          <p><span className="font-bold">Reason:</span> {claim.rejection_reason}</p>
          {claim.rejection_recommendation && (
            <p><span className="font-bold">Recommendation:</span> {claim.rejection_recommendation}</p>
          )}
        </div>
      )}

      {claim.available_actions.includes("respond_evidence") && (
        <div className="mx-5 mb-4 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" /> Choose files
            </Button>
            {pendingFiles.map((f, i) => (
              <span key={i} className="text-[11px] bg-gray-100 rounded-full px-2.5 py-1 flex items-center gap-1">
                {f.name}
                <button onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <Button
            size="sm"
            disabled={isBusy || pendingFiles.length === 0}
            onClick={handleSubmitEvidence}
            className="bg-[#93C01F] hover:bg-[#7ea919] text-white text-xs"
          >
            Submit evidence
          </Button>
        </div>
      )}

      <div className="px-5 pb-5 flex flex-wrap items-center gap-2">
        <Link href={listingHref} className="text-xs font-bold text-gray-500 hover:text-[#1F3A4C] flex items-center gap-1">
          View listing <ExternalLink className="w-3 h-3" />
        </Link>

        {claim.available_actions.includes("verify_email") && (
          <Link
            href={`/claim/${claim.listing.slug}/verify`}
            className="text-xs font-bold text-[#93C01F] hover:underline"
          >
            Continue email verification
          </Link>
        )}

        {claim.available_actions.includes("resubmit") && (
          <Link
            href={`/claim/${claim.listing.slug}`}
            className="text-xs font-bold text-[#93C01F] hover:underline"
          >
            Submit a new claim
          </Link>
        )}

        {claim.available_actions.includes("withdraw") && (
          <Button
            size="sm"
            variant="ghost"
            disabled={isBusy}
            onClick={() => setIsWithdrawDialogOpen(true)}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 ml-auto"
          >
            Withdraw claim
          </Button>
        )}
      </div>
      <AlertDialog
        open={isWithdrawDialogOpen}
        onOpenChange={(open) => {
          if (!isBusy) setIsWithdrawDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw this claim?</AlertDialogTitle>
            <AlertDialogDescription>
              Your claim for <span className="font-semibold text-gray-700">{claim.listing.name}</span> will be
              closed and cannot be reopened. You can submit a new claim later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>Keep claim</AlertDialogCancel>
            <AlertDialogAction
              disabled={isBusy}
              onClick={(event) => {
                event.preventDefault();
                void handleWithdraw();
              }}
              className="bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600"
            >
              {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isBusy ? "Withdrawing..." : "Withdraw claim"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function MyClaimsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [claims, setClaims] = useState<ClaimCaseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("authToken") || undefined;
      const data = await getMyClaims(token);
      setClaims((data as unknown as { data: ClaimCaseSummary[] }).data || []);
    } catch {
      toast.error("Failed to load your claims.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchClaims();
  }, [user, fetchClaims]);

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1F3A4C]">My Claims</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track the listings you&apos;ve claimed or challenged. Reviews typically take
            3–5 business days (time spent waiting on requested evidence doesn&apos;t count).
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#93C01F]" />
            <p className="text-sm text-gray-400">Loading your claims...</p>
          </div>
        ) : claims.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
            <p className="text-gray-400 text-sm mb-4">You haven&apos;t submitted any claims yet.</p>
            <Link href="/claim">
              <Button className="bg-[#93C01F] hover:bg-[#7ea919] text-white">Browse claimable listings</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <ClaimCard key={claim.id} claim={claim} onChanged={fetchClaims} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
