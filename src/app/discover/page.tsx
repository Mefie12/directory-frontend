/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Suspense, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import NavigationTab from "@/components/navigation-tab";
import SearchHeader from "@/components/search-header";
import BusinessCardCarousel from "@/components/discover/business-card-carousel";
import EventCardCarousel from "@/components/discover/event-card-carousel";
import CommunityCarousel from "@/components/communities/community-carousel";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
// --- Interfaces ---
interface ApiImage {
  id?: number;
  original: string;
  thumb: string;
  webp: string;
  mime_type?: string;
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
  listing_verified?: boolean;
  is_verified?: boolean;
  // Event-specific fields
  event_start_date?: string;
  event_end_date?: string;
  event_venue?: string;
  event_city?: string;
  event_country?: string;
  event_price?: string | null;
  event_currency?: string | null;
  event_location_type?: string | null;
}

// --- Helper Functions ---
const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/no-image.jpg";
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
  const [communities, setCommunities] = useState<any[]>([]);
  const [weekEvents, setWeekEvents] = useState<any[]>([]);
  const [soonEvents, setSoonEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  // Stable ref — holds the detected country full name for geo context preservation.
  // Using a ref instead of state avoids adding it to the useEffect dependency array
  // (which would cause an infinite fetch loop: fetch → set name → re-fetch → …).
  const detectedCountryRef = useRef<string | null>(null);
  const searchParams = useSearchParams();

  // Top 15 businesses sorted by highest rating — derived from geo-filtered state
  const topBusinesses = useMemo(
    () =>
      [...businesses]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 15),
    [businesses]
  );

  // Top 15 communities sorted by highest rating — derived from geo-filtered state
  const topCommunities = useMemo(
    () =>
      [...communities]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 15),
    [communities]
  );

  const handleClickEvent = () => {
    if (user) {
      router.push("/claim");
    } else {
      router.push("/auth/login?redirect=/claim");
    }
  };

  const filterCountry = searchParams.get("country");
  const filterQuery = searchParams.get("q");
  const filterStartDate = searchParams.get("event_start_date");
  const filterEndDate = searchParams.get("event_end_date");
  const hasApiFilters = !!(filterStartDate || filterEndDate);

  useEffect(() => {
    const mapListings = (data: ApiListing[]) => {
      const businessesList: any[] = [];
      const eventsList: any[] = [];
      const communitiesList: any[] = [];

      data.forEach((item) => {
        const rawImages = Array.isArray(item.images) ? item.images : [];
        const validImages = rawImages
          .filter((img: any) => {
            if (typeof img === "string") return !!img;
            return !!(img && typeof img === "object" && img.original);
          })
          .map((img: any) => {
            const mediaPath = typeof img === "string" ? img : img.original;
            return getImageUrl(mediaPath);
          });

        if (validImages.length === 0 && item.cover_image) {
          validImages.push(getImageUrl(item.cover_image));
        }
        if (validImages.length === 0) {
          validImages.push("/images/no-image.jpg");
        }

        const categoryName = item.categories?.[0]?.name || "General";
        const listingType = classifyListing(item);

        const buildLocation = () => {
          if (listingType === "event") {
            return (
              item.event_venue ||
              item.event_city ||
              item.event_country ||
              (item.event_location_type === "online" ? "Online" : "TBA")
            );
          }
          return item.city || item.country || "";
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
          verified: !!(item.listing_verified ?? item.is_verified),
        };

        if (listingType === "community") {
          communitiesList.push({
            ...commonProps,
            rating: Number(item.rating) || 0,
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

      return {
        businessesList,
        eventsList,
        communitiesList,
      };
    };

    let stale = false;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Build the URL for each type-scoped fetch
        const makeUrl = (type: string) => {
          const params = new URLSearchParams({ type, per_page: "20" });

          // G-05: Text search → search endpoint for full-dataset coverage.
          // Carries geo/country context and any active date filters along.
          if (filterQuery) {
            params.set("q", filterQuery);
            if (filterCountry) {
              params.set("country", filterCountry);
            } else if (detectedCountryRef.current) {
              params.set("country", detectedCountryRef.current);
            }
            if (filterStartDate) params.set("event_start_date", filterStartDate);
            if (filterEndDate) params.set("event_end_date", filterEndDate);
            return `/api/search?${params.toString()}`;
          }

          // Manual country selection (no text search)
          if (filterCountry) {
            params.set("country", filterCountry);
            return `/api/all_listings_by_country_and_category?${params.toString()}`;
          }

          // G-04: Date filters only — inject detected country so geo context is
          // preserved even though the search endpoint has no IP detection of its own.
          if (hasApiFilters) {
            if (filterStartDate) params.set("event_start_date", filterStartDate);
            if (filterEndDate) params.set("event_end_date", filterEndDate);
            if (detectedCountryRef.current) {
              params.set("country", detectedCountryRef.current);
            }
            return `/api/search?${params.toString()}`;
          }

          // Default — geo detection via BFF header IP extraction
          return `/api/listings_by_geolocation?${params.toString()}`;
        };

        const headers = { "Content-Type": "application/json", Accept: "application/json" };

        // Phase 1 — businesses + communities (filter-aware, geo-capable)
        // Run first so the geo-detected country name is available before event fetches start.
        const [bizRes, comRes] = await Promise.all([
          fetch(makeUrl("business"), { headers }),
          fetch(makeUrl("community"), { headers }),
        ]);

        if (stale) return;

        if (!bizRes.ok || !comRes.ok) {
          throw new Error("Failed to fetch listings");
        }

        const [bizJson, comJson] = await Promise.all([
          bizRes.json(),
          comRes.json(),
        ]);

        if (stale) return;

        // Capture geo-detected country before firing event fetches
        const detected = bizJson?.meta?.detected_country ?? null;
        const detectedName = bizJson?.meta?.detected_country_name ?? null;
        if (detected) setDetectedCountry(detected);
        if (detectedName && !detectedCountryRef.current) {
          detectedCountryRef.current = detectedName;
        }

        // Phase 2 — events with country now known
        // Priority: explicit URL filter > geo-detected name > no filter (global)
        const eventCountry = filterCountry || detectedCountryRef.current || null;
        const eventParams = new URLSearchParams({ per_page: "15" });
        if (eventCountry) eventParams.set("country", eventCountry);

        const [weekRes, soonRes] = await Promise.all([
          fetch(`/api/discover_events?preset=this_week&${eventParams}`, { headers }),
          fetch(`/api/discover_events?preset=happening_soon&${eventParams}`, { headers }),
        ]);

        const [weekJson, soonJson] = await Promise.all([
          weekRes.ok ? weekRes.json() : Promise.resolve({ data: [] }),
          soonRes.ok ? soonRes.json() : Promise.resolve({ data: [] }),
        ]);

        if (stale) return;

        const bizData: ApiListing[] = bizJson.data || bizJson.listings || [];
        const comData: ApiListing[] = comJson.data || comJson.listings || [];
        const weekData: ApiListing[] = weekJson.data || [];
        const soonData: ApiListing[] = soonJson.data || [];

        setBusinesses(mapListings(bizData).businessesList);
        setCommunities(mapListings(comData).communitiesList);
        setWeekEvents(mapListings(weekData).eventsList);
        setSoonEvents(mapListings(soonData).eventsList);
      } catch (error) {
        if (!stale) console.error("Failed to fetch discover data", error);
      } finally {
        if (!stale) setIsLoading(false);
      }
    };

    fetchData();
    return () => { stale = true; };
  }, [filterCountry, filterEndDate, filterStartDate, hasApiFilters, filterQuery]);

  // G-09 / G-14: Carousel titles reflect whether geo worked, a country was manually chosen, or we're in global fallback
  const locationLabel = filterCountry
    ? `in ${filterCountry}`
    : detectedCountry
    ? "near you"
    : null;

  const businessTitle = locationLabel ? `Top Businesses ${locationLabel}` : "Top Businesses";
  const communityTitle = locationLabel ? `Popular communities ${locationLabel}` : "Popular communities";

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
            <BusinessCardCarousel
              businesses={topBusinesses}
              title={businessTitle}
            />
            {weekEvents.length > 0 && (
              <EventCardCarousel
                events={weekEvents}
                title="Happening this week"
              />
            )}
            {soonEvents.length > 0 && (
              <EventCardCarousel
                events={soonEvents}
                title="Happening soon"
              />
            )}
            <CommunityCarousel
              communities={topCommunities}
              title={communityTitle}
              showTitle={true}
              showNavigation={true}
            />
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
