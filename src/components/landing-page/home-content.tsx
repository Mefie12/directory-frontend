"use client";
import { useState, useMemo, useEffect } from "react";
import HeroSlider from "@/components/landing-page/hero-slider";
import { EventCard } from "@/components/event-card";
import { Sort, SortOption } from "@/components/sort";
import { BusinessCarousel } from "@/components/landing-page/business-carousel";
import { DirectoryEventCarousel } from "@/components/landing-page/directory-event-carousel";
import Image from "next/image";
import Link from "next/link";
import { categories } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Faqs } from "@/components/landing-page/faqs";
import { BusinessCard } from "../business-card";

// Use the Business type from BusinessCard component
export type Business = (typeof BusinessCard)["prototype"]["props"]["business"];

// Use the Event type from EventCard component
export type Event = (typeof EventCard)["prototype"]["props"]["event"];

export interface Community {
  id: string;
  title: string;
  description: string;
  image: string;
  slug: string;
}

// --- Interfaces for API Data ---
interface ApiImage {
  media: string;
}

interface ApiCategory {
  name: string;
}

interface ApiListing {
  id: number;
  name: string;
  slug: string;
  type: string;
  rating: string | number;
  ratings_count: string | number;
  location?: string;
  address?: string;
  status: string;
  images: ApiImage[];
  cover_image?: string;
  categories: ApiCategory[];
  bio?: string;
  description?: string;
  start_date?: string;
  is_verified?: boolean;
}

// Helper to construct image URL safely
const getImageUrl = (url: string | undefined | null): string => {
  if (!url || typeof url !== "string")
    return "/images/placeholders/generic.jpg";
  if (url.startsWith("http")) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
  return `${API_URL}/${url.replace(/^\//, "")}`;
};

export default function HomeContent() {
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [featuredCommunities, setFeaturedCommunities] = useState<Community[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH DATA ---
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

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        const data: ApiListing[] = json.data || json.listings || [];

        const businesses: Business[] = [];
        const events: Event[] = [];
        const communities: Community[] = [];

        data.forEach((item) => {
          let coverImage = "/images/placeholders/generic.jpg";
          if (item.images && item.images.length > 0) {
            const validImg = item.images.find(
              (img) =>
                img.media && !["processing", "failed"].includes(img.media)
            );
            if (validImg) coverImage = getImageUrl(validImg.media);
          } else if (item.cover_image) {
            coverImage = getImageUrl(item.cover_image);
          }

          const categoryName = item.categories?.[0]?.name || "General";
          const location = item.location || item.address || "Online";

          const type = (item.type || "business")
            .toString()
            .trim()
            .toLowerCase();

          const isCommunity =
            type.includes("community") ||
            categoryName.toLowerCase().includes("community") ||
            item.name.toLowerCase().includes("community");

          if (isCommunity) {
            communities.push({
              id: item.id.toString(),
              title: item.name,
              description:
                item.bio || item.description || "Join our supportive network.",
              image: coverImage,
              slug: item.slug,
            });
          } else if (type.includes("event")) {
            events.push({
              id: item.id.toString(),
              name: item.name,
              slug: item.slug,
              category: categoryName,
              // --- CRITICAL FIX START ---
              // Converted Date objects to strings using .toDateString()
              startDate: item.start_date
                ? new Date(item.start_date).toDateString()
                : new Date().toDateString(),
              endDate: item.start_date
                ? new Date(item.start_date).toDateString()
                : new Date().toDateString(),
              // --- CRITICAL FIX END ---
              location: location,
              image: coverImage,
              description: item.description || item.bio || "",
              verified: item.is_verified || false,
              price: "Free",
            } as unknown as Event); // Added 'unknown' cast to force fit if Event type definition is stubborn
          } else {
            businesses.push({
              id: item.id.toString(),
              name: item.name,
              slug: item.slug,
              image: coverImage,
              category: categoryName,
              rating: Number(item.rating) || 0,
              reviewCount: Number(item.ratings_count) || 0,
              location: location,
              verified: item.status === "active" || item.status === "published",
              openStatus: "Open Now",
            });
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

  // Skeleton loading component
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
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="flex gap-2 mt-2">
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-20" />
            </div>
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
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="flex justify-between mt-2">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
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
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-8 bg-gray-200 rounded w-32 mt-4" />
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
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-110 transition-transform duration-300"
                unoptimized={true}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes("generic.jpg")) {
                    target.src = "/images/placeholders/generic.jpg";
                  }
                }}
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

        {/* Business Section */}
        {isLoading ? (
          <BusinessSkeleton />
        ) : featuredBusinesses.length > 0 ? (
          <BusinessCarousel businesses={featuredBusinesses} />
        ) : (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p>No featured businesses found at the moment.</p>
            <Button className="mt-4 bg-[#93C01F] hover:bg-[#7ea919] text-white">
              Explore All Businesses
            </Button>
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

        {/* Events Section */}
        {isLoading ? (
          <EventSkeleton />
        ) : upcomingEvents.length > 0 ? (
          <DirectoryEventCarousel events={upcomingEvents} />
        ) : (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p>No upcoming events found.</p>
            <Button className="mt-4 bg-[#93C01F] hover:bg-[#7ea919] text-white">
              Explore All Events
            </Button>
          </div>
        )}
      </div>

      {/* Ready to grow your business section (Static) */}
      <div className="py-12 px-4 lg:px-16">
        <div className="flex flex-col lg:flex-row overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="relative w-full lg:w-1/2 h-80 lg:h-auto">
            <Image
              src="/images/backgroundImages/business/vendor.jpg"
              alt="Vendor"
              fill
              className="object-cover"
              priority
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

        {/* Community Section */}
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
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      unoptimized={true}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes("generic.jpg")) {
                          target.src = "/images/placeholders/generic.jpg";
                        }
                      }}
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
            <Button className="mt-4 bg-[#93C01F] hover:bg-[#7ea919] text-white">
              Explore All Communities
            </Button>
          </div>
        )}

        <Button className="flex justify-center bg-[#93C01F] hover:bg-[#7ea919] text-white font-medium w-full md:w-fit px-4 py-3 rounded-md cursor-pointer mx-auto mt-5">
          Explore more communities
        </Button>
      </div>

      {/* FAQs & CTA (Static) */}
      <div className="py-12 px-4 lg:px-16">
        <div className="flex flex-row justify-center items-center gap-3 mb-8">
          <div className="text-center space-y-2">
            <h2 className="font-semibold text-xl md:text-4xl capitalize">
              Frequently Asked Questions{" "}
              <span className="text-[#93C01F]">(FAQs)</span>
            </h2>
            <p className="font-normal text-sm md:text-base max-w-5xl">
              Common questions to help vendors and customers.
            </p>
          </div>
        </div>
        <Faqs />
      </div>

      <div className="py-12 px-4 lg:px-16">
        <div className="relative flex flex-col justify-center items-center text-center bg-[#152B40] text-white rounded-3xl overflow-hidden h-[350px] shadow-sm px-20 lg:px-0">
          <div className="absolute -left-32 lg:-left-6 lg:-bottom-20">
            <Image
              src="/images/backgroundImages/bg-pattern.svg"
              alt="pattern"
              width={320}
              height={320}
              className="object-contain h-[150px] lg:h-[400px]"
              priority
              unoptimized={true}
            />
          </div>
          <div className="hidden lg:block absolute bottom-20 lg:-bottom-20 -right-24 lg:right-0">
            <Image
              src="/images/backgroundImages/bg-pattern-1.svg"
              alt="pattern"
              width={320}
              height={320}
              className="object-contain"
              priority
              unoptimized={true}
            />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            Ready to Grow Your Business?
          </h2>
          <p className="text-base md:text-lg font-normal text-gray-100 mb-6">
            Join thousands of African businesses on Mefie Directory
          </p>
          <Button className="bg-[#93C01F] hover:bg-[#7ea919] text-white font-medium text-base px-4 py-2 rounded-md transition-all">
            List your business today
          </Button>
        </div>
      </div>
    </div>
  );
}
