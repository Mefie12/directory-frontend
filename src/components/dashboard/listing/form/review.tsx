"use client";

import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { toast } from "sonner";
import { ListingFormHandle } from "@/components/dashboard/listing/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  PencilSimple,
  SpinnerGap,
  MapPin,
  Envelope,
  Clock,
  Tag,
  Globe,
  Calendar,
  FacebookLogo,
  InstagramLogo,
  TwitterLogo,
  LinkedinLogo,
  TiktokLogo,
  WhatsappLogo,
} from "@phosphor-icons/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useListing } from "@/context/listing-form-context";
import { getImageUrl } from "@/lib/directory/image-utils";

/**
 * Resolve the cover image src from either the API `primary_image` field or
 * the local `media.coverPhoto` context value. `coverPhoto` can be:
 *   - null
 *   - a newly picked File/Blob (needs object URL)
 *   - a string URL (already resolved)
 *   - a server image object `{ id, original, ... }` (take `.original`)
 */
function resolveCoverSrc(
  primaryImage: string | null | undefined,
  coverPhoto: unknown,
): string | null {
  if (primaryImage) return getImageUrl(primaryImage);
  if (!coverPhoto) return null;
  if (coverPhoto instanceof Blob) return URL.createObjectURL(coverPhoto);
  if (typeof coverPhoto === "string") return getImageUrl(coverPhoto);
  if (typeof coverPhoto === "object" && coverPhoto !== null) {
    const original = (coverPhoto as { original?: unknown }).original;
    if (typeof original === "string") return getImageUrl(original);
  }
  return null;
}

interface Props {
  listingSlug: string;
  // Optional: allow passing a callback to go back to specific steps
  onEditStep?: (step: number) => void;
}

// Interface matching your API response
interface ApiListingData {
  name: string;
  type: string;
  primary_image: string | null;
  images?: { original: string; thumb: string; webp: string }[];
  categories: { name: string }[];
  address: string | null;
  city: string | null;
  country: string | null;
  email: string | null;
  website?: string | null;
  social_media: {
    facebook: string | null;
    twitter: string | null;
    instagram: string | null;
    linkedin: string | null;
    tiktok: string | null;
    whatsapp: string | null;
  };
  opening_hours: {
    day_of_week: string;
    open_time: string;
    close_time: string;
  }[];
  bio: string | null;
  event_start_date: string | null;
  event_end_date: string | null;
  event_start_time: string | null;
  event_end_time: string | null;
}

export const ReviewSubmitStep = forwardRef<ListingFormHandle, Props>(
  ({ listingSlug }, ref) => {
    const { media } = useListing(); // Fallback for local media if API hasn't processed it yet
    const [listingData, setListingData] = useState<ApiListingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [socialLinks, setSocialLinks] = useState<Record<string, string | null> | null>(null);

    // 1. Fetch real data from API to ensure accuracy before publishing
    useEffect(() => {
      const loadReviewData = async () => {
        if (!listingSlug) return;
        try {
          const token = localStorage.getItem("authToken");
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
          const res = await fetch(`${API_URL}/api/listing/${listingSlug}/show`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          });

          if (res.ok) {
            const json = await res.json();
            setListingData(json.data);
          }
        } catch (error) {
          console.error("Failed to load review data", error);
        } finally {
          setLoading(false);
        }
      };

      loadReviewData();
    }, [listingSlug]);

    useEffect(() => {
      const loadSocialLinks = async () => {
        if (!listingSlug) return;
        try {
          const token = localStorage.getItem("authToken");
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
          const res = await fetch(`${API_URL}/api/listing/${listingSlug}/socials`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          });
          if (!res.ok) return;
          const json = await res.json();
          const raw = json.data || json;
          const firstEntry = Array.isArray(raw) ? raw[0] || null : raw;
          if (firstEntry) setSocialLinks(firstEntry);
        } catch (error) {
          console.error("Failed to load social links for review", error);
        }
      };
      loadSocialLinks();
    }, [listingSlug]);

    // 2. Handle the final "Publish" action
    useImperativeHandle(ref, () => ({
      async submit() {
        try {
          // Show success toast
          toast.success("Listing Submitted Successfully!");

          return true;
        } catch (error) {
          console.error(error);
          toast.error("Failed to submit listing");
          return false;
        }
      },
    }));

    if (loading) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <SpinnerGap className="w-6 h-6 animate-spin mr-2" /> Loading details...
        </div>
      );
    }

    const isEvent = listingData?.type === "event";

    const displayWebsite = listingData?.website;

    const socials = socialLinks || listingData?.social_media;

    // Prepare Display Data (Prefer API data, fallback to local upload state)
    const displayImage = resolveCoverSrc(
      listingData?.primary_image,
      media.coverPhoto,
    );

    // Process additional images for gallery
    const galleryImages = listingData?.images?.slice(0, 3) || [];

    const locationStr =
      [listingData?.city, listingData?.country].filter(Boolean).join(", ") ||
      "Location pending";
    const categoryStr =
      listingData?.categories?.map((c) => c.name).join(", ") || "Uncategorized";

    return (
      <div className="space-y-6 px-4 py-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Preview & Publish</h2>
          <p className="text-sm text-muted-foreground">
            Review your details before publishing
          </p>
        </div>

        {/* Cover Photo Section */}
        <div className="space-y-3">
          <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
            {displayImage ? (
              <Image
                src={displayImage}
                alt="Cover"
                className="w-full h-full object-cover"
                width={800}
                height={400}
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                <span>No cover photo uploaded</span>
              </div>
            )}
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-4 right-4 rounded-full h-10 w-10 shadow-sm"
            >
              <PencilSimple className="h-4 w-4" />
            </Button>
          </div>

          {/* Additional Images Grid */}
          <div className="grid grid-cols-3 gap-3 h-24">
            {[0, 1, 2].map((i) => {
              const rawMedia = galleryImages[i]?.original;
              const imgSrc = rawMedia ? getImageUrl(rawMedia) : null;
              return (
                <div
                  key={i}
                  className="relative rounded-md overflow-hidden bg-gray-100 border border-gray-200"
                >
                  {imgSrc ? (
                    <Image
                      src={imgSrc}
                      alt={`Gallery ${i}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                      Empty
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Information Card */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {/* Name */}
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-900">
                  {isEvent ? "Event Name" : "Business Name"}
                </span>
                <p className="text-sm text-gray-600">
                  {listingData?.name || "Not provided"}
                </p>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Tag className="w-3 h-3" /> Category
                </span>
                <p className="text-sm text-gray-600">{categoryStr}</p>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Location
                </span>
                <p className="text-sm text-gray-600">{locationStr}</p>
                <p className="text-xs text-gray-400">{listingData?.address}</p>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Envelope className="w-3 h-3" /> Email
                </span>
                <p className="text-sm text-gray-600">
                  {listingData?.email || "Not provided"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Globe className="w-3 h-3" /> Website
                </span>
                <p className="text-sm text-gray-600 truncate underline decoration-[#93C01F]/30">
                  {displayWebsite}
                </p>
              </div>

              {/* Hours */}
              {isEvent ? (
                <>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Event Dates
                    </span>
                    <p className="text-sm text-gray-600">
                      {listingData?.event_start_date || "N/A"} to{" "}
                      {listingData?.event_end_date || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Event Time
                    </span>
                    <p className="text-sm text-gray-600">
                      {listingData?.event_start_time || "N/A"} -{" "}
                      {listingData?.event_end_time || "N/A"}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1 col-span-1 md:col-span-2">
                    <span className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-1">
                      <Clock className="w-3 h-3" /> Business Hours
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {listingData?.opening_hours?.length ? (
                        listingData.opening_hours.map((h, i) => (
                          <div
                            key={i}
                            className="text-xs text-gray-600 bg-gray-50 p-2 rounded border"
                          >
                            <span className="font-semibold block">
                              {h.day_of_week}
                            </span>
                            {h.open_time
                              ? `${h.open_time} - ${h.close_time}`
                              : "Closed"}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No hours set
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Description Box */}
            <div className="bg-[#F7FCE9] border border-[#9ACC23] rounded-lg p-4 mt-4">
              <h4 className="text-xs font-bold text-[#5F8B0A] mb-1 uppercase">
                Description
              </h4>
              <p className="text-sm text-gray-800 leading-relaxed">
                {listingData?.bio || "No description provided"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Media Card */}
        {socials &&
          Object.values(socials).some(Boolean) && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Social Media
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {socials?.facebook && (
                    <div className="flex items-center gap-3">
                      <FacebookLogo className="w-4 h-4 text-blue-600 shrink-0" />
                      <p className="text-sm text-gray-600 truncate">
                        {socials.facebook}
                      </p>
                    </div>
                  )}
                  {socials?.instagram && (
                    <div className="flex items-center gap-3">
                      <InstagramLogo className="w-4 h-4 text-pink-600 shrink-0" />
                      <p className="text-sm text-gray-600 truncate">
                        {socials.instagram}
                      </p>
                    </div>
                  )}
                  {socials?.twitter && (
                    <div className="flex items-center gap-3">
                      <TwitterLogo className="w-4 h-4 text-blue-400 shrink-0" />
                      <p className="text-sm text-gray-600 truncate">
                        {socials.twitter}
                      </p>
                    </div>
                  )}
                  {socials?.linkedin && (
                    <div className="flex items-center gap-3">
                      <LinkedinLogo className="w-4 h-4 text-blue-700 shrink-0" />
                      <p className="text-sm text-gray-600 truncate">
                        {socials.linkedin}
                      </p>
                    </div>
                  )}
                  {socials?.tiktok && (
                    <div className="flex items-center gap-3">
                      <TiktokLogo className="w-4 h-4 text-black shrink-0" />
                      <p className="text-sm text-gray-600 truncate">
                        {socials.tiktok}
                      </p>
                    </div>
                  )}
                  {socials?.whatsapp && (
                    <div className="flex items-center gap-3">
                      <WhatsappLogo className="w-4 h-4 text-green-600 shrink-0" />
                      <p className="text-sm text-gray-600 truncate">
                        {socials.whatsapp}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    );
  },
);

ReviewSubmitStep.displayName = "ReviewSubmitStep";
