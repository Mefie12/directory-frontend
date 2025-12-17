/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Suspense } from "react";
import NavigationTab from "@/components/navigation-tab";
import SearchHeader from "@/components/search-header";
import BusinessCardCarousel from "@/components/discover/business-card-carousel";
import EventCardCarousel from "@/components/discover/event-card-carousel";
import BusinessBestCarousel from "@/components/discover/business-best-carousel";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import BusinessSectionCarousel from "@/components/business-section-carousel";
import EventSectionCarousel from "@/components/event-section-carousel";
import CommunitySectionCarousel from "@/components/community-section-carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

// --- Interfaces ---
interface ApiImage {
  id?: number;
  media: string;
  media_type?: string;
}

interface ApiCategory {
  name: string;
}

interface ApiListing {
  id: number;
  name: string;
  slug: string;
  type: string;
  listing_type: string;
  rating: string | number;
  ratings_count: string | number;
  location?: string;
  address?: string;
  status: string;
  images: (ApiImage | string)[];
  cover_image?: string;
  categories: ApiCategory[];
  bio?: string;
  description?: string;
  start_date?: string;
  date?: string; // Additional check
  created_at?: string; // Fallback
  is_verified?: boolean;
}

// --- Helper Functions ---
const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/placeholders/generic.jpg";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
  return `${API_URL}/${url.replace(/^\//, "")}`;
};

const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return "TBA";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "TBA"; // Invalid date
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "TBA";
  }
};

const classifyListing = (
  item: ApiListing
): "business" | "event" | "community" => {
  const rawType = (item.type || item.listing_type || "")
    .toString()
    .trim()
    .toLowerCase();

  // If it has a future start_date, treat as event even if type is ambiguous
  if (rawType === "event") return "event";
  if (rawType === "community") return "community";
  return "business";
};

export default function Discover() {
  const router = useRouter();

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

        const response = await fetch(`${API_URL}/api/listings`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch listings");

        const json = await response.json();
        const data: ApiListing[] = json.data || json.listings || [];

        const businessesList: any[] = [];
        const eventsList: any[] = [];
        const communitiesList: any[] = [];

        data.forEach((item) => {
          // --- Image Logic ---
          const rawImages = Array.isArray(item.images) ? item.images : [];
          const validImages = rawImages
            .filter((img: any) => {
              if (typeof img === "string") return true;
              if (img && typeof img === "object" && img.media) {
                return !["processing", "failed", "pending", "error"].includes(
                  img.media
                );
              }
              return false;
            })
            .map((img: any) => {
              const mediaPath = typeof img === "string" ? img : img.media;
              return getImageUrl(mediaPath);
            });

          if (validImages.length === 0 && item.cover_image) {
            validImages.push(getImageUrl(item.cover_image));
          }
          if (validImages.length === 0) {
            validImages.push("/images/placeholders/generic.jpg");
          }

          const categoryName = item.categories?.[0]?.name || "General";
          const location = item.location || item.address || "Online";
          const listingType = classifyListing(item);

          const commonProps = {
            id: item.id.toString(),
            name: item.name,
            title: item.name,
            slug: item.slug,
            description: item.bio || item.description || "",
            image: validImages[0],
            images: validImages,
            location: location,
            verified: item.is_verified || false,
          };

          if (listingType === "community") {
            communitiesList.push({
              ...commonProps,
            });
          } else if (listingType === "event") {
            // FIX: Robust Date Checking
            const eventDate = item.start_date || item.date || item.created_at;

            eventsList.push({
              ...commonProps,
              category: categoryName,
              // Use helper function
              startDate: formatDate(eventDate),
              endDate: formatDate(eventDate), // Assuming single day for now
              price: "Free",
            });
          } else {
            businessesList.push({
              ...commonProps,
              category: categoryName,
              rating: Number(item.rating) || 0,
              reviewCount: Number(item.ratings_count) || 0,
            });
          }
        });

        setBusinesses(businessesList);
        setEvents(eventsList);
        setCommunities(communitiesList);
      } catch (error) {
        console.error("Failed to fetch discover data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const SectionSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-80 w-full rounded-2xl" />
      ))}
    </div>
  );

  return (
    <div className="overflow-x-hidden pt-20 bg-gray-50">
      <div className="w-full">
        <NavigationTab />
        <Suspense fallback={<div className="h-20" />}>
          <SearchHeader context="discover" />
        </Suspense>
      </div>

      <div className="space-y-2">
        {/* Top Carousels */}
        {isLoading ? (
          <div className="px-4 lg:px-16 py-8 space-y-8">
            <SectionSkeleton />
            <SectionSkeleton />
          </div>
        ) : (
          <>
            <BusinessCardCarousel businesses={businesses} />
            <EventCardCarousel events={events} />
            <BusinessBestCarousel businesses={businesses} />
          </>
        )}

        {/* Ready to grow your business section */}
        <div className="py-12 px-4 lg:px-16 bg-white">
          <div className="flex flex-col lg:flex-row overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="relative w-full lg:w-1/2 h-80 lg:h-auto">
              <Image
                src="/images/backgroundImages/business/vendor.jpg"
                alt="Vendor serving customer"
                fill
                className="object-cover"
                unoptimized={true}
                priority
              />
            </div>
            <div className="flex flex-col justify-center bg-[#0D7077] text-white w-full lg:w-1/2 p-8 lg:p-16 space-y-6">
              <h2 className="text-3xl md:text-5xl font-medium leading-tight">
                Grow Your Business with Mefie
              </h2>
              <p className="text-base md:text-lg leading-relaxed">
                Join a network of vendors and service providers reaching new
                audiences through Mefie. Showcase your products, connect with
                customers, and expand your business in a thriving digital
                marketplace.
              </p>
              <Button onClick={()=>router.push("/become-a-vendor")} className="bg-[#93C01F] hover:bg-[#7ea919] text-white font-medium w-fit px-4 py-3 rounded-md cursor-pointer">
                Join as a vendor
              </Button>
            </div>
          </div>
        </div>

        {/* Business section */}
        <div className="py-12 px-4 lg:px-16">
          <div className="flex flex-row justify-between items-end md:items-center gap-3 mb-8">
            <div className="flex flex-col space-y-2">
              <h2 className="font-semibold text-xl md:text-4xl">Businesses</h2>
            </div>
            <div>
              <Link
                href="/businesses"
                className="text-[#275782] font-medium hidden lg:block"
              >
                Explore Businesses
              </Link>
              <Link
                href="/businesses"
                className="text-[#275782] font-medium lg:hidden"
              >
                Explore all
              </Link>
            </div>
          </div>
          {isLoading ? (
            <SectionSkeleton />
          ) : (
            <BusinessSectionCarousel businesses={businesses} />
          )}
        </div>

        {/* Events section */}
        <div className="py-12 px-4 lg:px-16">
          <div className="flex flex-row justify-between items-end md:items-center gap-3 mb-8">
            <div className="flex flex-col space-y-2">
              <h2 className="font-semibold text-xl md:text-4xl">Events</h2>
            </div>
            <div>
              <Link
                href="/events"
                className="text-[#275782] font-medium hidden lg:block"
              >
                Explore Events
              </Link>
              <Link
                href="/events"
                className="text-[#275782] font-medium lg:hidden"
              >
                Explore all
              </Link>
            </div>
          </div>
          {isLoading ? (
            <SectionSkeleton />
          ) : (
            <EventSectionCarousel events={events} />
          )}
        </div>

        {/* Communities section */}
        <div className="py-10 px-4 lg:px-16">
          <div className="flex flex-row justify-between items-end md:items-center gap-3 mb-6">
            <div className="flex flex-col space-y-2">
              <h2 className="font-semibold text-xl md:text-4xl">Communities</h2>
            </div>
            <div>
              <Link
                href="/communities"
                className="text-[#275782] font-medium hidden lg:block"
              >
                Explore Communities
              </Link>
              <Link
                href="/communities"
                className="text-[#275782] font-medium lg:hidden"
              >
                Explore all
              </Link>
            </div>
          </div>
          {isLoading ? (
            <SectionSkeleton />
          ) : (
            <CommunitySectionCarousel communities={communities} />
          )}
        </div>

        {/* CTA */}
        <div className="py-12 px-4 lg:px-16">
          <div className="relative flex flex-col justify-center items-center text-center bg-[#152B40] text-white rounded-3xl overflow-hidden h-[350px] shadow-sm px-20 lg:px-0">
            <div className="absolute -left-32 lg:-left-6 lg:-bottom-20">
              <Image
                src="/images/backgroundImages/bg-pattern.svg"
                alt="background pattern left"
                width={320}
                height={320}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain h-[150px] lg:h-[400px]"
                priority
              />
            </div>
            <div className="hidden lg:block absolute bottom-20 lg:-bottom-20 -right-24 lg:right-0">
              <Image
                src="/images/backgroundImages/bg-pattern-1.svg"
                alt="background pattern right"
                width={320}
                height={320}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain"
                priority
              />
            </div>
            <div className="block lg:hidden absolute bottom-16 -right-32">
              <Image
                src="/images/backgroundImages/mobile-pattern.svg"
                alt="background pattern right"
                width={320}
                height={320}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain h-[120px]"
                priority
              />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
              Ready to Grow Your Business?
            </h2>
            <p className="text-base md:text-lg font-normal text-gray-100 mb-6">
              Join thousands of African businesses already listed on Mefie
              Directory
            </p>
            <Button onClick={()=>router.push("/become-a-vendor")} className="bg-[#93C01F] hover:bg-[#7ea919] text-white font-medium text-base px-4 py-2 rounded-md transition-all duration-200">
              List your business today
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
