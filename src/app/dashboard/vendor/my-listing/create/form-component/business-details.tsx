"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { MapPin } from "lucide-react"; // Removed unused Loader2
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  BusinessHoursSelector,
  DaySchedule,
} from "@/components/dashboard/listing/business-hours";
import { useListing } from "@/context/listing-form-context";
import { TagInput } from "@/components/dashboard/listing/tag-input";
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
  tags: z.array(z.string()).min(1, "At least one tag is required"),
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
  onBack: () => void;
};

export const BusinessDetailsForm = forwardRef<ListingFormHandle, Props>(
  ({ listingType, listingSlug }, ref) => {
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

    // Removed unused isSaving state since parent handles the loading indicator via ref promise
    const [, setIsSaving] = useState(false);

    const currentHours =
      (watch("businessHours") as unknown as DaySchedule[]) || [];
    const currentTags = watch("tags") || [];

    const text = formTextConfig[listingType];

    // --- SHARED SAVE FUNCTION ---
    const saveDataToApi = async () => {
      const isValid = await trigger();
      if (!isValid) {
        toast.error("Please fix errors in the form");
        return false;
      }

      if (!listingSlug) {
        toast.error("Missing listing identifier. Restart process.");
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
        const locationParts = data.location.split(",");

        // 1. Prepare Address/Details Payload
        const detailsPayload = {
          address: data.address,
          city: locationParts[0]?.trim(),
          country: locationParts[1]?.trim() || "Ghana",
          primary_phone: data.phone,
          email: data.email,
          tags: data.tags,
        };

        // 2. Prepare Hours Payload (Mapping to Backend Format)
        const hoursPayload = {
          opening_hours: data.businessHours.map((h: DaySchedule) => ({
            day_of_week: h.day_of_week,
            open_time: h.startTime,
            close_time: h.endTime,
            is_closed: !h.enabled,
          })),
        };

        // 3. Update Context (Optimistic)
        setBusinessDetails({ ...businessDetails, ...data });

        // 4. EXECUTE REQUESTS (Parallel)
        const detailsReq = fetch(
          `${API_URL}/api/listing/${listingSlug}/address`,
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
          `${API_URL}/api/listing/${listingSlug}/opening_hours`,
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

        if (!detailsRes.ok) throw new Error("Failed to update details");
        if (!hoursRes.ok) throw new Error("Failed to update opening hours");

        return true;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Update failed";
        toast.error(msg);
        return false;
      } finally {
        setIsSaving(false);
      }
    };

    // --- PARENT "NEXT" TRIGGER ---
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
          <div>
            <TagInput
              label="Tags"
              placeholder="Add tags..."
              tags={currentTags}
              onChange={(val) =>
                setValue("tags", val, { shouldValidate: true })
              }
            />
            {errors.tags && (
              <p className="text-red-500 text-xs mt-1">{errors.tags.message}</p>
            )}
          </div>
        </div>
      </div>
    );
  }
);
BusinessDetailsForm.displayName = "BusinessDetailsForm";
