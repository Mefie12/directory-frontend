"use client";
import { useState, useMemo, useEffect } from "react";
import HeroSlider from "@/components/landing-page/hero-slider";
import { Sort, SortOption } from "@/components/sort";
import { BusinessCarousel } from "@/components/landing-page/business-carousel";
import { DirectoryEventCarousel } from "@/components/landing-page/directory-event-carousel";
import Image from "next/image";
import Link from "next/link";
import { categories } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Faqs } from "@/components/landing-page/faqs";
import { BusinessCard } from "../business-card";
import { EventCard } from "@/components/event-card";

// Types
export type Business = (typeof BusinessCard)["prototype"]["props"]["business"];
export type Event = (typeof EventCard)["prototype"]["props"]["event"];

export interface Community {
  id: string;
  title: string;
  description: string;
  image: string;
  slug: string;
}

// --- API Interfaces ---
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
  listing_type?: string;
  rating: string | number;
  ratings_count: string | number;
  location?: string;
  address?: string;
  status: string;
  // UPDATE: Explicitly allow mixed arrays or specific arrays
  images: (ApiImage | string)[];
  cover_image?: string;
  categories: ApiCategory[];
  bio?: string;
  description?: string;
  start_date?: string;
  is_verified?: boolean;
}

// --- Helper ---
const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/placeholders/generic.jpg";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const API_URL = "https://me-fie.co.uk";
  return `${API_URL}/${url.replace(/^\//, "")}`;
};

// --- Classifier Logic ---
const classifyListing = (
  item: ApiListing
): "business" | "event" | "community" => {
  const rawType = (item.type || item.listing_type || "")
    .toString()
    .trim()
    .toLowerCase();
  const categoryName = item.categories?.[0]?.name || "";
  const normalizedCategory = categoryName.toLowerCase();

  if (rawType === "community") return "community";
  if (rawType === "event") return "event";
  if (rawType === "business") return "business";

  if (
    rawType.includes("community") ||
    normalizedCategory.includes("community") ||
    normalizedCategory.includes("support group")
  ) {
    return "community";
  }

  if (
    rawType.includes("event") ||
    normalizedCategory.includes("event") ||
    !!item.start_date
  ) {
    return "event";
  }

  return "business";
};

export default function HomeContent() {
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [featuredCommunities, setFeaturedCommunities] = useState<Community[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const API_URL = "https://me-fie.co.uk";

        const response = await fetch(`${API_URL}/api/listings`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const json = await response.json();
        const data: ApiListing[] = json.data || json.listings || [];

        const businesses: Business[] = [];
        const events: Event[] = [];
        const communities: Community[] = [];

        data.forEach((item) => {
          // A. Extract the array safely
          const rawImages = Array.isArray(item.images) ? item.images : [];

          // B. Filter and Map with Strict Types
          const validImages = rawImages
            .filter((img: string | ApiImage) => {
              // 1. Handle String
              if (typeof img === "string") return true;

              // 2. Handle Object (ApiImage)
              if (!img || typeof img !== "object" || !img.media) return false;

              const badStatuses = ["processing", "failed", "pending", "error"];
              return !badStatuses.includes(img.media);
            })
            .map((img: string | ApiImage) => {
              // Extract string path based on type
              const mediaPath = typeof img === "string" ? img : img.media;
              return getImageUrl(mediaPath);
            });

          // C. Fallback logic
          if (validImages.length === 0 && item.cover_image) {
            validImages.push(getImageUrl(item.cover_image));
          }
          if (validImages.length === 0) {
            validImages.push("/images/placeholders/generic.jpg");
          }

          const categoryName = item.categories?.[0]?.name || "General";
          const location = item.location || item.address || "Online";
          const listingType = classifyListing(item);

          // --- Distribute Data ---
          if (listingType === "community") {
            communities.push({
              id: item.id.toString(),
              title: item.name,
              description:
                item.bio || item.description || "Join our supportive network.",
              image: validImages[0],
              slug: item.slug,
            });
          } else if (listingType === "event") {
            events.push({
              id: item.id.toString(),
              name: item.name,
              slug: item.slug,
              category: categoryName,
              startDate: item.start_date
                ? new Date(item.start_date).toDateString()
                : new Date().toDateString(),
              endDate: item.start_date
                ? new Date(item.start_date).toDateString()
                : new Date().toDateString(),
              location: location,
              image: validImages[0],
              description: item.description || item.bio || "",
              verified: item.is_verified || false,
              price: "Free",
            } as unknown as Event);
          } else {
            businesses.push({
              id: item.id.toString(),
              name: item.name,
              slug: item.slug,
              images: validImages,
              category: categoryName,
              rating: Number(item.rating) || 0,
              reviewCount: Number(item.ratings_count) || 0,
              location: location,
              verified: item.status === "active" || item.status === "published",
            } as Business);
          }
        });

        setFeaturedBusinesses(businesses);
        setUpcomingEvents(events);
        setFeaturedCommunities(communities);
      } catch (error) {
        console.error("Failed to fetch home data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const sortedCategories = useMemo(() => {
    const sorted = [...categories];
    switch (sortBy) {
      case "name-asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case "newest":
        return sorted.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
      case "oldest":
        return sorted.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
      case "popular":
        return sorted.sort((a, b) => b.popularity - a.popularity);
      default:
        return sorted;
    }
  }, [sortBy]);

  // Skeletons
  const BusinessSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden bg-white shadow-sm h-80 animate-pulse border border-gray-100"
        >
          <div className="h-[180px] bg-gray-200 w-full" />
          <div className="p-4 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  const EventSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden bg-white shadow-sm h-80 animate-pulse border border-gray-100"
        >
          <div className="h-[180px] bg-gray-200 w-full" />
          <div className="p-4 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );

  const CommunitySkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="flex flex-row bg-gray-50 rounded-3xl h-[180px] animate-pulse border border-gray-100"
        >
          <div className="w-32 sm:w-48 bg-gray-200 rounded-l-3xl h-full" />
          <div className="flex-1 p-6 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="overflow-x-hidden">
      <HeroSlider />

      {/* Explore by Category */}
      <div className="py-12 px-4 lg:px-16">
        <div className="flex flex-row justify-between items-center md:items-center gap-3 mb-8">
          <div className="flex flex-col space-y-2">
            <h2 className="font-semibold text-xl md:text-4xl">
              Explore by Category
            </h2>
            <p className="font-normal text-sm md:text-base">
              Find exactly what you&apos;re looking for
            </p>
          </div>
          <div>
            <Sort value={sortBy} onChange={setSortBy} />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedCategories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group relative overflow-hidden rounded-2xl w-[173px] h-[114px] md:w-[310px] md:h-[204px] aspect-4/3 hover:shadow-xl transition-all duration-300 mx-auto"
            >
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent z-10" />
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover group-hover:scale-110 transition-transform duration-300"
                unoptimized={true}
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                <h3 className="text-white font-medium text-base md:text-xl">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Businesses */}
      <div className="py-12 px-4 lg:py-20 lg:px-16">
        <div className="flex flex-row justify-between items-end md:items-center gap-3 mb-8">
          <div className="flex flex-col space-y-2">
            <h2 className="font-semibold text-xl md:text-4xl">
              Featured Businesses
            </h2>
            <p className="font-normal text-sm md:text-base">
              Discover top-rated businesses near you
            </p>
          </div>
          <Link href="/businesses" className="text-[#275782] font-medium">
            Explore all
          </Link>
        </div>

        {isLoading ? (
          <BusinessSkeleton />
        ) : featuredBusinesses.length > 0 ? (
          <BusinessCarousel businesses={featuredBusinesses} />
        ) : (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p>No featured businesses found.</p>
          </div>
        )}
      </div>

      {/* Upcoming Events */}
      <div className="py-12 px-4 lg:py-20 lg:px-16">
        <div className="flex flex-row justify-between items-end md:items-center gap-3 mb-8">
          <div className="flex flex-col space-y-2">
            <h2 className="font-semibold text-xl md:text-4xl">
              Upcoming Events
            </h2>
            <p className="font-normal text-sm md:text-base">
              Don&apos;t miss these amazing cultural events
            </p>
          </div>
          <Link href="/events" className="text-[#275782] font-medium">
            Explore all
          </Link>
        </div>

        {isLoading ? (
          <EventSkeleton />
        ) : upcomingEvents.length > 0 ? (
          <DirectoryEventCarousel events={upcomingEvents} />
        ) : (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p>No upcoming events found.</p>
          </div>
        )}
      </div>

      {/* Vendor Section */}
      <div className="py-12 px-4 lg:px-16">
        <div className="flex flex-col lg:flex-row overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="relative w-full lg:w-1/2 h-80 lg:h-auto">
            <Image
              src="/images/backgroundImages/business/vendor.jpg"
              alt="Vendor"
              fill
              className="object-cover"
              unoptimized={true}
            />
          </div>
          <div className="flex flex-col justify-center bg-[#0D7077] text-white w-full lg:w-1/2 p-8 lg:p-16 space-y-6">
            <h2 className="text-3xl md:text-5xl font-medium leading-tight">
              Grow Your Business with Mefie
            </h2>
            <p className="text-base md:text-lg leading-relaxed">
              Join a network of vendors reaching new audiences.
            </p>
            <Button className="bg-[#93C01F] hover:bg-[#7ea919] text-white font-medium w-fit px-4 py-3 rounded-md cursor-pointer">
              Join as a vendor
            </Button>
          </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="py-12 px-4 lg:px-16">
        <div className="flex flex-row justify-between items-center md:items-center gap-3 mb-10">
          <div className="flex flex-col space-y-2">
            <h2 className="font-semibold text-xl md:text-4xl">
              Community you can explore
            </h2>
            <p className="font-normal text-sm md:text-base">
              Join supportive network that celebrates african heritage
            </p>
          </div>
        </div>

        {isLoading ? (
          <CommunitySkeleton />
        ) : featuredCommunities.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-6">
            {featuredCommunities.map((item) => (
              <div
                key={item.id}
                className="flex flex-row bg-white rounded-3xl shadow-sm border overflow-hidden h-full min-h-[165px]"
              >
                <div className="relative w-32 sm:w-48 h-auto p-3 shrink-0">
                  <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                      unoptimized={true}
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-center mt-1.5 p-1 md:p-3 flex-1">
                  <h4 className="text-lg md:text-2xl font-semibold text-gray-900 mb-2 md:mb-3 line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-sm md:text-base text-gray-500 mb-2 md:mb-5 font-normal line-clamp-2">
                    {item.description}
                  </p>
                  <Button className="hidden md:block bg-[#152B40] hover:bg-[#253754] text-white font-medium w-full rounded-md px-5 py-2">
                    Join Community
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p>No communities found.</p>
          </div>
        )}
      </div>

      <div className="py-12 px-4 lg:px-16">
        <Faqs />
      </div>
    </div>
  );
}
