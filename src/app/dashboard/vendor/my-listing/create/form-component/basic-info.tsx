"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const businessFormSchema = z.object({
  businessName: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().min(1, "Subcategory is required"),
  description: z.string().min(1, "Description is required"),
});

export type BusinessFormValues = z.infer<typeof businessFormSchema>;

type Props = {
  form: ReturnType<typeof useForm<BusinessFormValues>>;
  listingType: "business" | "event";
};

export function BasicInformationForm({ form, listingType }: Props) {
  const {
    register,
    setValue,
    formState: { errors },
  } = form;

  // Dynamic labels and placeholders based on listing type
  const nameLabel = listingType === "business" ? "Business Name" : "Event Name";
  const descriptionLabel = listingType === "business" ? "Business Description" : "Event Description";
  const namePlaceholder = listingType === "business" ? "Enter business name" : "Enter event name";
  const descriptionPlaceholder = listingType === "business" ? "Short description about your business" : "Short description about your event";

  return (
    <div className="w-full max-w-5xl space-y-6 mx-auto p-6">
      <div>
        <h2 className="text-2xl font-semibold">Basic Information</h2>
        <p className="text-sm text-gray-500 mt-1">
          {listingType === "business" 
            ? "Tell us about your business" 
            : "Tell us about your event"}
        </p>
      </div>

      {/* Business/Event Name */}
      <div className="space-y-1">
        <label className="font-medium text-sm">{nameLabel}</label>
        <Input
          {...register("businessName")}
          placeholder={namePlaceholder}
          className={cn(
            "h-10 rounded-lg border-gray-300 px-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black",
            errors.businessName && "border-red-500 focus-visible:ring-red-500"
          )}
        />
        {errors.businessName && (
          <p className="text-red-500 text-xs mt-1">
            {errors.businessName.message}
          </p>
        )}
      </div>

      {/* Category + Subcategory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="font-medium text-sm">Category</label>

          <Select onValueChange={(v) => setValue("category", v)}>
            <SelectTrigger
              className={cn(
                "h-10 w-full rounded-lg border-gray-300 px-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black",
                errors.category && "border-red-500 focus-visible:ring-red-500"
              )}
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>

            <SelectContent>
              {listingType === "business" ? (
                <>
                  <SelectItem value="food">Food & Dining</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="services">Professional Services</SelectItem>
                  <SelectItem value="health">Health & Wellness</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="music">Music & Concerts</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="arts">Arts & Culture</SelectItem>
                  <SelectItem value="business">Business & Networking</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          {errors.category && (
            <p className="text-red-500 text-xs mt-1">
              {errors.category.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="font-medium text-sm">Subcategory</label>

          <Select onValueChange={(v) => setValue("subcategory", v)}>
            <SelectTrigger
              className={cn(
                "h-10 w-full rounded-lg border-gray-300 px-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black",
                errors.subcategory &&
                  "border-red-500 focus-visible:ring-red-500"
              )}
            >
              <SelectValue placeholder="Select subcategory" />
            </SelectTrigger>

            <SelectContent>
              {listingType === "business" ? (
                <>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="cafe">Cafe</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="clothing-store">Clothing Store</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="concert">Concert</SelectItem>
                  <SelectItem value="festival">Festival</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="exhibition">Exhibition</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          {errors.subcategory && (
            <p className="text-red-500 text-xs mt-1">
              {errors.subcategory.message}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="font-medium text-sm">{descriptionLabel}</label>
        <Textarea
          {...register("description")}
          placeholder={descriptionPlaceholder}
          className={cn(
            "min-h-[140px] rounded-lg border-gray-300 p-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black resize-none",
            errors.description && "border-red-500 focus-visible:ring-red-500"
          )}
        />

        {errors.description && (
          <p className="text-red-500 text-xs mt-1">
            {errors.description.message}
          </p>
        )}
      </div>
    </div>
  );
}