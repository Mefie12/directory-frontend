"use client";

import { forwardRef, useImperativeHandle, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Facebook, Instagram, Linkedin, Twitter, Globe } from "lucide-react";
import { toast } from "sonner";
import { ListingFormHandle } from "@/app/dashboard/vendor/my-listing/create/new-listing-content";

/* ---------------------------------------------------
   SCHEMA
--------------------------------------------------- */
export const socialMediaSchema = z.object({
  facebook: z.string().url("Invalid Facebook URL").optional().or(z.literal("")),
  instagram: z
    .string()
    .url("Invalid Instagram URL")
    .optional()
    .or(z.literal("")),
  twitter: z.string().url("Invalid Twitter URL").optional().or(z.literal("")),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  tiktok: z.string().url("Invalid tiktok URL").optional().or(z.literal("")),
});

export type SocialMediaFormValues = z.infer<typeof socialMediaSchema>;

type Props = {
  listingSlug: string;
  listingType: "business" | "event" | "community";
  onSuccess?: () => void;
  initialData?: SocialMediaFormValues;
};

const socialPlatforms = [
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    placeholder: "https://facebook.com/yourpage",
    color: "text-blue-600",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    placeholder: "https://instagram.com/yourprofile",
    color: "text-pink-600",
  },
  {
    id: "twitter",
    name: "Twitter",
    icon: Twitter,
    placeholder: "https://twitter.com/yourhandle",
    color: "text-blue-400",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    placeholder: "https://linkedin.com/company/yourcompany",
    color: "text-blue-700",
  },
  {
    id: "tiktok",
    name: "Tiktok",
    icon: Globe,
    placeholder: "https://tiktok.com/@yourprofile",
    color: "text-black",
  },
];

/* ---------------------------------------------------
   COMPONENT
--------------------------------------------------- */
export const SocialMediaForm = forwardRef<ListingFormHandle, Props>(
  function SocialMediaFormComponent(
    { listingSlug, listingType, onSuccess },
    ref,
  ) {
    const {
      register,
      handleSubmit,
      formState: { errors },
      watch,
      trigger,
      getValues,
      reset,
    } = useForm<SocialMediaFormValues>({
      resolver: zodResolver(socialMediaSchema),
      defaultValues: {
        facebook: "",
        instagram: "",
        twitter: "",
        linkedin: "",
        tiktok: "",
      },
    });

    const watchedValues = watch();

    // --- 1. Fetch existing socials on mount to show filled items ---
    useEffect(() => {
      const loadSocials = async () => {
        if (!listingSlug) return;
        try {
          const token = localStorage.getItem("authToken");
          const API_URL =
            process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
          const res = await fetch(
            `${API_URL}/api/listing/${listingSlug}/show`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            },
          );

          if (res.ok) {
            const json = await res.json();
            // Map the API data back to the form structure
            const s = json.data.social_media || {};
            reset({
              facebook: s.facebook || "",
              instagram: s.instagram || "",
              twitter: s.twitter || "",
              linkedin: s.linkedin || "",
              tiktok: s.tiktok || "",
            });
          }
        } catch (err) {
          console.error(
            "Failed to load social links for back navigation:",
            err,
          );
        }
      };
      loadSocials();
    }, [listingSlug, reset]);

    // --- 2. Save logic using PATCH and /update ---
    const handleFormSubmit = async (data: SocialMediaFormValues) => {
      try {
        if (!listingSlug) throw new Error("Listing ID is missing.");

        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("Authentication required");

        // Filter out empty values for the payload
        const socialData = Object.fromEntries(
          Object.entries(data).filter(
            ([, value]) => value && value.trim() !== "",
          ),
        );

        // If no social media links provided, we still proceed to next step
        if (Object.keys(socialData).length === 0) return true;

        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

        // UPDATED: Use the /update endpoint with PATCH method
        const endpoint = `${API_URL}/api/listing/${listingSlug}/update`;

        const response = await fetch(endpoint, {
          method: "PATCH", // Changed from POST to PATCH
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ social_media: socialData }), // Wrap in social_media key if API expects it
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to save social media links",
          );
        }

        toast.success("Social media links updated successfully");
        if (onSuccess) onSuccess();

        return true;
      } catch (error) {
        console.error("Social media save error:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update social media",
        );
        return false;
      }
    };

    useImperativeHandle(ref, () => ({
      submit: async () => {
        const isValid = await trigger();
        if (!isValid) {
          toast.error("Validation failed. Please check URL formats.");
          return false;
        }
        return await handleFormSubmit(getValues());
      },
    }));

    return (
      <div className="w-full max-w-5xl mx-auto p-0.5 lg:p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-semibold">Social Media & Links</h2>
          <p className="text-sm text-gray-500 mt-1">
            Connect your {listingType} social media profiles
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {socialPlatforms.map((platform) => {
              const Icon = platform.icon;
              const fieldValue =
                watchedValues[platform.id as keyof SocialMediaFormValues];
              const hasValue = fieldValue && fieldValue.trim() !== "";

              return (
                <div key={platform.id} className="space-y-2">
                  <label className="flex items-center gap-2 font-medium text-sm">
                    <Icon className={cn("w-4 h-4", platform.color)} />
                    {platform.name}
                  </label>
                  <div className="relative">
                    <Input
                      {...register(platform.id as keyof SocialMediaFormValues)}
                      type="url"
                      placeholder={platform.placeholder}
                      className={cn(
                        "h-10 rounded-lg border-gray-300 px-4 text-gray-800 focus-visible:ring-2 focus-visible:ring-black",
                        errors[platform.id as keyof SocialMediaFormValues] &&
                          "border-red-500",
                      )}
                    />
                    {hasValue && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-600 text-xs">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Tip:</span> Fields can be left
              empty if you don&apos;t have a presence on that platform.
            </p>
          </div>
        </form>
      </div>
    );
  },
);
