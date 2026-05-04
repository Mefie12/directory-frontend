/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import VerifyOtp from "@/components/verify/verify-otp";
import ClaimSubmission from "@/components/verify/claim-submission";
import ClaimSuccess from "@/components/verify/claim-status";
import { toast } from "sonner";

type View = "submission" | "otp" | "success";

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

      if (!token) {
        router.push("/auth/login");
        return;
      }

      if (!listingId) {
        toast.error("Invalid listing");
        router.push("/claim");
        return;
      }

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
    if (currentView === "otp") {
      setCurrentView("submission");
      return;
    }
    router.back();
  };

  const handleSubmissionNext = (email?: string) => {
    if (email) {
      // Email method: go to OTP screen
      setClaimedEmail(email);
      setCurrentView("otp");
    } else {
      // Document method: go directly to success
      setCurrentView("success");
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case "submission": return "Claim Submission";
      case "otp": return "Verification";
      case "success": return "";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1F3A4C] animate-spin mb-2" />
        <p className="text-sm text-gray-500 font-medium">Loading details...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col items-center py-6 px-4 mt-20">
      {currentView !== "success" && (
        <div className="w-full max-w-md flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="p-2 bg-white hover:bg-gray-100 rounded-full cursor-pointer transition-colors border border-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-[#93C01F]" />
          </button>
          <h1 className="text-lg font-bold text-[#1F3A4C]">{getTitle()}</h1>
          <div className="w-9" />
        </div>
      )}

      <div className="w-full max-w-md">
        {currentView === "submission" && (
          <ClaimSubmission
            business={businessData}
            onNext={handleSubmissionNext}
          />
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
