/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, Suspense, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import ScrollableCategoryTabs, { slugifyCategory } from "@/components/scrollable-category-tabs";
import SearchHeader from "@/components/search-header";
import BusinessSection from "@/components/business/business-section";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import EventSectionCarousel from "@/components/event-section-carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Country } from "@/components/ui/country-dropdown";

// --- Types ---
interface ApiImage {
  id?: number;
  media: string;
}

interface ApiCategory {
  id: number;
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
  images: (ApiImage | string)[];
  categories: ApiCategory[];
  bio?: string;
  description?: string;
  created_at?: string;
  is_verified?: boolean;
  image?: string;
  cover_image?: string;
  event_start_date?: string;
  event_end_date?: string;
  event_venue?: string;
  event_city?: string;
  event_country?: string;
  event_price?: string | null;
  event_currency?: string | null;
}

interface ProcessedBusiness {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  images: string[];
  location: string;
  verified: boolean;
  rating: number;
  reviewCount: string;
  category: string;
  categorySlugs: string[];
  type: "business";
  country: string;
  createdAt: Date;
}

// --- Helpers ---
const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/placeholders/generic.jpg";
  if (url.startsWith("http")) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
  return `${API_URL}/${url.replace(/^\//, "")}`;
};

const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return "TBA";
  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? "TBA"
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

const classifyListing = (
  item: ApiListing,
): "business" | "event" | "community" => {
  const rawType = (item.type || item.listing_type || "")
    .toString()
    .toLowerCase();
  if (item.event_start_date || rawType === "event") return "event";
  if (rawType === "community") return "community";
  return "business";
};

export default function BusinessesContent() {
  const [businesses, setBusinesses] = useState<ProcessedBusiness[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const router = useRouter();
  const { user } = useAuth();

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

  // --- Fetch Listings ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const params = new URLSearchParams({ per_page: "100" });
        if (filterCountry) params.set("country", filterCountry);
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

        const businessesList: ProcessedBusiness[] = [];
        const eventsList: any[] = [];

        data.forEach((item) => {
          const rawImages = Array.isArray(item.images) ? item.images : [];

          const validImages = rawImages
            .filter((img): img is string | ApiImage => {
              if (typeof img === "string") return true;
              if (img && typeof img === "object" && "media" in img) {
                const badStatuses = [
                  "processing",
                  "failed",
                  "pending",
                  "error",
                ];
                return !badStatuses.includes((img as ApiImage).media);
              }
              return false;
            })
            .map((img) => {
              const mediaPath =
                typeof img === "string" ? img : (img as ApiImage).media;
              return getImageUrl(mediaPath);
            });

          if (validImages.length === 0) {
            if (item.image) validImages.push(getImageUrl(item.image));
            else if (item.cover_image)
              validImages.push(getImageUrl(item.cover_image));
            else validImages.push("/images/placeholders/generic.jpg");
          }

          const categorySlugs = item.categories?.map((c) => c.slug || slugifyCategory(c.name)) || [
            "general",
          ];
          const categoryName = item.categories?.[0]?.name || "General";
          const listingType = classifyListing(item);

          const location = listingType === "event"
            ? item.event_city || item.event_country || "Online"
            : item.city || item.country || "Online";

          const commonProps = {
            id: item.id.toString(),
            name: item.name,
            slug: item.slug,
            description: item.bio || item.description || "",
            image: validImages[0],
            images: validImages,
            location,
            verified: item.is_verified || false,
            rating: Number(item.rating) || 0,
            reviewCount: String(item.ratings_count) || "0",
            category: categoryName,
            categorySlugs: categorySlugs,
            type: listingType as "business",
            country: item.event_country || item.country || "Ghana",
            createdAt: item.created_at ? new Date(item.created_at) : new Date(),
          };

          if (listingType === "event") {
            const priceLabel = item.event_price
              ? `${item.event_currency || ""} ${item.event_price}`.trim()
              : "Free";
            eventsList.push({
              ...commonProps,
              type: "event",
              title: item.name,
              startDate: formatDate(item.event_start_date),
              endDate: formatDate(item.event_end_date || item.event_start_date),
              date: formatDate(item.event_start_date),
              price: priceLabel,
            });
          } else if (listingType === "business") {
            businessesList.push({
              ...commonProps,
              type: "business" as const,
            });
          }
        });

        setBusinesses(businessesList);
        setEvents(eventsList);
      } catch (error) {
        console.error("Failed to fetch business page data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [clientIp, filterQ, filterCountry, filterCategory, filterStartDate, filterEndDate, hasFilters]);

  // The logic now ensures a direct match against the slug provided by the tabs
  const filteredData = useMemo(() => {
    if (selectedCategory === "all") return businesses;

    return businesses.filter((b) => {
      return b.categorySlugs.includes(selectedCategory);
    });
  }, [businesses, selectedCategory]);


  const groupedBusinesses = useMemo(() => {
    return businesses.reduce(
      (acc, b) => {
        if (!acc[b.category]) acc[b.category] = [];
        acc[b.category].push(b);
        return acc;
      },
      {} as Record<string, ProcessedBusiness[]>,
    );
  }, [businesses]);

  const categoriesToShow = Object.keys(groupedBusinesses);

  const adaptToBusinessSection = (
    processedBusiness: ProcessedBusiness,
  ): any => {
    return {
      ...processedBusiness,
      reviewCount: String(processedBusiness.reviewCount),
    };
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="bg-gray-50 min-h-screen">
      <ScrollableCategoryTabs
        mainCategorySlug="business"
        defaultValue={selectedCategory || "all"}
        value={selectedCategory}
        onChange={(val) => {
          setSelectedCategory(val);
        }}
        containerClassName="pt-4 pb-1"
      />

      <Suspense fallback={<div className="h-20" />}>
        <SearchHeader 
          context="businesses" 
          detectedCountry={detectedCountry}
          onCountryChange={handleCountryChange}
        />
      </Suspense>

      <div className="pb-20">
        {filteredData.length > 0 ? (
          <>
            {selectedCategory === "all" ? (
              <>
                <BusinessSection
                  businesses={businesses
                    .slice(0, 8)
                    .map(adaptToBusinessSection)}
                  title="Today's best deals just for you!"
                />

                {categoriesToShow.slice(0, 3).map((name) => (
                  <BusinessSection
                    key={name}
                    businesses={groupedBusinesses[name].map(
                      adaptToBusinessSection,
                    )}
                    title={name}
                  />
                ))}

                {showAllCategories &&
                  categoriesToShow
                    .slice(3)
                    .map((name) => (
                      <BusinessSection
                        key={name}
                        businesses={groupedBusinesses[name].map(
                          adaptToBusinessSection,
                        )}
                        title={name}
                      />
                    ))}

                <div className="flex justify-center py-10">
                  <Button
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    variant="outline"
                    className="border-[#9ACC23] text-[#9ACC23] hover:bg-[#9ACC23] hover:text-white"
                  >
                    {showAllCategories
                      ? "Show less"
                      : "Explore more businesses"}
                  </Button>
                </div>

                <section className="py-12 px-4 lg:px-16 bg-white">
                  <div className="flex flex-col lg:flex-row overflow-hidden rounded-2xl shadow-sm bg-[#0D7077] text-white">
                    <div className="relative w-full lg:w-1/2 h-80 lg:h-auto">
                      <Image
                        src="/images/backgroundImages/business/vendor.jpg"
                        alt="Vendor"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex flex-col justify-center w-full lg:w-1/2 p-8 lg:p-16 space-y-6">
                      <h2 className="text-3xl md:text-5xl font-medium">
                        Grow Your Business with Mefie
                      </h2>
                      <p className="text-lg opacity-90">
                        Join a network of vendors reaching new audiences through
                        Mefie.
                      </p>
                      <Button
                        onClick={handleClickEvent}
                        className="bg-[#93C01F] hover:bg-[#7ea919] w-fit"
                      >
                        Join as a vendor
                      </Button>
                    </div>
                  </div>
                </section>

                <div className="py-12 px-4 lg:px-16">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="font-semibold text-xl md:text-4xl">
                      Events
                    </h2>
                    <Link href="/events" className="text-[#275782] font-medium">
                      Explore all
                    </Link>
                  </div>
                  <EventSectionCarousel events={events} />
                </div>
              </>
            ) : (
              <BusinessSection
                businesses={filteredData.map(adaptToBusinessSection)}
                title={filteredData[0]?.category || "Filtered Results"}
              />
            )}
          </>
        ) : (
          <div className="py-16 text-center text-gray-500 font-medium">
            No businesses found in this category.
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 px-4 lg:px-16 pt-8">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-80 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
