/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, Suspense, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import ScrollableCategoryTabs, {
  CategoryTabItem,
  slugifyCategory,
} from "@/components/scrollable-category-tabs";
import SearchHeader from "@/components/search-header";
// import { communityCards } from "@/lib/data"; // Removed unused EventsCategory import
import { Button } from "@/components/ui/button";
// import Image from "next/image";
import Link from "next/link";
import EventSectionCarousel from "@/components/event-section-carousel";
import EventCarousel from "@/components/events/event-carousel";
import CommunitySectionCarousel from "@/components/community-section-carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import type { ProcessedEvent } from "@/types/event";
import { Country } from "@/components/ui/country-dropdown";

// --- API & Processed Interfaces ---
interface ApiImage {
  id?: number;
  media: string;
  media_type?: string;
}

interface ApiCategory {
  name: string;
  slug?: string;
}

interface ApiListing {
  id: number;
  name: string;
  slug: string;
  type: string;
  listing_type?: string;
  rating: string | number;
  ratings_count: string | number;
  address?: string;
  city?: string;
  country?: string;
  status: string;
  images: (ApiImage | string)[];
  cover_image?: string;
  image?: string;
  categories: ApiCategory[];
  bio?: string;
  description?: string;
  created_at?: string;
  is_verified?: boolean;
  event_start_date?: string;
  event_end_date?: string;
  event_venue?: string;
  event_city?: string;
  event_country?: string;
  event_price?: string | null;
  event_currency?: string | null;
}

// Unified interface to satisfy all carousel components
// interface ProcessedEvent {
//   id: string;
//   name: string;
//   title: string;
//   slug: string;
//   description: string;
//   image: string;
//   images: string[];
//   location: string;
//   verified: boolean;
//   category: string;
//   categorySlug: string;
//   type: "event"; // Narrowed type to satisfy EventCarousel
//   country: string;
//   createdAt: Date;
//   startDate: string;
//   endDate: string;
//   date: string;
//   price: string;
//   rating: number;
//   reviewCount: number; // Renamed from 'reviews' to match component props
// }

// --- Helper Functions ---
const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/placeholders/generic.jpg";
  if (url.startsWith("http")) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
  return `${API_URL}/${url.replace(/^\//, "")}`;
};

const formatDateTime = (dateString?: string) => {
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
  item: ApiListing,
): "business" | "event" | "community" => {
  const rawType = (item.type || item.listing_type || "")
    .toString()
    .trim()
    .toLowerCase();
  if (item.event_start_date || rawType === "event") return "event";
  if (rawType === "community") return "community";
  return "business";
};

export default function EventsContent() {
  const [events, setEvents] = useState<ProcessedEvent[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [, setApiCategories] = useState<CategoryTabItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAllCategories, setShowAllCategories] = useState(false);

  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [clientIp, setClientIp] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const filterQ = searchParams.get("q");
  const filterCountry = searchParams.get("country");
  const filterCategory = searchParams.get("category_id");
  const filterStartDate = searchParams.get("event_start_date");
  const filterEndDate = searchParams.get("event_end_date");
  const hasFilters = !!(filterQ || filterCountry || (filterCategory && filterCategory !== "all") || filterStartDate || filterEndDate);

  // Detect client IP once on mount; cache in sessionStorage to avoid repeat calls
  useEffect(() => {
    const cached = sessionStorage.getItem("client_ip");
    if (cached) { setClientIp(cached); return; }
    fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((d) => { sessionStorage.setItem("client_ip", d.ip); setClientIp(d.ip); })
      .catch(() => {});
  }, []);

  const handleClickEvent = () => {
    if (user) {
      router.push("/claim");
    } else {
      router.push("/auth/login?redirect=/claim");
    }
  };

  const handleCountryChange = useCallback((country: Country | null) => {
    void country;
  }, []);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const params = new URLSearchParams({ per_page: "100" });
        // NOTE: Do NOT send `country` to the backend on the events page.
        // Events store their country in `event_country` (the `country` column
        // is null), so `?country=Ghana` would filter out all events.
        // We apply the country filter client-side below instead.
        if (filterCategory && filterCategory !== "all") params.set("category_id", filterCategory);
        if (filterStartDate) params.set("event_start_date", filterStartDate);
        if (filterEndDate) params.set("event_end_date", filterEndDate);
        if (filterQ) params.set("q", filterQ);

        let listingsUrl: string;
        if (hasFilters) {
          listingsUrl = `/api/search?${params.toString()}`;
        } else {
          if (clientIp) params.set("ip_address", clientIp);
          listingsUrl = `/api/listings_by_geolocation?${params.toString()}`;
        }

        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

        const [listingsRes, categoriesRes] = await Promise.all([
          fetch(listingsUrl),
          fetch(`${API_URL}/api/categories`),
        ]);

        if (!listingsRes.ok || !categoriesRes.ok)
          throw new Error("Failed to fetch data");

        const listingsJson = await listingsRes.json();
        const categoriesJson = await categoriesRes.json();

        // Extract detected country from API response
        if (listingsJson.meta?.detected_country) {
          setDetectedCountry(listingsJson.meta.detected_country);
        }

        // 1. Process Categories
        const rawCats: ApiCategory[] =
          categoriesJson.data || categoriesJson.categories || [];
        setApiCategories([
          { label: "All", value: "all" },
          ...rawCats.map((c) => ({
            label: c.name,
            value: c.slug || slugifyCategory(c.name),
          })),
        ]);

        // 2. Process Listings
        const data: ApiListing[] =
          listingsJson.data || listingsJson.listings || [];
        const eventsList: ProcessedEvent[] = [];
        const communitiesList: any[] = [];

        data.forEach((item) => {
          const rawImages = Array.isArray(item.images) ? item.images : [];
          const validImages = rawImages
            .filter(
              (img) =>
                typeof img === "string" ||
                (img &&
                  typeof img === "object" &&
                  !["processing", "failed"].includes((img as ApiImage).media)),
            )
            .map((img) =>
              getImageUrl(
                typeof img === "string" ? img : (img as ApiImage).media,
              ),
            );

          if (validImages.length === 0)
            validImages.push(getImageUrl(item.image || item.cover_image));

          const listingType = classifyListing(item);
          const category = item.categories?.[0];

          const location = listingType === "event"
            ? item.event_city || item.event_country || "Online"
            : item.city || item.country || "Online";

          const startDate = formatDateTime(item.event_start_date);
          const endDate = formatDateTime(item.event_end_date || item.event_start_date);
          const priceLabel = item.event_price
            ? `${item.event_currency || ""} ${item.event_price}`.trim()
            : "Free";

          const commonProps = {
            id: item.id.toString(),
            name: item.name,
            title: item.name,
            slug: item.slug,
            description: item.bio || item.description || "",
            image: validImages[0],
            images: validImages,
            location,
            verified: item.is_verified || false,
            category: category?.name || "General",
            categorySlug:
              category?.slug || slugifyCategory(category?.name || "general"),
            country: item.event_country || item.country || "Ghana",
            createdAt: item.created_at ? new Date(item.created_at) : new Date(),
            startDate,
            endDate,
            date: startDate,
            price: priceLabel,
            rating: Number(item.rating) || 0,
            reviewCount: Number(item.ratings_count) || 0,
          };

          // Client-side country filter (backend filter doesn't apply to events
          // because their location is stored in event_country, not country).
          if (filterCountry) {
            const target = filterCountry.toLowerCase();
            const itemCountry = (
              item.event_country ||
              item.country ||
              ""
            )
              .toString()
              .toLowerCase();
            if (itemCountry !== target) return;
          }

          if (listingType === "event") {
            eventsList.push({ ...commonProps, type: "event" });
          } else if (listingType === "community") {
            communitiesList.push({ ...commonProps, type: "community" });
          }
        });

        setEvents(eventsList);
        setCommunities(communitiesList);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [clientIp, filterQ, filterCountry, filterCategory, filterStartDate, filterEndDate, hasFilters]);

  // --- Dynamic Grouping Logic ---
  const groupedEvents = useMemo(() => {
    return events.reduce(
      (acc, event) => {
        const catName = event.category;
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(event);
        return acc;
      },
      {} as Record<string, ProcessedEvent[]>,
    );
  }, [events]);

  const availableCategoryNames = useMemo(
    () => Object.keys(groupedEvents),
    [groupedEvents],
  );

  const filteredEvents = useMemo(() => {
    if (selectedCategory === "all") return events;
    return events.filter((e) => e.categorySlug === selectedCategory);
  }, [events, selectedCategory]);

  if (isLoading) return <LoadingSkeleton />;

  return (
    <>
      <ScrollableCategoryTabs
        mainCategorySlug="events"
        defaultValue="all"
        value={selectedCategory}
        onChange={setSelectedCategory}
        containerClassName="pt-4 pb-1"
      />

      <Suspense fallback={<div className="h-20" />}>
        <SearchHeader 
          context="events" 
          detectedCountry={detectedCountry}
          onCountryChange={handleCountryChange}
        />
      </Suspense>

      <div className="bg-gray-50">
        {filteredEvents.length > 0 ? (
          <>
            {selectedCategory === "all" ? (
              <>
                <EventCarousel
                  events={events.slice(0, 8)}
                  title="Popular Events coming up"
                  showNavigation={true}
                />

                {availableCategoryNames.slice(0, 3).map((catName) => (
                  <div key={catName} className="py-12 px-4 lg:px-16">
                    <EventSectionCarousel
                      events={groupedEvents[catName]}
                      title={catName}
                    />
                  </div>
                ))}

                {showAllCategories &&
                  availableCategoryNames.slice(3).map((catName) => (
                    <div key={catName} className="py-12 px-4 lg:px-16">
                      <EventSectionCarousel
                        events={groupedEvents[catName]}
                        title={catName}
                      />
                    </div>
                  ))}

                <div className="flex justify-center py-10">
                  <Button
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    variant="outline"
                    className="border-[#9ACC23] text-[#9ACC23] hover:bg-[#9ACC23] hover:text-white"
                  >
                    {showAllCategories
                      ? "Show less"
                      : "Explore more categories"}
                  </Button>
                </div>

                {/* <section className="py-12 px-4 lg:px-16 bg-white">
                  <div className="flex flex-col lg:flex-row overflow-hidden rounded-2xl shadow-sm">
                    <div className="relative w-full lg:w-1/2 h-80 lg:h-auto">
                      <Image
                        src="/images/backgroundImages/business/vendor2.jpg"
                        alt="Banner"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex flex-col justify-center bg-black text-white w-full lg:w-1/2 p-8 lg:p-16 space-y-6">
                      <h2 className="text-3xl md:text-5xl font-medium">
                        List Your Events on Mefie
                      </h2>
                      <p className="text-lg opacity-90">
                        Create a listing, reach new customers, and grow your
                        business within the global African community.
                      </p>
                      <Button
                        onClick={handleClickEvent}
                        className="bg-[#93C01F] hover:bg-[#93C956] w-fit"
                      >
                        List your event
                      </Button>
                    </div>
                  </div>
                </section> */}

                <div className="py-10 px-4 lg:px-16">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-semibold text-2xl md:text-4xl">
                      Communities
                    </h2>
                    <Link
                      href="/communities"
                      className="text-[#275782] font-medium"
                    >
                      Explore all
                    </Link>
                  </div>
                  {communities.length > 0 ? (
                    <CommunitySectionCarousel communities={communities} />
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      No communities found.
                    </div>
                  )}
                </div>

                <div className="py-12 px-4 lg:px-16">
                  <div className="relative flex flex-col justify-center items-center text-center bg-[#152B40] text-white rounded-3xl h-[350px] overflow-hidden px-10">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">
                      Ready to Grow Your Business?
                    </h2>
                    <Button
                      onClick={handleClickEvent}
                      className="bg-[#93C01F] hover:bg-[#93C956]"
                    >
                      List your business today
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 px-4 lg:px-16">
                <EventSectionCarousel
                  events={filteredEvents}
                  title={`${filteredEvents[0].category} Events`}
                />
              </div>
            )}
          </>
        ) : (
          <div className="py-16 text-center text-gray-500">
            No events found in this category.
          </div>
        )}
      </div>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 px-4 lg:px-16 pt-8">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <Skeleton className="h-80 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    </div>
  );
}
