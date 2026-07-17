/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  FileText,
  Mail,
  Upload,
  CheckCircle2,
  ArrowRight,
  X,
  MapPin,
  Shield,
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ClaimEligibility, initiateEmailClaim, submitDocumentClaim } from "@/lib/api";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const getImageUrl = (imageEntry: any): string => {
  if (!imageEntry) return "/images/no-image.jpg";
  let url = "";
  if (typeof imageEntry === "object" && imageEntry !== null && "original" in imageEntry) {
    url = imageEntry.original;
  } else if (typeof imageEntry === "string") {
    url = imageEntry;
  }
  if (!url) return "/images/no-image.jpg";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
  return `${API_URL}/${url.replace(/^\//, "")}`;
};

export default function ClaimSubmission({
  business,
  eligibility,
  listingSlug,
  onNext,
}: {
  business: any;
  eligibility: ClaimEligibility;
  listingSlug: string;
  onNext: (view: "otp" | "success") => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const availableMethods = eligibility.available_methods;
  const [method, setMethod] = useState<"document" | "email">(
    availableMethods.includes("document") ? "document" : "email",
  );
  const [files, setFiles] = useState<File[]>([]);
  const [role, setRole] = useState("Owner");
  const [notes, setNotes] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRectification = eligibility.claim_type === "rectification";

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const combined = [...files, ...selected].slice(0, MAX_FILES);
    const rejected = [...files, ...selected].length > MAX_FILES;

    for (const file of combined) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large. Max 5MB per file.`);
        return;
      }
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name} must be a PDF, JPEG, PNG, or WebP file.`);
        return;
      }
    }

    if (rejected) {
      toast.error(`You can attach up to ${MAX_FILES} files.`);
    }

    setFiles(combined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("authToken") || undefined;

    if (method === "document" && files.length === 0) {
      toast.error("Please upload at least one document to proceed.");
      return;
    }

    setIsLoading(true);
    try {
      if (method === "email") {
        await initiateEmailClaim(listingSlug, token);
        toast.success("Verification code sent!");
        onNext("otp");
      } else {
        await submitDocumentClaim(listingSlug, files, token);
        toast.success("Evidence submitted for review.");
        onNext("success");
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const heroImage = getImageUrl(business?.image || business?.images?.[0]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      {/* Business banner */}
      <div className="relative rounded-2xl overflow-hidden mb-8 h-[120px] bg-[#1F3A4C] shadow-lg">
        <Image
          src={heroImage}
          alt={business?.name || "Business"}
          fill
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-linear-to-r from-[#1F3A4C] via-[#1F3A4C]/90 to-[#1F3A4C]/50" />
        <div className="absolute inset-0 px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#93C01F] uppercase tracking-widest font-bold mb-1">
              {isRectification ? "Requesting an ownership review" : "Claiming this listing"}
            </p>
            <h3 className="text-white font-bold text-lg leading-snug truncate">
              {business?.name}
            </h3>
            {business?.address && (
              <p className="text-gray-300 text-xs flex items-center gap-1 mt-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                {business.address}
              </p>
            )}
          </div>
          <div className="w-[72px] h-[72px] rounded-xl overflow-hidden relative shrink-0 ring-2 ring-white/20 shadow-xl">
            <Image src={heroImage} alt={business?.name || ""} fill className="object-cover" />
          </div>
        </div>
      </div>

      {isRectification && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            This listing already has a manager. Submitting document evidence opens an
            ownership review — the current manager keeps access while our team compares
            evidence, and nothing changes unless an admin approves the transfer.
          </span>
        </div>
      )}

      <div className="space-y-8">
        {!isRectification && (
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#93C01F]/10 text-[#1F3A4C] text-xs font-bold shrink-0">
                1
              </span>
              <h4 className="font-bold text-[#1F3A4C] text-sm">Your relationship to this listing</h4>
            </div>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full h-11 bg-white border border-gray-200 rounded-xl px-4 text-sm font-medium shadow-none focus:ring-[#93C01F]">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Owner">Owner</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Employee">Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {!isRectification && availableMethods.length > 1 && (
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#93C01F]/10 text-[#1F3A4C] text-xs font-bold shrink-0">
                2
              </span>
              <h4 className="font-bold text-[#1F3A4C] text-sm">How would you like to verify?</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {availableMethods.map((m) => {
                const active = method === m;
                return (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={cn(
                      "flex flex-col items-start gap-2.5 p-4 rounded-xl border-2 text-left transition-all",
                      active
                        ? "border-[#93C01F] bg-[#93C01F]/5"
                        : "border-gray-200 bg-white hover:border-gray-300",
                    )}
                  >
                    <div className={cn("p-2 rounded-lg", active ? "bg-[#93C01F]/15" : "bg-gray-100")}>
                      {m === "document" ? (
                        <FileText className={cn("w-4 h-4", active ? "text-[#93C01F]" : "text-gray-500")} />
                      ) : (
                        <Mail className={cn("w-4 h-4", active ? "text-[#93C01F]" : "text-gray-500")} />
                      )}
                    </div>
                    <div>
                      <p className={cn("text-sm font-bold leading-tight", active ? "text-[#1F3A4C]" : "text-gray-700")}>
                        {m === "document" ? "Document" : "Email"}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                        {m === "document" ? "Upload proof of ownership" : "Verify via business email"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#93C01F]/10 text-[#1F3A4C] text-xs font-bold shrink-0">
              {isRectification ? 1 : 3}
            </span>
            <h4 className="font-bold text-[#1F3A4C] text-sm">
              {method === "document" ? "Upload your documents" : "Verify your business email"}
            </h4>
          </div>

          {method === "document" ? (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                multiple
              />
              <div
                onClick={files.length < MAX_FILES ? handleUploadClick : undefined}
                className={cn(
                  "border-2 border-dashed border-gray-200 rounded-xl bg-white p-6 flex flex-col items-center justify-center text-center transition-all group mb-3",
                  files.length < MAX_FILES && "cursor-pointer hover:border-[#93C01F]/50 hover:bg-[#93C01F]/3",
                )}
              >
                <div className="w-12 h-12 rounded-full bg-gray-50 shadow-sm border border-gray-100 flex items-center justify-center mb-3 group-hover:border-[#93C01F]/30 transition-colors">
                  <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#93C01F] transition-colors" />
                </div>
                <p className="text-sm font-bold text-gray-800">Tap to upload</p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF, JPG, PNG or WebP — max 5MB each, up to {MAX_FILES} files
                </p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, i) => (
                    <div
                      key={`${file.name}-${i}`}
                      className="flex items-center justify-between bg-[#93C01F]/5 border border-[#93C01F]/25 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CheckCircle2 className="w-5 h-5 text-[#93C01F] shrink-0" />
                        <p className="text-sm font-semibold text-[#1F3A4C] truncate">{file.name}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(i)}
                        className="text-gray-400 hover:text-red-500 transition-colors ml-3 shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-gray-400 mt-2 flex items-start gap-1.5">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                A business registration document is the strongest evidence, but other
                reasonable ownership evidence is accepted.
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <div className="h-11 flex items-center px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-[#1F3A4C]">
                {eligibility.masked_email || "Listing email on file"}
              </div>
              <p className="text-[11px] text-gray-400 flex items-start gap-1.5">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                We&apos;ll send a 6-digit code to this address. If you don&apos;t have
                access to it, use the document method instead.
              </p>
            </div>
          )}
        </div>

        {!isRectification && (
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400 text-xs font-bold shrink-0">
                4
              </span>
              <h4 className="font-bold text-gray-500 text-sm">
                Additional notes{" "}
                <span className="font-normal text-gray-400 text-xs">(optional)</span>
              </h4>
            </div>
            <Textarea
              placeholder="Anything else you'd like to share about your connection to this listing…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[88px] rounded-xl p-4 text-sm focus-visible:ring-[#93C01F] resize-none border-gray-200 placeholder:text-gray-300"
            />
          </div>
        )}
      </div>

      {/* Sticky footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto space-y-2.5">
          <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1.5">
            <Shield className="w-3 h-3 shrink-0" />
            Every case is reviewed by our team — verifying access doesn&apos;t transfer
            management on its own.
          </p>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-[#93C01F] hover:bg-[#7ea919] text-white h-12 text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-[#93C01F]/20 active:scale-[0.98] transition-transform"
          >
            {isLoading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>
                {method === "email" ? "Send Verification Code" : "Submit Claim"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
