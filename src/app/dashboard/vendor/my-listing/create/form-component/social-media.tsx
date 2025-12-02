"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Globe,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

/* ---------------------------------------------------
   SCHEMA
--------------------------------------------------- */
export const socialMediaSchema = z.object({
  facebook: z.string().url("Invalid Facebook URL").optional().or(z.literal("")),
  instagram: z.string().url("Invalid Instagram URL").optional().or(z.literal("")),
  twitter: z.string().url("Invalid Twitter URL").optional().or(z.literal("")),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
});

export type SocialMediaFormValues = z.infer<typeof socialMediaSchema>;

type Props = {
  listingSlug: string;
  listingType: "business" | "event" | "community";
  onNext: () => void;
  onBack: () => void;
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
    id: "website",
    name: "Website",
    icon: Globe,
    placeholder: "https://yourwebsite.com",
    color: "text-gray-600",
  },
];

/* ---------------------------------------------------
   COMPONENT
--------------------------------------------------- */
export function SocialMediaForm({
  listingSlug,
  listingType,
  onNext,
  onBack,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SocialMediaFormValues>({
    resolver: zodResolver(socialMediaSchema),
    defaultValues: {
      facebook: "",
      instagram: "",
      twitter: "",
      linkedin: "",
      website: "",
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  // Watch all fields to show which ones have values
  const watchedValues = watch();

  const handleFormSubmit = async (data: SocialMediaFormValues) => {
    try {
      setIsSaving(true);

      if (!listingSlug) {
        throw new Error("Listing ID is missing. Please restart the process.");
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication required");
      }

      // Filter out empty values
      const socialData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value && value.trim() !== "")
      );

      // If no social media links provided, just continue
      if (Object.keys(socialData).length === 0) {
        toast.info("No social media links provided", {
          description: "You can add them later",
        });
        onNext();
        return;
      }

      const API_URL = process.env.API_URL || "https://me-fie.co.uk";
      const endpoint = `${API_URL}/api/listing/{listing_slug}/social`; // listingId is the slug

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(socialData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save social media links");
      }

      toast.success("Social media links saved successfully");
      onNext();
    } catch (error) {
      console.error("Social media save error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save social media links"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-0.5 lg:p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Social Media & Links</h2>
        <p className="text-sm text-gray-500 mt-1">
          {listingType === "business"
            ? "Connect your business social media profiles"
            : listingType === "event"
            ? "Connect your event social media profiles"
            : "Connect your community social media profiles"}
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Social Media Platforms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {socialPlatforms.map((platform) => {
            const Icon = platform.icon;
            const fieldValue = watchedValues[platform.id as keyof SocialMediaFormValues];
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
                      "h-10 rounded-lg border-gray-300 px-4 text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-black",
                      errors[platform.id as keyof SocialMediaFormValues] &&
                        "border-red-500 focus-visible:ring-red-500"
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
                {errors[platform.id as keyof SocialMediaFormValues] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[platform.id as keyof SocialMediaFormValues]?.message}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Tip:</span> Adding social media links helps
            customers connect with you on multiple platforms. You can leave fields empty
            if you don&apos;t have a presence on that platform.
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-100 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSaving}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <Button
            type="submit"
            className="bg-[#93C01F] text-white hover:bg-[#82ab1b]"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue to Review
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
