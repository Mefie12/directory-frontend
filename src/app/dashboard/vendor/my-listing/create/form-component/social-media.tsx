"use client";

import { forwardRef, useImperativeHandle, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Facebook, Instagram, Linkedin, Twitter, Globe, Phone } from "lucide-react";
import { toast } from "sonner";
import { ListingFormHandle } from "@/app/dashboard/vendor/my-listing/create/new-listing-content";

// --- Helper function to validate URL (allows without protocol) ---
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

// --- Helper function to normalize URL (add https:// if missing) ---
const normalizeUrl = (url: string): string => {
  if (!url) return "";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
};

const normalizeWhatsApp = (phone: string): string => {
  if (!phone) return "";
  // If already a URL, return as-is
  if (phone.startsWith("http://") || phone.startsWith("https://")) return phone;
  // Strip spaces, dashes, parentheses, and leading +
  const digits = phone.replace(/[\s\-\(\)\+]/g, "");
  return `https://wa.me/${digits}`;
};

/* ---------------------------------------------------
   SCHEMA
--------------------------------------------------- */
export const socialMediaSchema = z.object({
  facebook: z.string()
    .optional()
    .or(z.literal(""))
    .refine((val) => validatePlatform(val, "facebook"), {
      message: platformPatterns.facebook.hint,
    }),
  instagram: z.string()
    .optional()
    .or(z.literal(""))
    .refine((val) => validatePlatform(val, "instagram"), {
      message: platformPatterns.instagram.hint,
    }),
  twitter: z.string()
    .optional()
    .or(z.literal(""))
    .refine((val) => validatePlatform(val, "twitter"), {
      message: platformPatterns.twitter.hint,
    }),
  linkedin: z.string()
    .optional()
    .or(z.literal(""))
    .refine((val) => validatePlatform(val, "linkedin"), {
      message: platformPatterns.linkedin.hint,
    }),
  tiktok: z.string()
    .optional()
    .or(z.literal(""))
    .refine((val) => validatePlatform(val, "tiktok"), {
      message: platformPatterns.tiktok.hint,
    }),
  whatsapp: z.string()
    .optional()
    .or(z.literal(""))
    .refine((val) => isValidPhone(val || ""), {
      message: "Must be a valid phone number (e.g. +233 50 123 4567)",
    }),
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
      mode: "onChange",
      defaultValues: {
        facebook: "",
        instagram: "",
        twitter: "",
        linkedin: "",
        tiktok: "",
        whatsapp: "",
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
            `${API_URL}/api/listing/${listingSlug}/socials`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            },
          );

          if (res.ok) {
            const json = await res.json();
            const raw = json.data || json || {};
            const s = Array.isArray(raw) ? raw[0] || {} : raw;
            reset({
              facebook: s.facebook || "",
              instagram: s.instagram || "",
              twitter: s.twitter || "",
              linkedin: s.linkedin || "",
              tiktok: s.tiktok || "",
              whatsapp: s.whatsapp || "",
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
        // Also normalize URLs to add https:// if missing
        const normalizedData = Object.fromEntries(
          Object.entries(data)
            .map(([key, value]) => [
              key,
              key === "whatsapp" ? normalizeWhatsApp(value || "") : normalizeUrl(value || ""),
            ])
            .filter(([, value]) => value && value.trim() !== ""),
        );

        const socialData = normalizedData;

        // If no social media links provided, we still proceed to next step
        if (Object.keys(socialData).length === 0) return true;

        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

        // UPDATED: Use the /update endpoint with PATCH method
        const endpoint = `${API_URL}/api/listing/${listingSlug}/socials`;

        const response = await fetch(endpoint, {
          method: "POST", // Changed from POST to PATCH
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(socialData),
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
                      type={platform.type === "phone" ? "tel" : "text"}
                      placeholder={platform.placeholder}
                      className={cn(
                        "h-10 rounded-lg border-gray-300 px-4 text-gray-800 focus-visible:ring-2 focus-visible:ring-black",
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


