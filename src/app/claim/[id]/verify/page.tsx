/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import VerifyEmail from "@/components/verify/verify-email";
import VerifyOtp from "@/components/verify/verify-otp";
import ClaimSubmission from "@/components/verify/claim-submission";
import ClaimSuccess from "@/components/verify/claim-status";
import { toast } from "sonner";

export default function VerifyBusinessPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params?.id as string;
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

  // --- State ---
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<1 | 2 | 3 | 4>(1);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [businessData, setBusinessData] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);

  // --- Fetch Data on Mount ---
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
        // Fetch user verification status and business data in parallel
        const [userResponse, businessResponse] = await Promise.all([
          fetch(`${API_URL}/api/user`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/api/listing/${listingId}/show`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        // Handle user verification status
        if (userResponse.ok) {
          const userJson = await userResponse.json();
          const userData = userJson.data || userJson;
          const verified = !!userData.email_verified_at;
          setIsVerified(verified);
          
          // Set view based on verification status
          // Verified users go directly to claim submission (view 3)
          // Unverified users start at email verification (view 1)
          setCurrentView(verified ? 3 : 1);
        } else {
          // Default to email verification if API fails
          setCurrentView(1);
        }

        // Handle business data
        if (businessResponse.ok) {
          const businessJson = await businessResponse.json();
          setBusinessData(businessJson.data || businessJson);
        } else {
          console.error("Failed to fetch business data");
          toast.error("Failed to load business details");
        }
      } catch (error) {
        console.error("Initialization error:", error);
        toast.error("Failed to initialize page");
        setCurrentView(1);
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [API_URL, listingId, router]);

  // --- Navigation Handlers ---
  const handleBack = () => {
    // If at claim submission (view 3) and was verified, exit flow
    if (isVerified && currentView === 3) {
      router.back();
      return;
    }
    // If at start of manual verification flow, exit
    if (currentView === 1) {
      router.back();
      return;
    }
    // Otherwise go back one step
    setCurrentView((prev) => (prev - 1) as 1 | 2 | 3 | 4);
  };

  const getTitle = () => {
    switch (currentView) {
      case 1:
        return "Verify via Email";
      case 2:
        return "Verification";
      case 3:
        return "Claim Submission";
      case 4:
        return "";
      default:
        return "";
    }
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1F3A4C] animate-spin mb-2" />
        <p className="text-sm text-gray-500 font-medium">Loading details...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col items-center  py-6 px-4 mt-20">
      {/* Header - Hidden on Success page (view 4) */}
      {currentView < 4 && (
        <div className="w-full max-w-md flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="p-2 bg-white hover:bg-gray-100 rounded-full cursor-pointer transition-colors border border-gray-100 "
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
