"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation"; // ✅ Import this

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
  location: z.string().min(1, "Location is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
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
  tags: z.array(z.string()).optional(),
});

const formTextConfig = {
  business: {
    addressLabel: "Business Address",
    addressPlaceholder: "Enter business address",
    emailLabel: "Business Email",
    phoneLabel: "Business Phone",
    subtitle: "Provide the business details below",
  },
  event: {
    addressLabel: "Event Venue Address",
    addressPlaceholder: "Enter event venue address",
    emailLabel: "Event Contact Email",
    phoneLabel: "Event Contact Phone",
    subtitle: "Provide the event details below",
  },
  community: {
    addressLabel: "Community Address",
    addressPlaceholder: "Enter community address",
    emailLabel: "Community Contact Email",
    phoneLabel: "Community Contact Phone",
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
    const searchParams = useSearchParams(); // ✅ Initialize params
    
    const form = useForm<DetailsFormValues>({
      resolver: zodResolver(DetailsFormSchema),
      defaultValues: {
        address: "",
        location: "",
        email: "",
        phone: "",
        businessHours: [],
        tags: [],
      },
    });

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

      // ✅ FIX: Check Prop OR URL Param
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

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

      try {
        setIsSaving(true);
        const data = form.getValues();
        const locationParts = data.location.split(",");

        // 1. Address Payload
        const detailsPayload = {
          address: data.address,
          city: locationParts[0]?.trim(),
          country: locationParts[1]?.trim() || "Ghana",
          primary_phone: data.phone,
          email: data.email,
        };

        // 2. Hours Payload
        const hoursPayload = {
          opening_hours: data.businessHours.map((h: DaySchedule) => {
            const isClosed = !h.enabled; 
            return {
              day_of_week: h.day_of_week,
              open_time: isClosed ? null : h.startTime, 
              close_time: isClosed ? null : h.endTime,
            };
          }),
        };

        // 3. Update Context
        setBusinessDetails({ ...businessDetails, ...data });

        // 4. API Calls
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
            throw new Error(err.message || "Failed to update details");
        }
        
        if (!hoursRes.ok) {
             const err = await hoursRes.json();
             throw new Error(err.message || "Failed to update opening hours");
        }

        return true;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Update failed";
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
            <label className="font-medium text-sm">
              Location (City, Country)
            </label>
            <Input
              {...register("location")}
              placeholder="Accra, Ghana"
              className={cn(errors.location && "border-red-500")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="font-medium text-sm">{text.emailLabel}</label>
            <Input
              {...register("email")}
              type="email"
              placeholder="contact@domain.com"
              className={cn(errors.email && "border-red-500")}
            />
          </div>
          <div className="space-y-1">
            <label className="font-medium text-sm">{text.phoneLabel}</label>
            <Input
              {...register("phone")}
              placeholder="+233..."
              className={cn(errors.phone && "border-red-500")}
            />
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