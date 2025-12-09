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
  status?: string;
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

interface ApiResponse {
  data?: ApiListing[];
  listings?: ApiListing[];
  current_page?: number;
  last_page?: number;
  total?: number;
  per_page?: number;
  next_page_url?: string | null;
}

const API_URL = "https://me-fie.co.uk";

// --- FIXED: Robust URL Generator ---
const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/placeholders/generic.jpg";
  
  // Already a full URL
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  
  // Remove leading slash and construct full URL
  const cleanPath = url.replace(/^\/+/, "");
  return `${API_URL}/${cleanPath}`;
};

// --- FIXED: Image Processing Logic (Access by Array Index) ---
const processListingImages = (item: ApiListing): string[] => {
  const validImages: string[] = [];
  
  // Process images array - Backend stores them as indexed array
  if (Array.isArray(item.images) && item.images.length > 0) {
    // Access images by index: images[0], images[1], images[2], images[3], images[4]
    for (let i = 0; i < item.images.length; i++) {
      const img = item.images[i];
      
      if (typeof img === "string") {
        // Simple string URL
        if (img.trim()) {
          validImages.push(getImageUrl(img));
        }
      } else if (img && typeof img === "object" && img.media) {
        // Object with media property
        const status = (img.status || "").toLowerCase();
        const invalidStatuses = ["processing", "failed", "pending", "error"];
        
        if (!invalidStatuses.includes(status) && img.media.trim()) {
          validImages.push(getImageUrl(img.media));
        }
      }
    }
  }
  
  // Fallback to cover_image if no valid images
  if (validImages.length === 0 && item.cover_image) {
    validImages.push(getImageUrl(item.cover_image));
  }
  
  // Final fallback to placeholder
  if (validImages.length === 0) {
    validImages.push("/images/placeholders/generic.jpg");
  }
  
  return validImages;
};

// --- UPDATED: Improved Classifier Logic ---
const classifyListing = (
  item: ApiListing
): "business" | "event" | "community" => {
  // Check both type fields
  const type = (item.type || "").toString().trim().toLowerCase();
  const listingType = (item.listing_type || "").toString().trim().toLowerCase();
  
  // Combine both for checking
  const combinedType = `${type} ${listingType}`.toLowerCase();

  console.log(`🔍 Classifying "${item.name}": type="${type}", listing_type="${listingType}", has_start_date=${!!item.start_date}`);

  // 1. Events - check for start_date or explicit event type
  // Check for variations: "event", "events", or if start_date exists
  if (
    item.start_date ||
    type === "event" ||
    type === "events" ||
    listingType === "event" ||
    listingType === "events" ||
    combinedType.includes("event")
  ) {
    console.log(`   ✅ Classified as EVENT`);
    return "event";
  }

  // 2. Communities - check for explicit community type
  // Check for variations: "community", "communities"
  if (
    type === "community" ||
    type === "communities" ||
    listingType === "community" ||
    listingType === "communities" ||
    combinedType.includes("community")
  ) {
    console.log(`   ✅ Classified as COMMUNITY`);
    return "community";
  }

  // 3. Default to business
  console.log(`   ✅ Classified as BUSINESS (default)`);
  return "business";
};

// --- NEW: Fetch ALL listings with pagination ---
const fetchAllListings = async (): Promise<ApiListing[]> => {
  const allListings: ApiListing[] = [];
  const currentPage = 1;
  let lastPage = 1;

  try {
    // Fetch first page to get total pages
    const firstResponse = await fetch(
      `${API_URL}/api/listings?per_page=100&page=1`,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!firstResponse.ok) {
      throw new Error(`HTTP error! status: ${firstResponse.status}`);
    }

    const firstJson: ApiResponse = await firstResponse.json();
    
    // Debug: Log the full API response structure
    console.log("🔍 API Response Structure:", {
      has_data: !!firstJson.data,
      has_listings: !!firstJson.listings,
      data_length: firstJson.data?.length,
      listings_length: firstJson.listings?.length,
      keys: Object.keys(firstJson)
    });
    
    const firstPageData = firstJson.data || firstJson.listings || [];
    
    allListings.push(...firstPageData);
    
    // Get pagination info
    lastPage = firstJson.last_page || 1;
    const total = firstJson.total || firstPageData.length;
    
    console.log(`📄 Page 1/${lastPage} fetched: ${firstPageData.length} listings`);
    console.log(`📊 Pagination Info:`, {
      current_page: firstJson.current_page,
      last_page: firstJson.last_page,
      total: firstJson.total,
      per_page: firstJson.per_page,
      has_more_pages: lastPage > 1
    });

    // Fetch remaining pages if any
    if (lastPage > 1) {
      const fetchPromises = [];
      
      for (let page = 2; page <= lastPage; page++) {
        fetchPromises.push(
          fetch(`${API_URL}/api/listings?per_page=100&page=${page}`, {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            cache: "no-store",
          })
        );
      }

      // Fetch all pages in parallel
      const responses = await Promise.all(fetchPromises);
      
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        if (response.ok) {
          const json: ApiResponse = await response.json();
          const pageData = json.data || json.listings || [];
          allListings.push(...pageData);
          console.log(`📄 Page ${i + 2}/${lastPage} fetched: ${pageData.length} listings`);
        }
      }
    }

    console.log(`✅ Total listings fetched across all pages: ${allListings.length}`);
    return allListings;
    
  } catch (error) {
    console.error("❌ Error fetching listings:", error);
    return [];
  }
};

export default function HomeContent() {
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [featuredCommunities, setFeaturedCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // FIXED: Fetch ALL listings across all pages
        const data = await fetchAllListings();

        const businesses: Business[] = [];
        const events: Event[] = [];
        const communities: Community[] = [];

        data.forEach((item) => {
          // FIXED: Use new image processing function that accesses by array index
          const validImages = processListingImages(item);
          
          const categoryName = item.categories?.[0]?.name || "General";
          const location = item.location || item.address || "Online";
          const listingType = classifyListing(item);

          // Enhanced debugging - show ALL relevant fields
          console.log(`📦 Processing "${item.name}":`, {
            classifiedAs: listingType,
            type: item.type,
            listing_type: item.listing_type,
            start_date: item.start_date,
            status: item.status,
            id: item.id
          });

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

        console.log(`
🎯 FINAL RESULTS:
   - Businesses: ${businesses.length}
   - Events: ${events.length}
   - Communities: ${communities.length}
   - TOTAL: ${businesses.length + events.length + communities.length}
        `);

        // Debug: Log the actual items by category
        console.log("📋 BUSINESSES:", businesses.map(b => b.name));
        console.log("📅 EVENTS:", events.map(e => e.name));
        console.log("👥 COMMUNITIES:", communities.map(c => c.title));

        setFeaturedBusinesses(businesses);
        setUpcomingEvents(events);
        setFeaturedCommunities(communities);
      } catch (error) {
        console.error("❌ Failed to fetch home data:", error);
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

  // --- Skeletons ---
  const CardSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col space-y-3 rounded-2xl border border-gray-100 bg-white overflow-hidden h-full"
        >
          <Skeleton className="h-[200px] w-full rounded-none" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  const CommunitySkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-row h-[165px] w-full rounded-3xl border border-gray-100 bg-white overflow-hidden"
        >
          <Skeleton className="h-full w-32 sm:w-48 rounded-none" />
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

          <Button className="bg-[#93C01F] hover:bg-[#7ca818] text-white font-medium text-base px-4 py-2 rounded-md transition-all duration-200">
            List your business today
          </Button>
        </div>
      </div>
    </div>
  );
}