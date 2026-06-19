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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  onNext,
}: {
  business: any;
  onNext: (email?: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [method, setMethod] = useState<"documents" | "email">("documents");
  const [file, setFile] = useState<string | null>(null);
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [role, setRole] = useState("Owner");
  const [businessEmail, setBusinessEmail] = useState("");
  const [notes, setNotes] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File is too large. Max 10MB allowed.");
        return;
      }
      setFile(selectedFile.name);
      setFileObject(selectedFile);
      toast.success("File attached.");
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setFileObject(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    const slug = business.slug || business.id;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
    const token = localStorage.getItem("authToken");

    if (method === "documents" && !fileObject) {
      toast.error("Please upload a document to proceed.");
      return;
    }
    if (method === "email" && !businessEmail) {
      toast.error("Please enter your business email.");
      return;
    }

    setIsLoading(true);
    try {
      if (method === "email") {
        const response = await fetch(`${API_URL}/api/listing/${slug}/claim_by_email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: businessEmail, role }),
        });
        const data = await response.json();
        if (response.ok) {
          toast.success(data.message || "Verification code sent!");
          onNext(businessEmail);
        } else {
          throw new Error(data.message || "Failed to initiate email verification.");
        }
      } else {
        const body = new FormData();
        if (fileObject) body.append("document", fileObject);
        body.append("role", role);
        if (notes) body.append("notes", notes);

        const response = await fetch(`${API_URL}/api/listing/${slug}/claim`, {
          method: "POST",
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          body,
        });
        const data = await response.json();
        if (response.ok) {
          toast.success(data.message || "Evidence submitted for review.");
          onNext();
        } else {
          throw new Error(data.message || "Failed to submit document claim.");
        }
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
              Claiming this listing
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

      <div className="space-y-8">
        {/* Step 1 — Role */}
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

        {/* Step 2 — Verification method */}
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#93C01F]/10 text-[#1F3A4C] text-xs font-bold shrink-0">
              2
            </span>
            <h4 className="font-bold text-[#1F3A4C] text-sm">How would you like to verify?</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(["documents", "email"] as const).map((m) => {
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
                    {m === "documents" ? (
                      <FileText className={cn("w-4 h-4", active ? "text-[#93C01F]" : "text-gray-500")} />
                    ) : (
                      <Mail className={cn("w-4 h-4", active ? "text-[#93C01F]" : "text-gray-500")} />
                    )}
                  </div>
                  <div>
                    <p className={cn("text-sm font-bold leading-tight", active ? "text-[#1F3A4C]" : "text-gray-700")}>
                      {m === "documents" ? "Document" : "Email"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                      {m === "documents" ? "Upload proof of ownership" : "Verify via business email"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3 — Upload / Email */}
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#93C01F]/10 text-[#1F3A4C] text-xs font-bold shrink-0">
              3
            </span>
            <h4 className="font-bold text-[#1F3A4C] text-sm">
              {method === "documents" ? "Upload your document" : "Enter your business email"}
            </h4>
          </div>

          {method === "documents" ? (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
              />
              {!file ? (
                <div
                  onClick={handleUploadClick}
                  className="border-2 border-dashed border-gray-200 rounded-xl bg-white p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#93C01F]/50 hover:bg-[#93C01F]/3 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-50 shadow-sm border border-gray-100 flex items-center justify-center mb-3 group-hover:border-[#93C01F]/30 transition-colors">
                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#93C01F] transition-colors" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">Tap to upload</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG or PNG — max 10 MB</p>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-[#93C01F]/5 border border-[#93C01F]/25 rounded-xl px-4 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <CheckCircle2 className="w-5 h-5 text-[#93C01F] shrink-0" />
                    <p className="text-sm font-semibold text-[#1F3A4C] truncate">{file}</p>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-3 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-2 flex items-start gap-1.5">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                Accepted: business registration, utility bill, or official government document
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="e.g. owner@yourbusiness.com"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                className="h-11 border-gray-200 rounded-xl focus-visible:ring-[#93C01F] text-sm"
              />
              <p className="text-[11px] text-gray-400 flex items-start gap-1.5">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                We&apos;ll send a 6-digit code to verify you control this address.
              </p>
            </div>
          )}
        </div>

        {/* Step 4 — Notes (optional) */}
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
      </div>

      {/* Sticky footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto space-y-2.5">
          <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1.5">
            <Shield className="w-3 h-3 shrink-0" />
            Your information is reviewed by our team and kept confidential.
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
