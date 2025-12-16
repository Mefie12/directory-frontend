/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TestimonialCard from "./testimonial";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// --- Types ---

// 1. Enhanced API Types matching Code A patterns
interface ApiRatingUser {
  id?: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  profile_photo_url?: string;
  username?: string;
  email?: string;
  // Handle API wrapper
  data?: any;
  user?: any;
}

interface ApiRating {
  id: number;
  listing_id: number;
  user_id: number;
  rating: number;
  comment: string;
  created_at?: string;
  user?: ApiRatingUser;
}

interface ApiRatingsResponse {
  data: ApiRating[];
}

// 2. UI Card Type (enhanced with optional fields)
export interface Testimonial {
  id: number;
  image: string;
  name: string;
  message: string;
  review: string;
  stars: number;
  date?: string;
  userId?: number;
}

// --- Helper Functions (Copied/Adapted from Code A) ---

/**
 * CONSISTENT Name Extraction Logic
 * Same as Code A's extractUserName function
 */
const extractUserName = (userData: any): string => {
  if (!userData) return "Verified Customer";

  // Check if userData is wrapped in a 'data' property
  const rawUser = userData.data || userData.user || userData;

  // 1. Try 'name' field
  let fullName = rawUser.name;

  // 2. Try first_name + last_name
  if (!fullName && (rawUser.first_name || rawUser.last_name)) {
    fullName = `${rawUser.first_name || ""} ${rawUser.last_name || ""}`.trim();
  }

  // 3. Fallbacks
  if (!fullName) {
    fullName =
      rawUser.username || rawUser.email?.split("@")[0] || "Verified Customer";
  }

  return fullName;
};

/**
 * CONSISTENT Image URL handling
 * Similar to Code A's getImageUrl but simplified for client-side
 */
const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/placeholders/avatar.jpg"; // Consistent fallback
  
  // If already a full URL
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  
  // For relative paths
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
  // Remove leading slash if present
  const cleanUrl = url.replace(/^\//, "");
  return `${API_URL}/${cleanUrl}`;
};

/**
 * Format date similar to Code A but simplified
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return "Recently";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recently";
    
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return "Recently";
  }
};

export default function TestimonialCarousel() {
  // --- State ---
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Carousel Setup ---
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    skipSnaps: false,
    dragFree: false,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // --- Enhanced API Integration with Code A patterns ---
  useEffect(() => {
    const fetchRatings = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/api/ratings`, {
          method: "GET",
          headers,
        });

        if (!response.ok) throw new Error("Failed to fetch ratings");

        const json: ApiRatingsResponse = await response.json();

        // --- Enhanced Data Transformation using Code A patterns ---
        const formattedData: Testimonial[] = await Promise.all(
          json.data.map(async (item) => {
            // Start with extracted name
            let displayName = extractUserName(item.user);
            let userAvatar = item.user?.avatar || item.user?.profile_photo_url || "";
            
            // --- ENRICHMENT LOGIC (similar to Code A) ---
            // If user data is minimal but we have user_id, try to fetch more details
            if (item.user_id && (!item.user || Object.keys(item.user).length === 0)) {
              try {
                const userRes = await fetch(
                  `${API_URL}/api/users/${item.user_id}`,
                  {
                    headers: {
                      Accept: "application/json",
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                  }
                );

                if (userRes.ok) {
                  const userJson = await userRes.json();
                  const userData = userJson.data || userJson;
                  
                  // Re-extract name with enriched data
                  displayName = extractUserName(userData);
                  
                  // Get avatar from enriched data
                  userAvatar = userData.avatar || 
                              userData.profile_photo_url || 
                              "";
                }
              } catch (err) {
                console.warn(`Failed to enrich user ${item.user_id}:`, err);
                // Continue with existing data
              }
            }
            
            // Get message preview (first 30 chars)
            const messagePreview = item.comment.length > 30
              ? `${item.comment.substring(0, 30)}...`
              : item.comment;

            return {
              id: item.id,
              name: displayName,
              // Apply consistent image URL handling
              image: getImageUrl(userAvatar),
              review: item.comment,
              message: messagePreview,
              stars: item.rating,
              date: formatDate(item.created_at),
              userId: item.user_id,
            };
          })
        );

        setTestimonials(formattedData);
      } catch (error) {
        console.error("Error loading ratings:", error);
        toast.error("Could not load reviews");
        
        // Graceful fallback: Set empty array instead of breaking
        setTestimonials([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRatings();
  }, []);

  // --- Carousel Logic ---
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const updateButtons = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);
    updateButtons();

    return () => {
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
    };
  }, [emblaApi, testimonials]);

  // --- Enhanced Loading State (with consistent styling) ---
  if (isLoading) {
    return (
      <div className="overflow-hidden">
        <div className="flex gap-8">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex-[0_0_100%] min-w-0 md:flex-[0_0_calc(50%-1rem)] lg:flex-[0_0_calc(33.333%-1.33rem)]"
            >
              <div className="border rounded-2xl p-6 space-y-4 h-[300px] flex flex-col justify-between bg-white">
                <div className="space-y-3">
                  {/* Star rating skeleton - consistent with actual star display */}
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <Skeleton 
                        key={j} 
                        className="h-4 w-4 rounded-full bg-gray-200" 
                      />
                    ))}
                  </div>
                  
                  {/* Review text skeleton */}
                  <Skeleton className="h-6 w-3/4 bg-gray-200" />
                  <Skeleton className="h-4 w-full bg-gray-200" />
                  <Skeleton className="h-4 w-5/6 bg-gray-200" />
                </div>
                
                {/* User info skeleton */}
                <div className="flex items-center gap-3">
                  {/* Avatar skeleton */}
                  <Skeleton className="h-10 w-10 rounded-full bg-gray-200" />
                  <div className="space-y-1">
                    {/* Name skeleton */}
                    <Skeleton className="h-4 w-24 bg-gray-200" />
                    {/* Date skeleton */}
                    <Skeleton className="h-3 w-16 bg-gray-200" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Enhanced Empty State (consistent with Code A patterns) ---
  if (!isLoading && testimonials.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 border rounded-xl bg-gray-50">
        <p className="text-base">No reviews available yet.</p>
        <p className="text-sm mt-2 text-gray-400">
          Be the first to share your experience!
        </p>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="flex-[0_0_100%] min-w-0 md:flex-[0_0_calc(50%-1rem)] lg:flex-[0_0_calc(33.333%-1.33rem)]"
            >
              {/* Pass additional data if TestimonialCard component supports it */}
              <TestimonialCard
                image={testimonial.image}
                name={testimonial.name}
                message={testimonial.message}
                review={testimonial.review}
                stars={testimonial.stars}
                // Add these if your TestimonialCard component supports them
                // date={testimonial.date}
                // userId={testimonial.userId}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {canScrollPrev && (
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 rounded-full bg-white shadow-lg hover:bg-gray-50 hidden md:flex"
          aria-label="Previous review"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      )}

      {canScrollNext && (
        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 rounded-full bg-white shadow-lg hover:bg-gray-50 hidden md:flex"
          aria-label="Next review"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}