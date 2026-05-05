/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SpinnerGap, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { toast } from "sonner";
import dynamic from "next/dynamic";

import { StepHeader } from "@/components/dashboard/listing/step-header";
import { StepNavigation } from "@/components/dashboard/listing/step-navigation";
import { Button } from "@/components/ui/button";
import { useListing } from "@/context/listing-form-context";
import { ListingFormHandle } from "@/components/dashboard/listing/types";
import { useRolePath } from "@/hooks/useRolePath";

// Child Forms
import { BasicInformationForm } from "@/components/dashboard/listing/form/basic-info";
const BusinessDetailsForm = dynamic(
  () => import("@/components/dashboard/listing/form/business-details").then(mod => mod.BusinessDetailsForm),
  { ssr: false }
);
import { MediaUploadStep } from "@/components/dashboard/listing/form/media";
import { SocialMediaForm } from "@/components/dashboard/listing/form/social-media";
import { ReviewSubmitStep } from "@/components/dashboard/listing/form/review";

// --- Local Interfaces to fix 'any' errors ---
interface ApiCategory {
  id: string | number;
  name: string;
}

interface ApiHour {
  day_of_week: string;
  open_time: string;
  close_time: string;
}

interface ApiImage {
  id?: number;
  original: string;
  thumb: string;
  webp: string;
}

const EDIT_STORAGE_KEY = "listing-edit-step";

export default function EditListingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { myListings } = useRolePath();

  const context = useListing();
  const {
    listingType,
    currentStep,
    setCurrentStep,
    setListingType,
    setBasicInfo,
    setBusinessDetails,
    setMedia,
    // Socials (Handle safely if context is old)
    setSocials = (context as any).setSocials || (context as any).setSocialMedia,
  } = context;

  const [listingSlug, setListingSlug] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [stepIsValid, setStepIsValid] = useState(true);

  const formRef = useRef<ListingFormHandle>(null);
  const initialized = useRef(false);
  const [isReady, setIsReady] = useState(false);

  // Persist step — only after init has restored the step
  useEffect(() => {
    if (isReady && listingSlug) {
      sessionStorage.setItem(
        EDIT_STORAGE_KEY,
        JSON.stringify({ currentStep, listingSlug }),
      );
    }
  }, [currentStep, listingSlug, isReady]);

  // --- 1. Initialize & Fetch Data ---
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initPage = async () => {
      const type = searchParams.get("type");
      const slug = searchParams.get("slug");

      if (!slug) {
        toast.error("No listing identifier found");
        router.push(myListings);
        return;
      }

      setListingSlug(slug);

      try {
        const stored = JSON.parse(
          sessionStorage.getItem(EDIT_STORAGE_KEY) || "{}",
        );
        if (stored.listingSlug === slug && stored.currentStep > 1) {
          setCurrentStep(stored.currentStep);
        }
      } catch {
        /* ignore */
      }

      if (type === "business" || type === "event" || type === "community") {
        setListingType(type);
      }

      // Fetch Data
      try {
        setIsFetching(true);
        const token = localStorage.getItem("authToken");

        const response = await fetch(`/api/listing/${slug}/show`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to load listing data");

        const json = await response.json();
        const data = json.data || json;

        // --- MAP API DATA TO CONTEXT ---

        // Convert ISO country code (e.g., "GH") to dial code (e.g., "+233") for phone input
        const countryCodeToDialCode: Record<string, string> = {
          GH: "+233",
          NG: "+234",
          KE: "+254",
          US: "+1",
          UK: "+44",
        };

        const getDialCode = (isoCode: string | null) => {
          if (!isoCode) return "+233";
          return countryCodeToDialCode[isoCode] || `+${isoCode}`;
        };

        setBasicInfo({
          name: data.name,
          category_ids: data.categories?.map((c: ApiCategory) => String(c.id)) || [],
          description: data.bio || data.description,
          type: data.type,
          primary_phone: data.primary_phone || "",
          primary_country_code: getDialCode(data.primary_country_code),
          secondary_phone: data.secondary_phone || "",
          secondary_country_code: data.secondary_phone ? getDialCode(data.secondary_country_code) : "",
          email: data.email,
          website: data.website,
          business_reg_num: data.business_reg_num,
          bio: data.bio,
        } as any);

        // 2. Business Details & Hours
        const mapApiHoursToUi = (apiHours: ApiHour[]) => {
          const days = [
            "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
          ];
          return days.map((day) => {
            const found = apiHours?.find((h) => h.day_of_week === day);
            return {
              day_of_week: day,
              startTime: found?.open_time || "09:00",
              endTime: found?.close_time || "17:00",
              enabled: !!found,
            };
          });
        };

     
        setBusinessDetails({
        // For events, map from event-specific field names, otherwise use standard names
        address: data.type === "event" ? (data.event_venue || data.address || "") : data.address,
        country: data.type === "event" ? (data.event_country || data.country || "") : data.country,
        city: data.type === "event" ? (data.event_city || data.city || "") : data.city,
        google_plus_code: data.google_plus_code,
        businessHours: mapApiHoursToUi(data.opening_hours || []),
        // Event-specific fields (some APIs nest these under data.event)
        event_price: data.event?.event_price ?? data.event_price ?? "",
        event_currency: data.event?.event_currency ?? data.event_currency ?? "",
        event_ticket_url: data.event?.event_ticket_url ?? data.event_ticket_url ?? "",
        event_online_url: data.event?.event_online_url ?? data.event_online_url ?? "",
        event_start_date: data.event?.event_start_date ?? data.event_start_date ?? "",
        event_end_date: data.event?.event_end_date ?? data.event_end_date ?? "",
        event_start_time: data.event?.event_start_time ?? data.event_start_time ?? "",
        event_end_time: data.event?.event_end_time ?? data.event_end_time ?? "",
        event_location: data.event?.event_location_type ?? data.event_location_type ?? data.event_location ?? "",
      } as any);

        // 3. Social Media
        if (data.socials && setSocials) {
          setSocials({
            facebook: data.socials.facebook || "",
            twitter: data.socials.twitter || "",
            instagram: data.socials.instagram || "",
            linkedin: data.socials.linkedin || "",
            tiktok: data.socials.tiktok || "",
            whatsapp: data.socials.whatsapp || "",
          });
        }

        // 4. Media
        if (data.images) {
          const validImages = data.images.filter(
            (img: ApiImage) => !!img.original
          );

          if (validImages.length > 0) {
            const mappedImages = validImages.map((img: ApiImage) => ({
              url: img.original,
              name: img.original.split('/').pop() || 'existing-image',
              id: img.id
            }));
            
            // First image is cover, rest are gallery
            const coverPhoto = mappedImages.length > 0 ? mappedImages[0] : null;
            const galleryImages = mappedImages.slice(1);
            
            (setMedia as any)((prev: any) => ({
              ...prev,
              coverPhoto: coverPhoto,
              images: galleryImages, 
            }));
          }
        }
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Could not load listing details");
      } finally {
        setIsFetching(false);
        setIsReady(true);
      }
    };

    initPage();
  }, [searchParams, router, setListingType, setCurrentStep, setBasicInfo, setBusinessDetails, setMedia, setSocials, myListings]);

  // --- 2. Navigation Handlers ---

  const handleNext = async () => {
    // If on Review Step (Final Step)
    if (currentStep === 5) {
      if (formRef.current) {
        setIsSaving(true);
        try {
          await formRef.current.submit();
          toast.success("Listing published successfully!");
          router.push(myListings);
        } catch (e) {
          console.error(e);
        } finally {
          setIsSaving(false);
        }
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

  const handleBack = () => {
    const prev = Math.max(1, currentStep - 1);
    if (prev > 2) setStepIsValid(true);
    setCurrentStep(prev);
  };

  const handleStepClick = (step: number) => {
    if (step > 2) setStepIsValid(true);
    setCurrentStep(step);
  };

  // --- 3. Render Helpers ---

  const renderStep = () => {
    const commonProps = {
      ref: formRef,
      listingType,
      listingSlug,
    };

    switch (currentStep) {
      case 1:
        return (
          <BasicInformationForm
            {...commonProps}
            onValidityChange={setStepIsValid}
          />
        );
      case 2:
        return (
          <BusinessDetailsForm
            {...commonProps}
            onValidityChange={setStepIsValid}
          />
        );
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

  if (isFetching) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <SpinnerGap className="h-8 w-8 animate-spin text-[#93C01F]" />
          <p className="text-gray-500 text-sm">Loading listing details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <StepHeader
        currentStep={currentStep}
        totalSteps={5}
        title={`Edit ${
          listingType
            ? listingType.charAt(0).toUpperCase() + listingType.slice(1)
            : "Listing"
        }`}
        subtitle="Update your listing information"
      />
      <div className="border-b border-gray-100" />

      <div className="grid grid-cols-1 lg:grid-cols-3 md:px-4 lg:px-0">
        <aside className="block shrink-0 border-r border-gray-100 h-auto lg:h-[550px]">
          <div className="sticky top-0 space-y-4 mx-8 py-6">
            <div className="hidden lg:block">
              <StepNavigation
                currentStep={currentStep}
                onStepClick={handleStepClick}
                listingType={listingType}
              />
            </div>
          </div>
        </aside>

        <div className="w-full col-span-1 lg:col-span-2 px-4 lg:px-0 pb-24 pt-6">
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
                <CaretLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
          </div>

          <Button
            onClick={handleNext}
            disabled={isSaving || (currentStep === 1 && !stepIsValid)}
            className="bg-[#93C01F] hover:bg-[#82ab1b] text-white min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <SpinnerGap className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : currentStep === 5 ? (
              "Update Listing"
            ) : (
              <>
                Save & Continue <CaretRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
