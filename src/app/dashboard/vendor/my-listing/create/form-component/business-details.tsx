"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";
import { BusinessHoursSelector } from "@/components/dashboard/listing/business-hours";
import { useListing } from "@/context/listing-form-context";
import { TagInput } from "@/components/dashboard/listing/tag-input";

/* ---------------------------------------------------
   SCHEMA
--------------------------------------------------- */
export const DetailsFormSchema = z.object({
  address: z.string().min(1, "Address is required"),
  location: z.string().min(1, "Location is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  businessHours: z.string().min(1, "Hours are required"),
  tags: z.string().min(1, "At least one tag is required"),
});

/* ---------------------------------------------------
   TYPES
--------------------------------------------------- */
export type DetailsFormValues = z.infer<typeof DetailsFormSchema>;

type Props = {
  form: ReturnType<typeof useForm<DetailsFormValues>>;
  listingType: "business" | "event";
};

/* ---------------------------------------------------
   COMPONENT
--------------------------------------------------- */
export function BusinessDetailsForm({ form, listingType }: Props) {
  const {
    register,
    formState: { errors },
  } = form;

  const { businessDetails, setBusinessDetails } = useListing();

  // Dynamic labels and placeholders based on listing type
  const addressLabel =
    listingType === "business" ? "Business Address" : "Event Venue Address";
  const addressPlaceholder =
    listingType === "business"
      ? "Enter business address"
      : "Enter event venue address";
  const emailLabel =
    listingType === "business" ? "Business Email" : "Event Contact Email";
  const phoneLabel =
    listingType === "business" ? "Business Phone" : "Event Contact Phone";
  const subtitle =
    listingType === "business"
      ? "Provide the business details below"
      : "Provide the event details below";

  return (
    <div className="w-full max-w-5xl space-y-6 mx-auto p-6">
      <div>
        <h2 className="text-2xl font-semibold">Details & Media</h2>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>

      {/* Address */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="font-medium text-sm">{addressLabel}</label>

          <div className="relative">
            <Input
              {...register("address")}
              placeholder={addressPlaceholder}
              className={cn(
                "h-10 rounded-lg border-gray-300 px-4 pr-10 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black",
                errors.address && "border-red-500 focus-visible:ring-red-500"
              )}
            />

            <MapPin
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
          </div>

          {errors.address && (
            <p className="text-red-500 text-xs mt-1">
              {errors.address.message}
            </p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-1">
          <label className="font-medium text-sm">Location</label>
          <Input
            {...register("location")}
            placeholder="City, Region"
            className={cn(
              "h-10 rounded-lg border-gray-300 px-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black",
              errors.location && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.location && (
            <p className="text-red-500 text-xs mt-1">
              {errors.location.message}
            </p>
          )}
        </div>
      </div>

      {/* Email + Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email */}
        <div className="space-y-1">
          <label className="font-medium text-sm">{emailLabel}</label>
          <Input
            {...register("email")}
            type="email"
            placeholder="example@domain.com"
            className={cn(
              "h-10 rounded-lg border-gray-300 px-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black",
              errors.email && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="font-medium text-sm">{phoneLabel}</label>
          <Input
            {...register("phone")}
            placeholder="+233 000 000 0000"
            className={cn(
              "h-10 rounded-lg border-gray-300 px-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black",
              errors.phone && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Business Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BusinessHoursSelector
          label={
            listingType === "business" ? "Business Hours" : "Event Date & Time"
          }
          value={businessDetails.businessHours}
          onChange={(hours) =>
            setBusinessDetails({ ...businessDetails, businessHours: hours })
          }
        />

        {/* Tags */}
        <TagInput
          label="Tags"
          placeholder={
            listingType === "business" ? "Add business tags" : "Add event tags"
          }
          tags={businessDetails.tags}
          onChange={(tags) => setBusinessDetails({ ...businessDetails, tags })}
        />
      </div>
    </div>
  );
}
