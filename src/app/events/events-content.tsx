"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import ScrollableCategoryTabs from "@/components/scrollable-category-tabs";
import SearchHeader from "@/components/search-header";
import { EventsCategory, communityCards } from "@/lib/data";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import EventSectionCarousel from "@/components/event-section-carousel";
import EventCarousel from "@/components/events/event-carousel";
import CommunitySectionCarousel from "@/components/community-section-carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";



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
  images: (ApiImage | string)[];
  cover_image?: string;
  image?: string;
  categories: ApiCategory[];
  bio?: string;
  description?: string;
  start_date?: string;
  date?: string; // Add check for 'date'
  created_at?: string; // Fallback
  is_verified?: boolean;
}

// --- Helper Functions ---
const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/placeholders/generic.jpg";
  if (url.startsWith("http")) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
  return `${API_URL}/${url.replace(/^\//, "")}`;
};

// Robust Date Formatter
const formatDateTime = (dateString?: string) => {
  if (!dateString) return "TBA"; 
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "TBA"; 

    // Use a shorter format for cards (e.g. "Dec 12, 2025")
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    console.error("Date formatting error:", error);
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
  
  // Logic: If it has a start_date, assume event
  if (item.start_date || rawType === "event") return "event";
  if (rawType === "community") return "community";
  return "business";
};

// --- Main Component ---
export default function EventsContent({
  categories,
}: {
  categories: EventsCategory[];
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [communities, setCommunities] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAllCategories, setShowAllCategories] = useState(false);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

        const response = await fetch(`${API_URL}/api/listings?per_page=100`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch listings");

        const json = await response.json();
        const data: ApiListing[] = json.data || json.listings || [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eventsList: any[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const communitiesList: any[] = [];

        data.forEach((item) => {
          // --- Robust Image Logic ---
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
                return !badStatuses.includes(img.media);
              }
              return false;
            })
            .map((img) => {
              const mediaPath = typeof img === "string" ? img : img.media;
              return getImageUrl(mediaPath);
            });

          if (validImages.length === 0) {
            if (item.image) validImages.push(getImageUrl(item.image));
            else if (item.cover_image)
              validImages.push(getImageUrl(item.cover_image));
            else validImages.push("/images/placeholders/generic.jpg");
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
            category: categoryName,
          };

          if (listingType === "event") {
            // FIX: Check multiple possible date fields
            const eventDate = item.start_date || item.date || item.created_at;
            const formattedDate = formatDateTime(eventDate);
            
            eventsList.push({
              ...commonProps,
              startDate: formattedDate,
              endDate: formattedDate, 
              price: "Free", 
            });
          } else if (listingType === "community") {
            communitiesList.push(commonProps);
          }
        });

        setEvents(eventsList);
        if (communitiesList.length > 0) {
          setCommunities(communitiesList);
        }
      } catch (error) {
        console.error("Failed to fetch events page data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter events based on selected category
  const filteredevents = useMemo(() => {
    if (selectedCategory === "all") {
      return events;
    }

    return events.filter((event) => {
      const normalizeString = (str: string) =>
        (str || "")
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/&/g, "")
          .replace(/'/g, "");

      const eventsCategory = normalizeString(event.category);
      const selectedCat = normalizeString(selectedCategory);

      return (
        eventsCategory === selectedCat ||
        eventsCategory.includes(selectedCat) ||
        selectedCat.includes(eventsCategory)
      );
    });
  }, [events, selectedCategory]);

  // Get events by specific category
  const getEventsByCategory = (category: string) => {
    return filteredevents.filter((e) =>
      e.category.toLowerCase().includes(category.toLowerCase())
    );
  };

  // Main categories to show initially
  const mainCategories = ["Online Events", "Comedy", "Theatre"];

  // Additional categories
  const additionalCategories = [
    "Concert",
    "Festival",
    "Art & Craft",
    "Food & Hospitality",
    "Fashion & Lifestyle",
  ];

  // Skeleton Loader
  if (isLoading) {
    return (
      <div className="space-y-8 px-4 lg:px-16 pt-8">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-32 rounded-full shrink-0" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-80 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Scrollable Category Tabs */}
      <div>
        <ScrollableCategoryTabs
          categories={categories}
          defaultValue="all"
          onChange={(value) => {
            setSelectedCategory(value);
            setShowAllCategories(false); 
          }}
          containerClassName="pt-4 pb-1"
        />
      </div>

      {/* Search and Filter Bar */}
      <div>
        <Suspense fallback={<div className="h-20" />}>
          <SearchHeader context="events" />
        </Suspense>
      </div>

      {/* Events content */}
      <div className="bg-gray-50">
        {filteredevents.length > 0 ? (
          <>
            {selectedCategory === "all" ? (
              // Show structured sections for "All" view
              <>
                {/* Top Best Deals Section */}
                <EventCarousel
                  events={filteredevents.slice(0, 8)}
                  title="Popular Events coming up"
                  showNavigation={true}
                />

                {/* Main Category Sections */}
                {mainCategories.map((category) => {
                  const categoryEvents = getEventsByCategory(category);
                  if (categoryEvents.length === 0) return null;

                  return (
                    <div key={category} className="py-12 px-4 lg:px-16">
                      <EventSectionCarousel
                        events={categoryEvents}
                        title={category}
                        showNavigation={true}
                      />
                    </div>
                  );
                })}

                {/* Additional Categories */}
                {showAllCategories && (
                  <>
                    {additionalCategories.map((category) => {
                      const categoryEvents = getEventsByCategory(category);
                      if (categoryEvents.length === 0) return null;

                      return (
                        <div key={category} className="py-12 px-4 lg:px-16">
                          <EventSectionCarousel
                            events={categoryEvents}
                            title={category}
                            showNavigation={true}
                          />
                        </div>
                      );
                    })}
                  </>
                )}
                {/* Explore more button */}
                <div className="flex justify-center py-10">
                  <Button
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    className="px-4 py-3 border-2 bg-transparent border-[#9ACC23] text-[#9ACC23] rounded-md font-medium hover:bg-[#9ACC23] hover:text-white transition-colors"
                  >
                    {showAllCategories
                      ? "Show less"
                      : "Explore more businesses"}
                  </Button>
                </div>

                {/* Ready to grow your business section */}
                <div className="py-12 px-4 lg:px-16 bg-white">
                  <div className="flex flex-col lg:flex-row overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="relative w-full lg:w-1/2 h-80 lg:h-auto">
                      <Image
                        src="/images/backgroundImages/business/vendor2.jpg"
                        alt="Vendor serving customer"
                        fill
                        className="object-cover"
                        unoptimized={true}
                        priority
                      />
                    </div>
                    <div className="flex flex-col justify-center bg-black text-white w-full lg:w-1/2 p-8 lg:p-16 space-y-6">
                      <h2 className="text-3xl md:text-5xl font-medium leading-tight">
                        List Your Events on Mefie
                      </h2>
                      <p className="text-base md:text-lg leading-relaxed">
                        Showcase your products and services to a wider audience.
                        Create a listing, reach new customers, and grow your
                        business within the global African community.
                      </p>
                      <Button onClick={()=>router.push("/become-a-vendor")} className="bg-[#93C01F] hover:bg-[#93C956] text-white font-medium w-fit px-4 py-3 rounded-md cursor-pointer">
                        List your event
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Communities section */}
                <div className="py-10 px-4 lg:px-16">
                  <div className="flex flex-row justify-between items-end md:items-center gap-3 mb-6">
                    <div className="flex flex-col space-y-2">
                      <h2 className="font-semibold text-xl md:text-4xl">
                        Communities
                      </h2>
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

                  <CommunitySectionCarousel
                    communities={
                      communities.length > 0 ? communities : communityCards
                    }
                  />
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
                      Join thousands of African businesses already listed on
                      Mefie Directory
                    </p>

                    {/* CTA button */}
                    <Button onClick={()=>router.push("/become-a-vendor")} className="bg-[#93C01F] hover:bg-[#93C956] text-white font-medium text-base px-4 py-2 rounded-md transition-all duration-200">
                      List your business today
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // Show filtered events in a single section
              <>
                <div className="py-12 px-4 lg:px-16">
                  <EventSectionCarousel
                    events={filteredevents}
                    title={
                      categories.find((c) => c.value === selectedCategory)
                        ?.label || "Filtered Events"
                    }
                    showNavigation={true}
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <div className="py-16 px-4 lg:px-16 text-center">
            <p className="text-gray-500 text-lg">No events found.</p>
          </div>
        )}
      </div>
    </>
  );
}