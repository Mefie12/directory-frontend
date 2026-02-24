"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
// import { toast } from "sonner"; // Unused import removed

import { StepHeader } from "@/components/dashboard/listing/step-header";
import { StepNavigation } from "@/components/dashboard/listing/step-navigation";
import { Button } from "@/components/ui/button";
import { useListing } from "@/context/listing-form-context";

// Child Forms
import { BasicInformationForm } from "./form-component/basic-info";
import { BusinessDetailsForm } from "./form-component/business-details";
import { MediaUploadStep } from "./form-component/media";
import { SocialMediaForm } from "./form-component/social-media";
import { ReviewSubmitStep } from "./form-component/review";

// Define the interface with 'unknown' instead of 'any' for stricter typing
export interface ListingFormHandle {
  submit: () => Promise<unknown | boolean>;
}

export default function ListingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { listingType, currentStep, setCurrentStep, setListingType } =
    useListing();

  const [listingSlug, setListingSlug] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // ONE Ref to control whichever child form is currently active
  const formRef = useRef<ListingFormHandle>(null);

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const type = searchParams.get("type");
    if (type === "business" || type === "event" || type === "community") {
      setListingType(type);
    }

    const slug = searchParams.get("slug");
    if (slug) setListingSlug(slug);
  }, [searchParams, setListingType]);

  const handleNext = async () => {
    if (currentStep === 5) {
      if (formRef.current) {
        setIsSaving(true);
        await formRef.current.submit();
        setIsSaving(false);
        router.push("/dashboard/vendor/my-listing");
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

        // Fixed: Pass the new number value directly instead of a callback function
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error("Step submission failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    // Fixed: Pass value directly
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const renderStep = () => {
    const commonProps = {
      ref: formRef,
      listingType,
      listingSlug,
    };

    switch (currentStep) {
      case 1:
        return <BasicInformationForm {...commonProps} />;
      case 2:
        return <BusinessDetailsForm {...commonProps}  />;
      case 3:
        return <MediaUploadStep {...commonProps} />;
      case 4:
        return <SocialMediaForm {...commonProps} />;
      case 5:
        return <ReviewSubmitStep listingSlug={listingSlug} ref={formRef} />;
      default:
        return null;
    }
  };

  return (
    <>
      <StepHeader
        currentStep={currentStep}
        totalSteps={5}
        title="Create Listing"
        subtitle="Follow the steps to publish"
      />
      <div className="border-b border-gray-100" />

      <div className="grid grid-cols-1 lg:grid-cols-3 md:px-4 lg:px-0">
        <aside className="block shrink-0 border-r border-gray-100 h-auto lg:h-[550px]">
          <div className="sticky top-0 space-y-4 mx-8 py-6">
            <div className="hidden lg:block">
              <StepNavigation
                currentStep={currentStep}
                onStepClick={() => {}}
                listingType={listingType}
              />
            </div>
          </div>
        </aside>

        <div className="w-full col-span-1 lg:col-span-2 px-4 lg:px-0 pb-24">
          {renderStep()}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50 lg:static lg:border-t lg:bg-transparent lg:p-0 lg:mt-10">
        <div className="flex justify-between max-w-5xl mx-auto lg:px-8 lg:py-6">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
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
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : currentStep === 5 ? (
              "Save Listing"
            ) : (
              <>
                Save & Continue <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}