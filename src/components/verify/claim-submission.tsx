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
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ClaimSubmission({ business, onNext }: any) {
  const [isLoading, setIsLoading] = useState(false);
  const [method, setMethod] = useState<"documents" | "email">("documents");
  const [file, setFile] = useState<string | null>(null);
  const [role, setRole] = useState("Owner");

  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Basic validation (example: max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File is too large. Max 10MB allowed.");
        return;
      }
      setFile(selectedFile.name);
      toast.success("File uploaded successfully");
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering upload click if nested
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    if (!file && method === "documents") {
      toast.error("Please upload a document to proceed.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onNext();
    }, 1500);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Target Listing Card */}
      <div className="bg-[#1F3A4C] rounded-xl p-4 mb-8 flex items-center justify-between shadow-lg">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
            Target Listing
          </p>
          <h3 className="text-white font-bold text-lg">{business.name}</h3>
          <p className="text-gray-400 text-xs mt-1">{business.address}</p>
        </div>
        <div className="w-16 h-12 bg-gray-700 rounded-md overflow-hidden relative border border-gray-600">
          <Image
            src={business.image}
            alt="Business"
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* 01 Role Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-full bg-[#1F3A4C]/10 text-[#1F3A4C] flex items-center justify-center text-xs font-bold">
            01
          </span>
          <h4 className="font-bold text-[#1F3A4C]">
            Your Role at this Business
          </h4>
        </div>
        <div className="relative">
          <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-full h-12 bg-white border border-gray-200 rounded-lg px-4 py-3.5 text-gray-700 font-medium focus:ring-2 focus:ring-[#93C01F] shadow-xs">
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Owner">Owner</SelectItem>
            <SelectItem value="Manager">Manager</SelectItem>
            <SelectItem value="Employee">Employee</SelectItem>
          </SelectContent>
        </Select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
        </div>
        <p className="text-xs text-gray-500 mt-2 italic">
          Providing an accurate role helps us route your verification faster.
        </p>
      </div>

      {/* 02 Verification Method */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-full bg-[#1F3A4C]/10 text-[#1F3A4C] flex items-center justify-center text-xs font-bold">
            02
          </span>
          <h4 className="font-bold text-[#1F3A4C]">Verification Method</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMethod("documents")}
            className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 transition-all ${
              method === "documents"
                ? "border-[#93C01F] bg-[#93C01F]/5 text-[#93C01F]"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
            }`}
          >
            <FileText className="w-6 h-6" />
            <span className="text-sm font-bold">Documents</span>
          </button>

          <button
            onClick={() => setMethod("email")}
            className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 transition-all ${
              method === "email"
                ? "border-[#93C01F] bg-[#93C01F]/5 text-[#93C01F]"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
            }`}
          >
            <Mail className="w-6 h-6" />
            <span className="text-sm font-bold">Business Email</span>
          </button>
        </div>
      </div>

      {/* 03 Evidence Upload */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-full bg-[#1F3A4C]/10 text-[#1F3A4C] flex items-center justify-center text-xs font-bold">
            03
          </span>
          <h4 className="font-bold text-[#1F3A4C]">Evidence Upload</h4>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
        />

        {/* Upload Area Trigger */}
        {!file && (
          <div
            onClick={handleUploadClick}
            className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 hover:border-[#93C01F]/50 transition-colors mb-3 group"
          >
            <div className="w-12 h-12 bg-[#1F3A4C]/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-[#93C01F]/10 transition-colors">
              <Upload className="w-6 h-6 text-[#1F3A4C] group-hover:text-[#93C01F] transition-colors" />
            </div>
            <p className="text-sm font-bold text-gray-900">
              Tap to upload files
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, JPG, PNG (Max 10MB)
            </p>
          </div>
        )}

        {/* Uploaded File Banner */}
        {file && (
          <div className="bg-[#1F3A4C] rounded-lg p-3 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-white/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#93C01F]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none truncate max-w-[200px]">
                  {file}
                </p>
                <p className="text-[10px] text-[#93C01F] font-bold mt-1">
                  UPLOADED SUCCESSFULLY
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* 04 Notes */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-full bg-[#1F3A4C]/10 text-[#1F3A4C] flex items-center justify-center text-xs font-bold">
            04
          </span>
          <h4 className="font-bold text-[#1F3A4C]">Evidence Notes</h4>
        </div>
        <Textarea
          placeholder="Provide any additional context or details about your evidence..."
          className="w-full h-24 bg-white border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#93C01F] resize-none shadow-none"
        />
        <p className="text-right text-[10px] text-gray-400 mt-1 font-medium">
          0/500 CHARACTERS
        </p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLoading || (!file && method === "documents")}
        className="w-full bg-[#93C01F] hover:bg-[#7ea919] text-white h-12 text-base font-medium rounded-lg flex items-center justify-center gap-2 shadow-xs cursor-pointer"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            Submit Evidence <ArrowRight className="w-5 h-5" />
          </>
        )}
      </Button>
    </div>
  );
}
