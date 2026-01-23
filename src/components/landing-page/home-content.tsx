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
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";


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
  is_verified?: boolean;
}

// --- Helper: Robust URL Generator ---
const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/placeholders/generic.jpg";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const API_URL = process.env.API_URL || "https://me-fie.co.uk";
  return `${API_URL}/${url.replace(/^\//, "")}`;
};

// --- UPDATED: Aggressive Classifier Logic ---
const classifyListing = (
  item: ApiListing
): "business" | "event" | "community" => {
  // Get the raw type from item.type or item.listing_type
  const rawType = (item.type || item.listing_type || "")
    .toString()
    .trim()
    .toLowerCase();

  // 1. Check for events first (by date or explicit type)
  if (item.start_date || rawType === "event") {
    return "event";
  }

  // 2. Check for communities (only by type)
  if (rawType === "community") {
    return "community";
  }

  // 3. Default to business
  return "business";
};

export default function HomeContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [featuredCommunities, setFeaturedCommunities] = useState<Community[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  const handleClickEvent = () => {
    if (user) {
      // Authenticated -> Go to Claim Page
      router.push("/claim");
    } else {
      // Not Authenticated -> Go to Login, then redirect to Claim Page
      router.push("/auth/login?redirect=/claim");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const API_URL = process.env.API_URL || "https://me-fie.co.uk";

        // FIX: Added '?per_page=100' query param.
        // This requests 100 items instead of the default (usually 15).
        // This ensures we get enough Events and Communities to fill the carousel.
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
          // --- Image Logic ---
          const rawImages = Array.isArray(item.images) ? item.images : [];

          const validImages = rawImages
            .filter((img: string | ApiImage) => {
              if (typeof img === "string") return true;
              if (img && typeof img === "object" && img.media) {
                const badStatuses = [
                  "processing",
                  "failed",
                  "pending",
                  "error",
                ];
                return !badStatuses.includes(img.media);
              }
              return false;
            })
            .map((img: string | ApiImage) => {
              const mediaPath = typeof img === "string" ? img : img.media;
              return getImageUrl(mediaPath);
            });

          // Fallbacks
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

  // --- Skeletons (Implemented with ShadCN) ---

  // 1. Vertical Skeleton (For Businesses and Events)
  const CardSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col space-y-3 rounded-2xl border border-gray-100 bg-white overflow-hidden h-full"
        >
          {/* Image Placeholder */}
          <Skeleton className="h-[200px] w-full rounded-none" />
          <div className="p-4 space-y-3">
            {/* Badge */}
            <Skeleton className="h-5 w-20 rounded-full" />
            {/* Title */}
            <Skeleton className="h-6 w-3/4" />
            {/* Meta (Rating/Location) */}
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  // 2. Horizontal Skeleton (For Communities)
  const CommunitySkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-row h-[165px] w-full rounded-3xl border border-gray-100 bg-white overflow-hidden"
        >
          {/* Left Image */}
          <Skeleton className="h-full w-32 sm:w-48 rounded-none" />
          {/* Right Content */}
          <div className="flex flex-1 flex-col justify-center p-4 space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-32 rounded-md mt-1" />
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
          <CardSkeleton />
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
          <CardSkeleton />
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
            <Button onClick={handleClickEvent} className="bg-[#93C01F] hover:bg-[#7ea919] text-white font-medium w-fit px-4 py-3 rounded-md cursor-pointer">
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
                  <Button onClick={()=>router.push(`/communities/${item.slug}`)} className="hidden md:block bg-[#152B40] hover:bg-[#253754] text-white font-medium w-full rounded-md px-5 py-2">
                    View Community
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
        <div className="flex items-center justify-center mt-4">
          <Button
            onClick={() => router.push("/communities")}
            className="bg-transparent border border-[#93C01F] text-[#93C01F] hover:bg-[#93C01F] hover:text-white cursor-pointer"
          >
            Explore more communities
          </Button>
        </div>
      </div>

      <div className="py-12 px-4 lg:px-16">
        <Faqs />
      </div>

      {/* CTA */}
      <div className="py-12 px-4 lg:px-16">
        <div className="relative flex flex-col justify-center items-center text-center bg-[#152B40] text-white rounded-3xl overflow-hidden h-[350px] shadow-sm px-20 lg:px-0">
          {/* Background patterns */}
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

          {/* Text content */}
          <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            Ready to Grow Your Business?
          </h2>
          <p className="text-base md:text-lg font-normal text-gray-100 mb-6">
            Join thousands of African businesses already listed on Mefie
            Directory
          </p>

          {/* CTA button */}
          <Button onClick={handleClickEvent} className="bg-[#93C01F] hover:bg-[#7ca818] text-white font-medium text-base px-4 py-2 rounded-md transition-all duration-200">
            List your business today
          </Button>
        </div>
      </div>
    </div>
  );
}
