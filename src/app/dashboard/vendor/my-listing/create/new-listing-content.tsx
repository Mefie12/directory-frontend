"use client";
// import { SidebarChoiceCard } from "@/components/dashboard/listing/sidebar-selector";
import { StepHeader } from "@/components/dashboard/listing/step-header";
import { Button } from "@/components/ui/button";
import { useListing } from "@/context/listing-form-context";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  BasicInformationForm,
  BusinessFormValues,
  businessFormSchema,
} from "./form-component/basic-info";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  BusinessDetailsForm,
  DetailsFormSchema,
  DetailsFormValues,
} from "./form-component/business-details";
import { MediaUploadStep } from "./form-component/media";
import { ReviewSubmitStep } from "./form-component/review";
import { toast } from "sonner";
import { StepNavigation } from "@/components/dashboard/listing/step-navigation";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

// Define proper type for draft data
interface DraftData {
  basicInfo: BusinessFormValues;
  businessDetails: DetailsFormValues;
  currentStep: number;
  savedAt: string;
  status: "draft";
}

export default function ListingContent() {
  const { listingType, currentStep, setCurrentStep, setListingType } = useListing();

  const searchParams = useSearchParams()

  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'business' || type === 'event') {
      setListingType(type)
    }
  }, [searchParams, listingType, setListingType]);

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      businessName: "",
      category: "",
      subcategory: "",
      description: "",
    },
  });

  const detailsForm = useForm<DetailsFormValues>({
    resolver: zodResolver(DetailsFormSchema),
    defaultValues: {
      address: "",
      location: "",
      email: "",
      phone: "",
      businessHours: "",
      tags: "",
    },
  });

  const handleNext = () => {
    if (currentStep === 1) {
      if (
        !form.getValues("businessName") ||
        !form.getValues("category") ||
        !form.getValues("description")
      ) {
        toast.error("Missing information", {
          description: "Please fill out all required fields",
        });
        return;
      }
    } else if (currentStep === 2) {
      if (
        !detailsForm.getValues("address") ||
        !detailsForm.getValues("email")
      ) {
        toast.error("Missing information", {
          description: "Please fill out all required fields",
        });
        return;
      }
    } else if (currentStep === 4) {
      toast.success("Success!", {
        description: "Your listing has been submitted successfully.",
      });
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSaveToDraft = async () => {
    // Validate if we have at least some basic information to save as draft
    if (currentStep === 1 && !form.getValues("businessName")) {
      toast.error("Cannot save draft", {
        description: "Please provide at least a name for your listing",
      });
      return;
    }

    try {
      // Show loading state
      const loadingToast = toast.loading("Saving draft...");

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Prepare draft data with proper typing
      const draftData: DraftData = {
        basicInfo: form.getValues(),
        businessDetails: detailsForm.getValues(),
        currentStep,
        savedAt: new Date().toISOString(),
        status: "draft",
      };

      // Actual API call would look like this:
      /*
      const response = await fetch('/api/listings/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save draft');
      }
      
      const result = await response.json();
      */

      // Simulate successful API response
      const simulatedResponse = {
        id: `draft_${Date.now()}`,
        ...draftData,
        createdAt: new Date().toISOString(),
      };

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Draft saved", {
        description:
          "Your progress has been saved as a draft. You can continue later.",
      });

      // Simulate storing draft ID for future reference
      console.log("Draft saved with ID:", simulatedResponse.id);

      // You might want to store this in state or context
      // setDraftId(simulatedResponse.id);
    } catch (error) {
      // Handle API error
      toast.error("Failed to save draft", {
        description:
          "Please try again. Your progress is still available in this session.",
      });
      console.error("Draft save error:", error);
    }
  };

  const handleSubmit = async () => {
    // Get current form values for validation
    const basicInfo = form.getValues();
    const businessDetails = detailsForm.getValues();

    // Final validation before submission
    if (
      !basicInfo.businessName ||
      !basicInfo.category ||
      !basicInfo.description
    ) {
      toast.error("Missing information", {
        description: "Please complete all required fields in step 1",
      });
      setCurrentStep(1);
      return;
    }

    if (!businessDetails.address || !businessDetails.email) {
      toast.error("Missing information", {
        description: "Please complete all required fields in step 2",
      });
      setCurrentStep(2);
      return;
    }

    try {
      // Show loading state
      const loadingToast = toast.loading("Submitting your listing...");

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Prepare final submission data
      const submissionData = {
        basicInfo,
        businessDetails,
        submittedAt: new Date().toISOString(),
        status: "submitted" as const,
      };

      // Actual API call would look like this:
      /*
      const response = await fetch('/api/listings/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });
      
      if (!response.ok) {
        throw new Error('Submission failed');
      }
      
      const result = await response.json();
      */

      // Simulate successful API response
      const simulatedResponse = {
        id: `listing_${Date.now()}`,
        ...submissionData,
        createdAt: new Date().toISOString(),
        reviewStatus: "pending",
      };

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Success!", {
        description:
          "Your listing has been submitted successfully and is under review.",
      });

      console.log("Listing submitted with ID:", simulatedResponse.id);

      // Reset form or navigate away after successful submission
      // setTimeout(() => {
      //   setCurrentStep(1);
      //   resetForm();
      //   // Or navigate to success page:
      //   // router.push('/success');
      // }, 2000);
    } catch (error) {
      // Handle API error
      toast.error("Submission failed", {
        description: "Please check your connection and try again.",
      });
      console.error("Submission error:", error);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInformationForm form={form} listingType={listingType} />;
      case 2:
        return (
          <BusinessDetailsForm form={detailsForm} listingType={listingType} />
        );
      case 3:
        return <MediaUploadStep listingType={listingType} />;
      case 4:
        return <ReviewSubmitStep />;
      default:
        return <BasicInformationForm form={form} listingType={listingType} />;
    }
  };

  return (
    <>
      <StepHeader
        currentStep={currentStep}
        totalSteps={4}
        title="Adding a new listing"
        subtitle="Create a new listing and manage it"
      />
      <div className="border-b border-gray-100" />

      {/* Mini sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 md:px-4 lg:px-0">
        <aside className="block shrink-0 border-r border-gray-100 h-auto lg:h-[550px]">
          <div className="sticky top-0 space-y-4 mx-8 py-6">
            {/* <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Choose a listing</h2>
              <p className="text-sm text-muted-foreground">
                Choose a listing and fill out the forms
              </p>
            </div>

            <SidebarChoiceCard
              id={1}
              label="Business Listing"
              description="Showcase your business with photos, contact details, and services to reach more customers."
              isSelected={listingType === "business"}
              onClick={() => setListingType("business")}
            />

            <SidebarChoiceCard
              id={2}
              label="Event Listing"
              description="Promote your events with flyers, dates, and ticket links so the right audience can find you."
              isSelected={listingType === "event"}
              onClick={() => setListingType("event")}
            /> */}
            <div className="hidden lg:block">
              <StepNavigation
                currentStep={currentStep}
                onStepClick={setCurrentStep}
                listingType={listingType}
              />
            </div>
          </div>
        </aside>

        {/* Form */}
        <div className="w-full col-span-1 lg:col-span-2 px-4 lg:px-0">
          {" "}
          {renderStep()}
        </div>
      </div>
      <div className="border-b border-gray-100" />

      {/* Buttons */}
      <div className="flex justify-between mt-4 md:px-4">
        <div>
          {currentStep > 1 && (
            <Button
              onClick={handleBack}
              variant="outline"
              className="bg-[#F1F5F9]"
            >
              <span>
                <ChevronLeft />
              </span>
              Back
            </Button>
          )}
        </div>

        <div className="flex gap-2 px-8">
          {currentStep === 4 && (
            <Button
              onClick={handleSaveToDraft}
              variant="outline"
              className="bg-[#EBF8C9] border-[#C0EB66]"
            >
              Save to Draft
            </Button>
          )}

          {currentStep === 4 ? (
            <Button onClick={handleSubmit} className="bg-[#93C01F]">
              Submit{" "}
            </Button>
          ) : (
            <Button onClick={handleNext} className="bg-[#93C01F]">
              Save & Continue{" "}
              <span>
                <ChevronRight />
              </span>
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
