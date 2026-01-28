/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

import { StepHeader } from "@/components/dashboard/listing/step-header";
import { StepNavigation } from "@/components/dashboard/listing/step-navigation";
import { Button } from "@/components/ui/button";
import { ListingProvider, useListing } from "@/context/listing-form-context";

import { BasicInformationForm } from "./form-component/basic-info";
import { BusinessDetailsForm } from "./form-component/business-details";
import { MediaUploadStep } from "./form-component/media";
import { SocialMediaForm } from "./form-component/social-media";
import { ReviewSubmitStep } from "./form-component/review";
import ClaimSuccess from "@/components/verify/claim-success";
import VerifyOtp from "@/components/verify/verify-otp"; // Import the verification component
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

export interface ListingFormHandle {
  submit: () => Promise<unknown | boolean>;
}

function ManualLisitingForm() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const { listingType, currentStep, setCurrentStep, setListingType } =
    useListing();

  const [listingSlug, setListingSlug] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const initialized = useRef(false);
  const formRef = useRef<ListingFormHandle>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(
        `/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const type = searchParams.get("type");
    if (type === "business" || type === "event" || type === "community")
      setListingType(type);
    const slug = searchParams.get("slug");
    if (slug) setListingSlug(slug);
  }, [searchParams, setListingType]);

  const handleNext = async () => {
    // If we are on the Success page, go to dashboard
    if (currentStep === 7) {
      router.push("/dashboard/vendor/my-listing");
      return;
    }

    // Logic for Publishing (Step 5)
    if (currentStep === 5) {
      if (formRef.current) {
        setIsSaving(true);
        const result = await formRef.current.submit();
        setIsSaving(false);
        if (result) setCurrentStep(6); // Move to Verification Step
      }
      return;
    }

    if (!formRef.current) return;

    setIsSaving(true);
    try {
      const result = await formRef.current.submit();
      if (result) {
        if (
          currentStep === 1 &&
          typeof result === "object" &&
          result !== null &&
          "slug" in result
        ) {
          setListingSlug((result as { slug: string }).slug);
        }
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error("Step submission failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Verification Handlers
  const handleVerifyOtp = async (otpCode: string) => {
    setIsSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
      const token = localStorage.getItem("authToken");

      const res = await fetch(
        `${API_URL}/api/listing/${listingSlug}/verify_listing`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ otp: otpCode }),
        },
      );

      if (!res.ok) throw new Error("Invalid verification code");

      toast.success("Listing verified successfully!");
      setCurrentStep(7); // Move to Success Step
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
      const token = localStorage.getItem("authToken");
      await fetch(`${API_URL}/api/listing/${listingSlug}/resend_otp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Code resent to your email");
    } catch {
      toast.error("Failed to resend code");
    }
  };

  const renderStep = () => {
    const commonProps = { ref: formRef, listingType, listingSlug };

    switch (currentStep) {
      case 1:
        return <BasicInformationForm {...commonProps} />;
      case 2:
        return <BusinessDetailsForm {...commonProps} />;
      case 3:
        return <MediaUploadStep {...commonProps} />;
      case 4:
        return <SocialMediaForm {...commonProps} />;
      case 5:
        return <ReviewSubmitStep listingSlug={listingSlug} ref={formRef} />;
      case 6:
        return (
          <div className="max-w-md mx-auto py-12">
            <VerifyOtp
              email={user?.email || "your email"}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              isLoading={isSaving}
            />
          </div>
        );
      case 7:
        return (
          <ClaimSuccess
            business={{
              name: "Your New Listing",
              address: "Successfully Verified",
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-24 overflow-hidden">
      <StepHeader
        currentStep={currentStep > 5 ? 5 : currentStep} // Keep header at 5 during verification
        totalSteps={5}
        title={currentStep === 6 ? "Verify Ownership" : "Create Listing"}
        subtitle={
          currentStep === 6
            ? "Enter the code sent to your email"
            : "Follow the steps to publish"
        }
      />
      <div className="border-b border-gray-100" />

      <div className="grid grid-cols-1 lg:grid-cols-3 md:px-4 lg:px-0">
        <aside className="block shrink-0 border-r border-gray-100 h-auto lg:h-[550px]">
          <div className="sticky top-0 space-y-4 mx-8 py-6">
            <div className="hidden lg:block">
              <StepNavigation
                currentStep={currentStep > 5 ? 5 : currentStep}
                onStepClick={() => {}}
                listingType={listingType}
              />
            </div>
          </div>
        </aside>

        <div className="w-full col-span-1 lg:col-span-2 px-4 lg:px-0 pb-10">
          {renderStep()}
        </div>
      </div>

      {/* Hide navigation buttons during verification/success unless it's the final 'Go to Dashboard' */}
      {currentStep <= 5 || currentStep === 7 ? (
        <div className="bg-white border-t p-4 lg:static lg:px-8 lg:py-6">
          <div className="flex justify-between mx-auto">
            <div>
              {currentStep > 1 && currentStep <= 5 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={isSaving}
                  className="w-24"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
              )}
            </div>

            <Button
              onClick={handleNext}
              disabled={isSaving}
              className="bg-[#93C01F] hover:bg-[#82ab1b] text-white min-w-[140px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />{" "}
                  Processing...
                </>
              ) : currentStep === 7 ? (
                "Go to Dashboard"
              ) : currentStep === 5 ? (
                "Publish Listing"
              ) : (
                <>
                  Save & Continue <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CreateListingPage() {
  return (
    <ListingProvider>
      <div className="min-h-screen bg-white">
        <Suspense
          fallback={
            <div className="h-[50vh] flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#93C01F]" />
            </div>
          }
        >
          <ManualLisitingForm />
        </Suspense>
      </div>
    </ListingProvider>
  );
}
