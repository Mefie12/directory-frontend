"use client";

import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  BusinessHoursSelector,
  DaySchedule,
} from "@/components/dashboard/listing/business-hours";
import { useListing } from "@/context/listing-form-context";
import { ListingFormHandle } from "@/app/dashboard/vendor/my-listing/create/new-listing-content";

// --- Schema ---
export const DetailsFormSchema = z.object({
  address: z.string().min(1, "Address is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  google_plus_code: z.string().min(1, "Google Plus Code is required"),
  businessHours: z
    .array(
      z.object({
        day_of_week: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        enabled: z.boolean(),
      })
    )
    .min(1, "Hours are required"),
});

const formTextConfig = {
  business: {
    addressLabel: "Business Address",
    addressPlaceholder: "Enter business address",
    cityLabel: "Business City",
    countryLabel: "Business Country",
    googlePlusCodeLabel: "Google Plus Code",
    subtitle: "Provide the business details below",
  },
  event: {
    addressLabel: "Event Venue Address",
    addressPlaceholder: "Enter event venue address",
    cityLabel: "Event City",
    countryLabel: "Event Country",
    googlePlusCodeLabel: "Google Plus Code",
    subtitle: "Provide the event details below",
  },
  community: {
    addressLabel: "Community Address",
    addressPlaceholder: "Enter community address",
    cityLabel: "Community City",
    countryLabel: "Community Country",
    googlePlusCodeLabel: "Google Plus Code",
    subtitle: "Provide the community details below",
  },
};

export type DetailsFormValues = z.infer<typeof DetailsFormSchema>;

type Props = {
  listingType: "business" | "event" | "community";
  listingSlug: string;
  initialData?: DetailsFormValues;
};

export const BusinessDetailsForm = forwardRef<ListingFormHandle, Props>(
  ({ listingType, listingSlug, initialData }, ref) => {
    const searchParams = useSearchParams();

    const form = useForm<DetailsFormValues>({
      resolver: zodResolver(DetailsFormSchema),
      defaultValues: initialData || {
        address: "",
        country: "",
        city: "",
        google_plus_code: "",
        businessHours: [
          {
            day_of_week: "Monday",
            startTime: "09:00",
            endTime: "17:00",
            enabled: true,
          },
          {
            day_of_week: "Tuesday",
            startTime: "09:00",
            endTime: "17:00",
            enabled: true,
          },
          {
            day_of_week: "Wednesday",
            startTime: "09:00",
            endTime: "17:00",
            enabled: true,
          },
          {
            day_of_week: "Thursday",
            startTime: "09:00",
            endTime: "17:00",
            enabled: true,
          },
          {
            day_of_week: "Friday",
            startTime: "09:00",
            endTime: "17:00",
            enabled: true,
          },
          {
            day_of_week: "Saturday",
            startTime: "09:00",
            endTime: "17:00",
            enabled: false,
          },
          {
            day_of_week: "Sunday",
            startTime: "09:00",
            endTime: "17:00",
            enabled: false,
          },
        ],
      },
    });

    useEffect(() => {
        if (initialData) {
            form.reset(initialData);
        }
    }, [initialData, form]);

    const {
      register,
      setValue,
      watch,
      trigger,
      formState: { errors },
    } = form;
    const { businessDetails, setBusinessDetails } = useListing();

    const [, setIsSaving] = useState(false);

    const currentHours =
      (watch("businessHours") as unknown as DaySchedule[]) || [];

    const text = formTextConfig[listingType];

    // --- SHARED SAVE FUNCTION ---
    const saveDataToApi = async () => {
      const isValid = await trigger();
      if (!isValid) {
        toast.error("Please fix errors in the form");
        return false;
      }

      const effectiveSlug = listingSlug || searchParams.get("slug");

      if (!effectiveSlug) {
        toast.error("Missing listing identifier. Please restart from Step 1.");
        return false;
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Authentication required");
        return false;
      }

      const API_URL = process.env.API_URL || "https://me-fie.co.uk";

      try {
        setIsSaving(true);
        const data = form.getValues();

        // Debug log
        // console.log("Business hours data:", data.businessHours);

        // Payload matches your JSON structure
        const detailsPayload = {
          address: data.address,
          country: data.country,
          city: data.city,
          google_plus_code: data.google_plus_code,
        };

        // Hours payload - ONLY send enabled days with non-null values
        const hoursPayload = data.businessHours
          .filter((h: DaySchedule) => h.enabled)
          .map((h: DaySchedule) => ({
            day_of_week: h.day_of_week,
            open_time: h.startTime,
            close_time: h.endTime,
          }));

        console.log("Hours payload being sent:", hoursPayload);
        console.log("Number of enabled days:", hoursPayload.length);

        // Validate at least one day is enabled
        if (hoursPayload.length === 0) {
          toast.error("Please enable at least one day for business hours");
          return false;
        }

        // Update Context
        setBusinessDetails({ ...businessDetails, ...data });

        // API Calls
        const detailsReq = fetch(
          `${API_URL}/api/listing/${effectiveSlug}/address`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(detailsPayload),
          }
        );

        const hoursReq = fetch(
          `${API_URL}/api/listing/${effectiveSlug}/opening_hours`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(hoursPayload),
          }
        );

        const [detailsRes, hoursRes] = await Promise.all([
          detailsReq,
          hoursReq,
        ]);

        if (!detailsRes.ok) {
          const err = await detailsRes.json();
          console.error("Details API error:", err);
          throw new Error(err.message || "Failed to update details");
        }

        if (!hoursRes.ok) {
          const err = await hoursRes.json();
          console.error("Hours API error:", err);
          console.error("Hours payload that failed:", hoursPayload);
          throw new Error(err.message || "Failed to update opening hours");
        }

        const hoursResult = await hoursRes.json();
        console.log("Hours API success response:", hoursResult);

        toast.success("Business details saved successfully!");
        return true;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Update failed";
        console.error("Save error:", error);
        toast.error(msg);
        return false;
      } finally {
        setIsSaving(false);
      }
    };

    useImperativeHandle(ref, () => ({
      async submit() {
        return await saveDataToApi();
      },
    }));

    return (
      <div className="w-full max-w-5xl space-y-6 mx-auto p-0.5 lg:p-6">
        <div>
          <h2 className="text-2xl font-semibold">Details & Media</h2>
          <p className="text-sm text-gray-500 mt-1">{text.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="font-medium text-sm">{text.addressLabel}</label>
            <div className="relative">
              <Input
                {...register("address")}
                placeholder={text.addressPlaceholder}
                className={cn(errors.address && "border-red-500")}
              />
              <MapPin
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
            </div>
            {errors.address && (
              <p className="text-red-500 text-xs">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="font-medium text-sm">{text.cityLabel}</label>
            <Input
              {...register("city")}
              placeholder="e.g., San Francisco"
              className={cn(errors.city && "border-red-500")}
            />
            {errors.city && (
              <p className="text-red-500 text-xs">{errors.city.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="font-medium text-sm">{text.countryLabel}</label>
            <Input
              {...register("country")}
              placeholder="e.g., United States"
              className={cn(errors.country && "border-red-500")}
            />
            {errors.country && (
              <p className="text-red-500 text-xs">{errors.country.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="font-medium text-sm">
              {text.googlePlusCodeLabel}
            </label>
            <Input
              {...register("google_plus_code")}
              placeholder="e.g., 849VCWC8+R9"
              className={cn(errors.google_plus_code && "border-red-500")}
            />
            {errors.google_plus_code && (
              <p className="text-red-500 text-xs">
                {errors.google_plus_code.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <BusinessHoursSelector
              value={currentHours}
              onChange={(val) =>
                setValue("businessHours", val, { shouldValidate: true })
              }
            />
            {errors.businessHours && (
              <p className="text-red-500 text-xs mt-1">
                {errors.businessHours.message}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
);
BusinessDetailsForm.displayName = "BusinessDetailsForm";
