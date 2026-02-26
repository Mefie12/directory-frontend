/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ListingFormHandle } from "@/app/dashboard/vendor/my-listing/create/new-listing-content";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Loader2, MapPin, Mail, Clock, Tag } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useListing } from "@/context/listing-form-context";

interface Props {
  listingSlug: string;
  // Optional: allow passing a callback to go back to specific steps
  onEditStep?: (step: number) => void;
}

// Interface matching your API response
interface ApiListingData {
  name: string;
  primary_image: string | null;
  categories: { name: string }[];
  address: string | null;
  city: string | null;
  country: string | null;
  email: string | null;
  opening_hours: {
    day_of_week: string;
    open_time: string;
    close_time: string;
  }[];
  bio: string | null;
}

export const ReviewSubmitStep = forwardRef<ListingFormHandle, Props>(
  ({ listingSlug }, ref) => {
    // Get data from context for form values
    const context = useListing();
    const { media, basicInfo, businessDetails } = context;
    const [listingData, setListingData] = useState<ApiListingData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // 1. Fetch real data from API to ensure accuracy before publishing
    useEffect(() => {
      const fetchReviewData = async () => {
        try {
          const token = localStorage.getItem("authToken");
          const API_URL = process.env.API_URL || "https://me-fie.co.uk";

          // Using GET request to fetch the data
          const res = await fetch(
            `${API_URL}/api/listing/${listingSlug}/show`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            }
          );

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

      if (listingSlug) {
        fetchReviewData();
      }
    }, [listingSlug]);

    // 2. Handle the final "Update Listing" action - show success and redirect to dashboard
    useImperativeHandle(ref, () => ({
      async submit() {
        try {
          // Show success toast
          toast.success("Listing Updated Successfully!");
          
          // Route to dashboard
          router.push("/dashboard/vendor/my-listing");
          
          return true;
        } catch (error) {
          console.error(error);
          toast.error("Failed to update listing");
          return false;
        }
      },
    }));

    if (loading) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading details...
        </div>
      );
    }

    // Prepare Display Data - Use context data as primary, fallback to API data
    const getCoverPhotoUrl = (coverPhoto: any) => {
      if (!coverPhoto) return null;
      // If it's an existing image with url, use that
      if (coverPhoto && typeof coverPhoto === 'object' && 'url' in coverPhoto) {
        return coverPhoto.url;
      }
      // Otherwise it's a new File object
      return URL.createObjectURL(coverPhoto);
    };
    
    // Use context data first, fall back to API data
    const displayName = basicInfo?.name || listingData?.name || "Not provided";
    const displayDescription = basicInfo?.description || listingData?.bio || "Not provided";
    const displayEmail = businessDetails?.email || listingData?.email || "Not provided";
    const displayAddress = businessDetails?.address || listingData?.address || "Not provided";
    const displayCity = listingData?.city || "";
    const displayCountry = listingData?.country || "";
    const locationStr = [displayCity, displayCountry].filter(Boolean).join(", ") || "Location pending";
    
    // For categories, we need to get them from listingData since basicInfo has category_ids
    const displayImage = getCoverPhotoUrl(media.coverPhoto) || listingData?.primary_image;
    const categoryStr = listingData?.categories?.map((c) => c.name).join(", ") || "Uncategorized";

    return (
      <div className="space-y-6 px-4 py-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Review & Publish</h2>
          <p className="text-sm text-muted-foreground">
            Review your details before publishing
          </p>
        </div>

        {/* Cover Photo Section */}
        <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
          {displayImage ? (
            <Image
              src={displayImage}
              alt="Cover"
              className="w-full h-full object-cover"
              width={800}
              height={400}
              unoptimized // Needed if using blob URLs or external API images
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Image
                src="/images/no-image.jpg"
                width={100}
                height={100}
                alt="No Image"
                className="opacity-50"
              />
              <span>No cover photo uploaded</span>
            </div>
          )}
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-4 right-4 rounded-full h-10 w-10 shadow-sm"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>

        {/* Main Information Card */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {/* Name */}
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-900">
                  Business Name
                </span>
                <p className="text-sm text-gray-600">
                  {displayName}
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
                <p className="text-xs text-gray-400">{displayAddress}</p>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Email
                </span>
                <p className="text-sm text-gray-600">
                  {displayEmail}
                </p>
              </div>

              {/* Hours */}
              <div className="space-y-1 col-span-1 md:col-span-2">
                <span className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-1">
                  <Clock className="w-3 h-3" /> Business Hours
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {listingData?.opening_hours &&
                  listingData.opening_hours.length > 0 ? (
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
                    <p className="text-sm text-gray-500 italic">No hours set</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description Box */}
            <div className="bg-[#F7FCE9] border border-[#9ACC23] rounded-lg p-4 mt-4">
              <h4 className="text-xs font-bold text-[#5F8B0A] mb-1 uppercase">
                Description
              </h4>
              <p className="text-sm text-gray-800 leading-relaxed">
                {displayDescription}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

ReviewSubmitStep.displayName = "ReviewSubmitStep";
