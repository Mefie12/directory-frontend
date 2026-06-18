/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import VerifyOtp from "@/components/verify/verify-otp";
import ClaimSubmission from "@/components/verify/claim-submission";
import ClaimSuccess from "@/components/verify/claim-status";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type View = "submission" | "otp" | "success";

const STEPS = [
  { key: "submission" as View, label: "Submit" },
  { key: "otp" as View, label: "Verify" },
  { key: "success" as View, label: "Done" },
];

export default function VerifyBusinessPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params?.id as string;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>("submission");
  const [businessData, setBusinessData] = useState<any>(null);
  const [claimedEmail, setClaimedEmail] = useState("");

  useEffect(() => {
    const initializePage = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) { router.push("/auth/login"); return; }
      if (!listingId) { toast.error("Invalid listing"); router.push("/claim"); return; }

      try {
        const response = await fetch(`${API_URL}/api/listing/${listingId}/show`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const json = await response.json();
          setBusinessData(json.data || json);
        } else {
          toast.error("Failed to load business details");
        }
      } catch (error) {
        console.error("Initialization error:", error);
        toast.error("Failed to initialize page");
      } finally {
        setIsLoading(false);
      }
    };
    initializePage();
  }, [API_URL, listingId, router]);

  const handleBack = () => {
    if (currentView === "otp") { setCurrentView("submission"); return; }
    router.back();
  };

  const handleSubmissionNext = (email?: string) => {
    if (email) { setClaimedEmail(email); setCurrentView("otp"); }
    else { setCurrentView("success"); }
  };

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentView);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 rounded-full bg-[#93C01F]/10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#93C01F] animate-spin" />
        </div>
        <p className="text-sm text-gray-400 font-medium">Loading details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* Sticky top bar with progress */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          {currentView !== "success" ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Back</span>
            </button>
          ) : (
            <div className="w-10" />
          )}

          {/* Step progress */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((step, i) => {
              const isComplete = i < currentStepIndex;
              const isActive = i === currentStepIndex;
              return (
                <div key={step.key} className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300",
                        isComplete && "bg-[#93C01F] text-white",
                        isActive && "bg-[#1F3A4C] text-white ring-4 ring-[#1F3A4C]/10",
                        !isComplete && !isActive && "bg-gray-100 text-gray-400",
                      )}
                    >
                      {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    <span
                      className={cn(
                        "text-[11px] font-semibold hidden sm:block",
                        isActive ? "text-[#1F3A4C]" : isComplete ? "text-[#93C01F]" : "text-gray-300",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "w-6 h-px transition-colors duration-300",
                        i < currentStepIndex ? "bg-[#93C01F]" : "bg-gray-200",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="w-10" />
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-lg mx-auto px-4 pt-6 pb-10">
        {currentView === "submission" && (
          <ClaimSubmission business={businessData} onNext={handleSubmissionNext} />
        )}
        {currentView === "otp" && (
          <VerifyOtp
            business={businessData}
            claimedEmail={claimedEmail}
            onNext={() => setCurrentView("success")}
          />
        )}
        {currentView === "success" && (
          <ClaimSuccess business={businessData} />
        )}
      </div>
    </div>
  );
}
