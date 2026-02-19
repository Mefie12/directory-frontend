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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";
import { Input } from "@/components/ui/input"; // Ensure you have this import
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
  const [fileObject, setFileObject] = useState<File | null>(null); // Store the actual File object
  const [role, setRole] = useState("Owner");
  const [businessEmail, setBusinessEmail] = useState(""); // State for email input
  const [notes, setNotes] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File is too large. Max 10MB allowed.");
        return;
      }
      setFile(selectedFile.name);
      setFileObject(selectedFile); // Save the file object for the API
      toast.success("File uploaded successfully");
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setFileObject(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    const slug = business.slug || business.id;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
    const token = localStorage.getItem("authToken");

    // --- Validation ---
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
        // --- API Integration for Email Claim ---
        const response = await fetch(
          `${API_URL}/api/listing/${slug}/claim_by_email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              email: businessEmail,
              role: role,
            }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          toast.success(data.message || "Verification code sent!");
          onNext();
        } else {
          throw new Error(
            data.message || "Failed to initiate email verification.",
          );
        }
      } else {
        // --- API Integration for Document Submission ---
        const url = `${API_URL}/api/listing/${slug}/claim`;

        const body = new FormData();
        if (fileObject) {
          body.append("document", fileObject);
        }
        body.append("role", role);
        if (notes) body.append("notes", notes);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            // Note: Don't set Content-Type for FormData, browser does it automatically with the boundary
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
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
            src={business.image || "/images/placeholders/generic.jpg"}
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
          <h4 className="font-bold text-[#1F3A4C]">Your Role</h4>
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-full h-12 bg-white border border-gray-200 rounded-lg px-4 font-medium shadow-xs">
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Owner">Owner</SelectItem>
            <SelectItem value="Manager">Manager</SelectItem>
            <SelectItem value="Employee">Employee</SelectItem>
          </SelectContent>
        </Select>
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

      {/* 03 Conditional Input Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-full bg-[#1F3A4C]/10 text-[#1F3A4C] flex items-center justify-center text-xs font-bold">
            03
          </span>
          <h4 className="font-bold text-[#1F3A4C]">
            {method === "documents"
              ? "Evidence Upload"
              : "Verify Email Address"}
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
                className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <Upload className="w-6 h-6 text-[#1F3A4C] mb-3" />
                <p className="text-sm font-bold text-gray-900">
                  Tap to upload files
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, JPG, PNG (Max 10MB)
                </p>
              </div>
            ) : (
              <div className="bg-[#1F3A4C] rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#93C01F]" />
                  <p className="text-sm font-bold text-white truncate max-w-[200px]">
                    {file}
                  </p>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="e.g. contact@business.com"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              className="h-12 border-gray-200 focus:ring-[#93C01F] rounded-lg"
            />
            <p className="text-xs text-gray-500 italic">
              We will send a verification code to this address.
            </p>
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
          placeholder="Provide any additional context..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full h-24 rounded-xl p-4 text-sm focus:ring-[#93C01F] resize-none"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full bg-[#93C01F] hover:bg-[#7ea919] text-white h-12 text-base font-medium rounded-lg flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            {method === "email" ? "Send Code & Continue" : "Submit Evidence"}
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </Button>
    </div>
  );
}
