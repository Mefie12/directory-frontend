/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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

// --- FIXED DATE/TIME LOGIC ---

/**
 * Robust helper to ensure any time string is converted strictly to HH:mm (24h)
 * Required by backend format H:i
 */
const convertToHHmm = (time: string | undefined | null): string => {
  if (!time) return "09:00";

  const cleaned = time.trim().toUpperCase();

  // Handle HH:mm:ss or HH:mm
  const timeMatch = cleaned.match(/^(\d{1,2}):(\d{2})/);
  if (timeMatch && !cleaned.includes("AM") && !cleaned.includes("PM")) {
    return `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
  }

  // Handle 12-hour format (hh:mm AM/PM)
  const amPmMatch = cleaned.match(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1]);
    const minutes = amPmMatch[2];
    const period = amPmMatch[3];

    if (period === "PM" && hours < 12) hours += 12;
    else if (period === "AM" && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }

  return "09:00"; // Default fallback to prevent 422
};

// --- Updated Schema ---
export const DetailsFormSchema = z.object({
  address: z.string().min(1, "Address is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  google_plus_code: z.string().min(1, "Google Plus Code is required"),
  businessHours: z
    .array(
      z.object({
        day_of_week: z.string(),
        // Schema now validates format after conversion
        startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
          message: "Format must be HH:mm (24h)",
        }),
        endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
          message: "Format must be HH:mm (24h)",
        }),
        enabled: z.boolean(),
      }),
    )
    .min(1, "Hours are required"),
});

// --- END FIXED DATE/TIME LOGIC ---

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
};

export const BusinessDetailsForm = forwardRef<ListingFormHandle, Props>(
  ({ listingType, listingSlug }, ref) => {
    const searchParams = useSearchParams();

    const form = useForm<DetailsFormValues>({
      resolver: zodResolver(DetailsFormSchema),
      defaultValues: {
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

    const {
      register,
      setValue,
      watch,
      trigger,
      reset,
      formState: { errors },
    } = form;
    const { businessDetails, setBusinessDetails } = useListing();

    const [, setIsSaving] = useState(false);

    const currentHours =
      (watch("businessHours") as unknown as DaySchedule[]) || [];
    const text = formTextConfig[listingType];

    useEffect(() => {
      const loadDetails = async () => {
        const effectiveSlug = listingSlug || searchParams.get("slug");
        if (!effectiveSlug) return;

        try {
          const token = localStorage.getItem("authToken");
          const API_URL =
            process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

          const res = await fetch(
            `${API_URL}/api/listing/${effectiveSlug}/show`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            },
          );

          if (res.ok) {
            const json = await res.json();
            const d = json.data;

            // Log this to verify the exact key names the backend is sending
            // console.log("API RAW DATA:", d);

            const mappedHours = form
              .getValues("businessHours")
              .map((defaultDay) => {
                const defaultDayLower = defaultDay.day_of_week.toLowerCase();
                const apiDay = d.opening_hours?.find(
                  (h: any) => h.day_of_week?.toLowerCase() === defaultDayLower,
                );

                return apiDay
                  ? {
                      ...defaultDay,
                      startTime: convertToHHmm(apiDay.open_time),
                      endTime: convertToHHmm(apiDay.close_time),
                      enabled: true,
                    }
                  : { ...defaultDay, enabled: false };
              });

            // FIXED RESET: Mapping keys explicitly
            // Use fallbacks to ensure fields are never 'undefined'
            reset({
              address: d.address || d.location?.address || "",
              city: d.city || d.location?.city || "",
              country: d.country || d.location?.country || "Ghana",
              google_plus_code:
                d.google_plus_code || d.location?.google_plus_code || "",
              businessHours: mappedHours,
            });
          }
        } catch (err) {
          console.error("Failed to load details:", err);
        }
      };
      loadDetails();
    }, [listingSlug, reset, searchParams, form]);

    const saveDataToApi = async () => {
      // Re-format all times to ensure HH:mm before triggering validation
      const currentValues = form.getValues("businessHours");
      const sanitized = currentValues.map((h) => ({
        ...h,
        startTime: convertToHHmm(h.startTime),
        endTime: convertToHHmm(h.endTime),
      }));
      setValue("businessHours", sanitized);

      const isValid = await trigger();
      if (!isValid) {
        if (errors.businessHours) toast.error("Check time formats (HH:mm)");
        return false;
      }

      const effectiveSlug = listingSlug || searchParams.get("slug");
      if (!effectiveSlug) return false;

      const token = localStorage.getItem("authToken");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

      try {
        setIsSaving(true);
        const data = form.getValues();

        const detailsPayload = {
          address: data.address,
          country: data.country,
          city: data.city,
          google_plus_code: data.google_plus_code,
        };

        const enabledHours = data.businessHours
          .filter((h: DaySchedule) => h.enabled)
          .map((h: DaySchedule) => ({
            day_of_week: h.day_of_week,
            open_time: h.startTime, // Already sanitized to HH:mm
            close_time: h.endTime,
          }));

        // Try different payload structures based on backend strictness
        const detailsReq = fetch(
          `${API_URL}/api/listing/${effectiveSlug}/update`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(detailsPayload),
          },
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
            body: JSON.stringify(enabledHours),
          },
        );

        const [detailsRes, hoursRes] = await Promise.all([
          detailsReq,
          hoursReq,
        ]);

        if (!detailsRes.ok || !hoursRes?.ok) {
          const hoursError = !hoursRes.ok ? await hoursRes.json() : null;
          if (hoursError?.errors) {
            Object.entries(hoursError.errors).forEach(
              ([key, val]: [string, any]) => toast.error(`${key}: ${val[0]}`),
            );
          }
          throw new Error("Update failed");
        }

        setBusinessDetails({ ...businessDetails, ...data });
        toast.success("Details saved!");
        return true;
      } catch (error) {
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
              placeholder="e.g., Accra"
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
              placeholder="e.g., Ghana"
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
              onChange={(val) => {
                // Sanitization happens here so Zod stays happy
                const formatted = val.map((d: DaySchedule) => ({
                  ...d,
                  startTime: convertToHHmm(d.startTime),
                  endTime: convertToHHmm(d.endTime),
                }));
                setValue("businessHours", formatted, { shouldValidate: true });
              }}
            />
            {errors.businessHours && (
              <p className="text-red-500 text-xs mt-1">
                Please check time format (HH:mm)
              </p>
            )}
          </div>
        </div>
      </div>
    );
  },
);

BusinessDetailsForm.displayName = "BusinessDetailsForm";
