/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import VerifyEmail from "@/components/verify/verify-email";
import VerifyOtp from "@/components/verify/verify-otp";
import ClaimSubmission from "@/components/verify/claim-submission";
import ClaimSuccess from "@/components/verify/claim-success";
import { toast } from "sonner";

export default function VerifyBusinessPage() {
  const router = useRouter();
  const params = useParams();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

  // --- State ---
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [currentView, setCurrentView] = useState(1);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  // Data State
  const [businessData, setBusinessData] = useState<any>(null);
  const [wasAlreadyVerified, setWasAlreadyVerified] = useState(false);

  // --- Fetch Data on Mount ---
  useEffect(() => {
    const initPage = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const businessId = params?.businessId;

        if (!token) {
          router.push("/auth/login");
          return;
        }

        // Parallel Fetch: Get Business Details AND User Status simultaneously
        const [businessRes, userRes] = await Promise.all([
          // 1. Fetch Target Business Details
          fetch(`${API_URL}/api/businesses/${businessId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          // 2. Fetch Current User Status (Using your API docs)
          fetch(`${API_URL}/api/user`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        // --- Handle Business Response ---
        if (businessRes.ok) {
          const bJson = await businessRes.json();
          // Adjust based on if your API returns { data: ... } or just the object
          setBusinessData(bJson.data || bJson);
        } else {
          toast.error("Could not load business details.");
          router.back();
          return;
        }

        // --- Handle User Verification Logic ---
        if (userRes.ok) {
          const uJson = await userRes.json();
          const userData = uJson.data || uJson;

          // CHECK: Is the email_verified_at column not null?
          // If it has a date, they are verified.
          const isVerified = !!userData.email_verified_at;

          if (isVerified) {
            setWasAlreadyVerified(true);
            setCurrentView(3); // SKIP to Claim Submission
          } else {
            setWasAlreadyVerified(false);
            setCurrentView(1); // START at Email Verification
          }
        } else {
          // If user fetch fails, default to unverified for safety
          console.error("Failed to fetch user profile");
          setCurrentView(1);
        }
      } catch (error) {
        console.error("Initialization Error:", error);
        toast.error("An error occurred loading the page.");
      } finally {
        setIsLoadingState(false);
      }
    };

    if (params?.businessId) {
      initPage();
    }
  }, [API_URL, params, router]);

  // --- Navigation Handler ---
  const handleBack = () => {
    // If we auto-skipped verification steps, 'Back' should exit the flow entirely
    if (wasAlreadyVerified && currentView === 3) {
      router.back();
      return;
    }
    // If we are at the start of the manual flow, 'Back' exits the flow
    if (currentView === 1) {
      router.back();
      return;
    }
    // Otherwise go back one internal step
    setCurrentView(currentView - 1);
  };

  const getTitle = () => {
    switch (currentView) {
      case 1:
        return "Verify via Email";
      case 2:
        return "Verification";
      case 3:
        return "Claim Submission";
      default:
        return "";
    }
  };

  // --- Loading State ---
  if (isLoadingState || !businessData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1F3A4C] animate-spin mb-2" />
        <p className="text-sm text-gray-500 font-medium">Loading details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-6 px-4 mt-20">
      {/* Header - Hidden on Success page */}
      {currentView < 4 && (
        <div className="w-full max-w-md flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="p-2 bg-white hover:bg-gray-100 rounded-full cursor-pointer transition-colors border border-gray-100 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-[#93C01F]" />
          </button>
          <h1 className="text-lg font-bold text-[#1F3A4C]">{getTitle()}</h1>
          <div className="w-9" />
        </div>
      )}

      {/* Dynamic View Render */}
      <div className="w-full max-w-md">
        {currentView === 1 && (
          <VerifyEmail
            business={businessData}
            onNext={() => setCurrentView(2)}
          />
        )}

        {currentView === 2 && (
          <VerifyOtp
            business={businessData}
            otp={otp}
            setOtp={setOtp}
            onNext={() => setCurrentView(3)}
          />
        )}

        {currentView === 3 && (
          <ClaimSubmission
            business={businessData}
            onNext={() => setCurrentView(4)}
          />
        )}

        {currentView === 4 && <ClaimSuccess business={businessData} />}
      </div>
    </div>
  );
}
