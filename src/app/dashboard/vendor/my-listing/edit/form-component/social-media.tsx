/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Facebook, Instagram, Linkedin, Twitter, Globe, Phone } from "lucide-react";
import { toast } from "sonner";
import { ListingFormHandle } from "@/app/dashboard/vendor/my-listing/create/new-listing-content";

/* --- Helper functions --- */
const isValidUrl = (url: string): boolean => {
  if (!url) return true;
  return /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=@]*)*\/?$/i.test(url);
};

// --- Platform-specific URL validators ---
const isPlatformUrl = (url: string, patterns: RegExp[]): boolean => {
  if (!url) return true;
  const normalized = url.replace(/^(https?:\/\/)?(www\.)?/, "").toLowerCase();
  return patterns.some((p) => p.test(normalized));
};

const platformPatterns: Record<string, { patterns: RegExp[]; hint: string }> = {
  facebook: {
    patterns: [/^facebook\.com\//, /^fb\.com\//],
    hint: "Must be a Facebook URL (e.g. facebook.com/yourpage)",
  },
  instagram: {
    patterns: [/^instagram\.com\//],
    hint: "Must be an Instagram URL (e.g. instagram.com/yourprofile)",
  },
  twitter: {
    patterns: [/^twitter\.com\//, /^x\.com\//],
    hint: "Must be a Twitter/X URL (e.g. twitter.com/handle or x.com/handle)",
  },
  linkedin: {
    patterns: [/^linkedin\.com\//],
    hint: "Must be a LinkedIn URL (e.g. linkedin.com/company/yourcompany)",
  },
  tiktok: {
    patterns: [/^tiktok\.com\//],
    hint: "Must be a TikTok URL (e.g. tiktok.com/@yourprofile)",
  },
};

const validatePlatform = (val: string | undefined, platform: string): boolean => {
  if (!val || !val.trim()) return true;
  if (!isValidUrl(val)) return false;
  const config = platformPatterns[platform];
  if (!config) return true;
  return isPlatformUrl(val, config.patterns);
};

// --- Helper function to validate phone number ---
const isValidPhone = (phone: string): boolean => {
  if (!phone) return true;
  return /^[\d\s\+\-\(\)]{7,20}$/.test(phone);
};

const normalizeUrl = (url: string): string => {
  if (!url) return "";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
};

const normalizeWhatsApp = (phone: string): string => {
  if (!phone) return "";
  if (phone.startsWith("http://") || phone.startsWith("https://")) return phone;
  const digits = phone.replace(/[\s\-\(\)\+]/g, "");
  return `https://wa.me/${digits}`;
};

/* --- SCHEMA --- */
export const socialMediaSchema = z.object({
  facebook: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => validatePlatform(val, "facebook"), {
      message: platformPatterns.facebook.hint,
    }),
  instagram: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => validatePlatform(val, "instagram"), {
      message: platformPatterns.instagram.hint,
    }),
  twitter: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => validatePlatform(val, "twitter"), {
      message: platformPatterns.twitter.hint,
    }),
  linkedin: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => validatePlatform(val, "linkedin"), {
      message: platformPatterns.linkedin.hint,
    }),
  tiktok: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => validatePlatform(val, "tiktok"), {
      message: platformPatterns.tiktok.hint,
    }),
  whatsapp: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => isValidPhone(val || ""), {
      message: "Must be a valid phone number (e.g. +233 50 123 4567)",
    }),
});

export type SocialMediaFormValues = z.infer<typeof socialMediaSchema>;

type Props = {
  listingId: number | string; // ✅ Use ID instead of slug for API
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
    placeholder: "facebook.com/yourpage",
    color: "text-blue-600",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    placeholder: "instagram.com/yourprofile",
    color: "text-pink-600",
  },
  {
    id: "twitter",
    name: "Twitter",
    icon: Twitter,
    placeholder: "twitter.com/yourhandle",
    color: "text-blue-400",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    placeholder: "linkedin.com/company/yourcompany",
    color: "text-blue-700",
  },
  {
    id: "tiktok",
    name: "Tiktok",
    icon: Globe,
    placeholder: "tiktok.com/@yourprofile",
    color: "text-black",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: Phone,
    placeholder: "+233 50 123 4567",
    color: "text-green-600",
    type: "phone",
  },
];

export const SocialMediaForm = forwardRef<ListingFormHandle, Props>(
  function SocialMediaFormComponent(
    { listingId, listingSlug, listingType, onSuccess, initialData },
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
      mode: "onChange",
      defaultValues: initialData || {
        facebook: "",
        instagram: "",
        twitter: "",
        linkedin: "",
        tiktok: "",
        whatsapp: "",
      },
    });

    const [socialRecordId, setSocialRecordId] = useState<number | null>(null);

    useEffect(() => {
      if (initialData) {
        reset(initialData);
      }
    }, [initialData, reset]);

    // Fetch social record ID on mount for PUT requests
    useEffect(() => {
      const fetchSocialId = async () => {
        if (!listingSlug) return;
        const token = localStorage.getItem("authToken");
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
        try {
          const res = await fetch(`${API_URL}/api/listing/${listingSlug}/socials`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          });
          if (res.ok) {
            const json = await res.json();
            const raw = json.data || json;
            const s = Array.isArray(raw) ? raw[0] || {} : raw;
            if (s.id) setSocialRecordId(s.id);
          }
        } catch (err) {
          console.error("Failed to fetch social record ID:", err);
        }
      };
      fetchSocialId();
    }, [listingSlug]);

    const watchedValues = watch();

    const handleFormSubmit = async (data: SocialMediaFormValues) => {
      try {
        // ✅ Check for listingId as the primary identifier
        if (!listingId) {
          throw new Error("Listing ID is missing. Please restart the process.");
        }

        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("Authentication required");
        }

        const normalizedData = Object.fromEntries(
          Object.entries(data)
            .map(([key, value]) => [
              key,
              key === "whatsapp" ? normalizeWhatsApp(value || "") : normalizeUrl(value || ""),
            ])
            .filter(([, value]) => value && value.trim() !== ""),
        );

        // If no social media links provided, just continue
        if (Object.keys(normalizedData).length === 0) {
          return true;
        }

        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

        const endpoint = socialRecordId
          ? `${API_URL}/api/listing/${listingSlug}/socials/${socialRecordId}`
          : `${API_URL}/api/listing/${listingSlug}/socials`;

        const response = await fetch(endpoint, {
          method: socialRecordId ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(normalizedData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to save social media links",
          );
        }

        toast.success("Social media links saved successfully");
        if (onSuccess) onSuccess();
        return true;
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to save social media links",
        );
        return false;
      }
    };

    useImperativeHandle(ref, () => ({
      submit: async () => {
        const isValid = await trigger();
        if (!isValid) {
          toast.error("Validation failed", {
            description: "Please check URL formats",
          });
          return false;
        }
        return await handleFormSubmit(getValues());
      },
    }));

    return (
      <div className="w-full max-w-5xl mx-auto p-0.5 lg:p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-semibold">Social Media & Links</h2>
          <p className="text-sm text-gray-500 mt-1 uppercase tracking-wider text-[10px] font-bold">
            Listing ID: {listingId}
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
                      type="text" // Using text to allow normalizedUrl helper to work
                      placeholder={platform.placeholder}
                      className={cn(
                        "h-10 rounded-lg border-gray-300 px-4 text-gray-800",
                        errors[platform.id as keyof SocialMediaFormValues] &&
                          "border-red-500",
                      )}
                    />
                    {hasValue && !errors[platform.id as keyof SocialMediaFormValues] && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-600 text-xs">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {errors[platform.id as keyof SocialMediaFormValues] && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors[platform.id as keyof SocialMediaFormValues]?.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </form>
      </div>
    );
  },
);
