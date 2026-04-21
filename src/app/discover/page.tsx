/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
import { useAuth } from "@/context/auth-context";
import { Country } from "@/components/ui/country-dropdown";

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
  address?: string;
  city?: string;
  country?: string;
  status: string;
  images: (ApiImage | string)[];
  cover_image?: string;
  categories: ApiCategory[];
  bio?: string;
  description?: string;
  created_at?: string;
  is_verified?: boolean;
  // Event-specific fields
  event_start_date?: string;
  event_end_date?: string;
  event_venue?: string;
  event_city?: string;
  event_country?: string;
  event_price?: string | null;
  event_currency?: string | null;
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
    if (isNaN(date.getTime())) return "TBA";
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

  if (rawType === "event") return "event";
  if (rawType === "community") return "community";
  return "business";
};

function DiscoverContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const searchParams = useSearchParams();
  // IP captured at signup and stored in localStorage
  const [clientIp] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("user_ip");
  });

  // SearchHeader updates URL params via useSearchParams; no local state needed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCountryChange = useCallback((_country: Country | null) => {}, []);

  const handleClickEvent = () => {
    if (user) {
      router.push("/claim");
    } else {
      router.push("/auth/login?redirect=/claim");
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const filterCountry = searchParams.get("country");
  const filterCategory = searchParams.get("category_id");
  const filterStartDate = searchParams.get("event_start_date");
  const filterEndDate = searchParams.get("event_end_date");
  const hasApiFilters = !!((filterCategory && filterCategory !== "all") || filterStartDate || filterEndDate);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const params = new URLSearchParams({ per_page: "100" });
        // Country filter and date/category filters go to the API.
        // Text search is handled client-side to avoid a navigation on every keystroke.
        if (filterCategory && filterCategory !== "all") params.set("category_id", filterCategory);
        if (filterStartDate) params.set("event_start_date", filterStartDate);
        if (filterEndDate) params.set("event_end_date", filterEndDate);

        let listingsUrl: string;
        if (hasApiFilters) {
          listingsUrl = `/api/search?${params.toString()}`;
        } else {
          if (clientIp) params.set("ip_address", clientIp);
          listingsUrl = `/api/listings_by_geolocation?${params.toString()}`;
        }

        const response = await fetch(listingsUrl, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch listings");

        const json = await response.json();

        // Extract detected country from API response
        if (json.meta?.detected_country) {
          setDetectedCountry(json.meta.detected_country);
        }

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
          const listingType = classifyListing(item);

          // Client-side country filter (handles events' event_country too)
          if (filterCountry) {
            const target = filterCountry.toLowerCase();
            const itemCountry = (
              listingType === "event"
                ? item.event_country || item.country
                : item.country || item.event_country
            )
              ?.toString()
              .toLowerCase();
            if (itemCountry !== target) return;
          }

          const buildLocation = () => {
            if (listingType === "event") {
              return item.event_city || item.event_country || "Online";
            }
            return item.city || item.country || "Online";
          };

          const commonProps = {
            id: item.id.toString(),
            name: item.name,
            title: item.name,
            slug: item.slug,
            description: item.bio || item.description || "",
            image: validImages[0],
            images: validImages,
            location: buildLocation(),
            verified: item.is_verified || false,
          };

          if (listingType === "community") {
            communitiesList.push({
              ...commonProps,
            });
          } else if (listingType === "event") {
            const priceLabel = item.event_price
              ? `${item.event_currency || ""} ${item.event_price}`.trim()
              : "Free";

            eventsList.push({
              ...commonProps,
              category: categoryName,
              startDate: formatDate(item.event_start_date),
              endDate: formatDate(item.event_end_date || item.event_start_date),
              price: priceLabel,
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
  }, [clientIp, filterCountry, filterCategory, filterStartDate, filterEndDate, hasApiFilters]);

  // Client-side text filtering — no re-fetch, no navigation
  const q = searchQuery.toLowerCase();
  const filteredBusinesses = useMemo(() =>
    q ? businesses.filter(b =>
      b.name?.toLowerCase().includes(q) ||
      b.category?.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q) ||
      b.location?.toLowerCase().includes(q)
    ) : businesses,
  [businesses, q]);

  const filteredEvents = useMemo(() =>
    q ? events.filter(e =>
      e.name?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q)
    ) : events,
  [events, q]);

  const filteredCommunities = useMemo(() =>
    q ? communities.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q)
    ) : communities,
  [communities, q]);

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
          <SearchHeader
            context="discover"
            detectedCountry={detectedCountry}
            onCountryChange={handleCountryChange}
            onSearchChange={setSearchQuery}
          />
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
            <BusinessCardCarousel businesses={filteredBusinesses} />
            <EventCardCarousel events={filteredEvents} />
            <BusinessBestCarousel businesses={filteredBusinesses} />
          </>
        )}

        {/* Ready to grow your business section */}
        {/* <div className="py-12 px-4 lg:px-16 bg-white">
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
              <Button onClick={handleClickEvent} className="bg-[#93C01F] hover:bg-[#7ea919] text-white font-medium w-fit px-4 py-3 rounded-md cursor-pointer">
                Join as a vendor
              </Button>
            </div>
          </div>
        </div> */}

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
            <BusinessSectionCarousel businesses={filteredBusinesses} />
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
            <EventSectionCarousel events={filteredEvents} />
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
            <CommunitySectionCarousel communities={filteredCommunities} />
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
            <Button onClick={handleClickEvent} className="bg-[#93C01F] hover:bg-[#7ea919] text-white font-medium text-base px-4 py-2 rounded-md transition-all duration-200">
              List your business today
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Discover() {
  return (
    <Suspense fallback={<div className="pt-20">Loading...</div>}>
      <DiscoverContent />
    </Suspense>
  );
}
