"use client";

import { forwardRef, useImperativeHandle, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Globe,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { ListingFormHandle } from "@/components/dashboard/listing/types";
import { normalizeUrl, normalizeWhatsApp } from "@/lib/directory/utils";
import { validatePhoneInternational } from "@/lib/phone";

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
  whatsapp: {
    patterns: [
      /^wa\.me\//,
      /^https?:\/\/(www\.)?wa\.me\//,
    ],
    hint: "Must be a WhatsApp URL (e.g. wa.me/447700900123) or a valid international phone number (e.g. +44 7700 900123)",
  },
};

const validatePlatform = (val: string | undefined, platform: string): boolean => {
  if (!val || !val.trim()) return true;
  const trimmed = val.trim();

  if (platform === "whatsapp") {
    if (trimmed.includes("wa.me/")) return true;
    const withPlus = trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
    if (validatePhoneInternational(withPlus)) return true;
    return false;
  }

  // Plain handles/usernames (no dot, no protocol) are always accepted
  if (!trimmed.includes(".") && !trimmed.startsWith("http")) return true;

  if (!isValidUrl(trimmed)) return false;
  const config = platformPatterns[platform];
  if (!config) return true;
  return isPlatformUrl(trimmed, config.patterns);
};
/* ---------------------------------------------------
   SCHEMA
--------------------------------------------------- */
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
    .refine((val) => validatePlatform(val, "whatsapp"), {
      message: platformPatterns.whatsapp.hint,
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
    placeholder: "+44 7700 900123",
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
    const existingSocialSlug = useRef<string | null>(null);
    const hasLoaded = useRef(false);
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

    // --- 1. Fetch existing socials on mount ---
    useEffect(() => {
      if (hasLoaded.current) return;
      if (!listingSlug) return;
      hasLoaded.current = true;

      const loadSocials = async () => {
        try {
          const token = localStorage.getItem("authToken");
          const res = await fetch(`/api/listing/${listingSlug}/socials`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          });

          if (res.ok) {
            const json = await res.json();
            const raw = json.data || json || {};
            const list = Array.isArray(raw) ? raw : [raw];
            const s = list[list.length - 1] || {};
            if (s.slug) existingSocialSlug.current = s.slug;
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
          console.error("Failed to load social links:", err);
        }
      };
      loadSocials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listingSlug]);

    // --- 2. Save logic using PUT (update) or POST (create) ---
    const handleFormSubmit = async (data: SocialMediaFormValues) => {
      try {
        if (!listingSlug) throw new Error("Listing ID is missing.");

        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("Authentication required");

        const socialData = Object.fromEntries(
          Object.entries(data)
            .map(([key, value]) => [
              key,
              value?.trim()
                ? key === "whatsapp"
                  ? normalizeWhatsApp(value)
                  : normalizeUrl(value)
                : null,
            ])
            .filter(([, value]) => value !== null),
        );

        if (Object.keys(socialData).length === 0) return true;

        const existingSlug = existingSocialSlug.current;
        const endpoint = existingSlug
          ? `/api/listing/${listingSlug}/socials/${existingSlug}`
          : `/api/listing/${listingSlug}/socials`;
        const method = existingSlug ? "PUT" : "POST";

        const response = await fetch(endpoint, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(socialData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to save social media links");
        }

        if (!existingSlug) {
          const result = await response.json();
          const newSlug = result?.data?.slug || result?.slug;
          if (newSlug) existingSocialSlug.current = newSlug;
        }

        toast.success("Social media links updated successfully");
        if (onSuccess) onSuccess();

        return true;
      } catch (error) {
        console.error("Social media save error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to update social media",
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
                    {hasValue &&
                      !errors[platform.id as keyof SocialMediaFormValues] && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 text-xs">✓</span>
                          </div>
                        </div>
                      )}
                  </div>
                  {errors[platform.id as keyof SocialMediaFormValues] && (
                    <p className="text-xs text-red-500 mt-1">
                      {
                        errors[platform.id as keyof SocialMediaFormValues]
                          ?.message
                      }
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
