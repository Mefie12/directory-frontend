"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import ScrollableCategoryTabs from "@/components/scrollable-category-tabs";
import SearchHeader from "@/components/search-header";
import { CommunityCategory } from "@/lib/data"; // Keep category types/data
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import CommunityCarousel from "@/components/communities/community-carousel";
import BusinessSectionCarousel from "@/components/business-section-carousel";
import EventSectionCarousel from "@/components/event-section-carousel";
import { Skeleton } from "@/components/ui/skeleton";

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
const formatDate = (dateString?: string) => {
  if (!dateString) return "TBA";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "TBA";
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
  if (item.start_date || rawType === "event") return "event";
  if (rawType === "community") return "community";
  return "business";
};

// --- Main Component ---
export default function CommunityContent({
  categories,
}: {
  categories: CommunityCategory[];
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [communities, setCommunities] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [businesses, setBusinesses] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        const communitiesList: any[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const businessesList: any[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eventsList: any[] = [];

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
            tag: categoryName,
          };

          if (listingType === "community") {
            communitiesList.push({
              ...commonProps,
              imageUrl: validImages[0],
            });
          } else if (listingType === "business") {
            businessesList.push({
              ...commonProps,
              rating: Number(item.rating) || 0,
              reviewCount: Number(item.ratings_count) || 0,
            });
          } else if (listingType === "event") {
            // FIX: Check multiple possible date fields
            const eventDate = item.start_date || item.date || item.created_at;
            const formattedDate = formatDate(eventDate);

            eventsList.push({
              ...commonProps,
              startDate: formattedDate,
              endDate: formattedDate,
            });
          }
        });

        setCommunities(communitiesList);
        setBusinesses(businessesList);
        setEvents(eventsList);
      } catch (error) {
        console.error("Failed to fetch community page data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Filtering Logic ---
  const filteredCommunities = useMemo(() => {
    if (selectedCategory === "all") {
      return communities;
    }

    return communities.filter((community) => {
      const normalizeString = (str: string) =>
        (str || "")
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/&/g, "")
          .replace(/'/g, "");

      const communityTag = normalizeString(community.tag);
      const selectedCat = normalizeString(selectedCategory);

      return (
        communityTag === selectedCat ||
        communityTag.includes(selectedCat) ||
        selectedCat.includes(communityTag)
      );
    });
  }, [communities, selectedCategory]);

  const getCommunitiesByTag = (tag: string) => {
    return filteredCommunities.filter((c) =>
      c.tag.toLowerCase().includes(tag.toLowerCase())
    );
  };

  const mainTags = ["Mental Health"];

  const additionalTags = [
    "Community Interest",
    "School Groups",
    "Professional Groups",
    "Community Support",
    "Charities",
    "Sports Groups",
    "Hometown Groups",
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-3xl" />
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
          <SearchHeader context="communities" />
        </Suspense>
      </div>

      {/* Communities content */}
      <div className="bg-gray-50">
        {filteredCommunities.length > 0 ? (
          <>
            {selectedCategory === "all" ? (
              <>
                {/* Top Featured Communities Section */}
                <CommunityCarousel
                  communities={filteredCommunities.slice(0, 9)}
                  title="Community Impact"
                  showNavigation={true}
                />

                {/* Main Tag Sections */}
                {mainTags.map((tag) => {
                  const tagCommunities = getCommunitiesByTag(tag);
                  if (tagCommunities.length === 0) return null;

                  return (
                    <div key={tag}>
                      <CommunityCarousel
                        communities={tagCommunities}
                        title={tag}
                        showNavigation={true}
                      />
                    </div>
                  );
                })}

                {/* Additional Tags (shown after expand) */}
                {showAllCategories && (
                  <>
                    {additionalTags.map((tag) => {
                      const tagCommunities = getCommunitiesByTag(tag);
                      if (tagCommunities.length === 0) return null;

                      return (
                        <div key={tag}>
                          <CommunityCarousel
                            communities={tagCommunities}
                            title={tag}
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
                      : "Explore more communities"}
                  </Button>
                </div>

                {/* Join community section */}
                <div className="py-12 px-4 lg:px-16 bg-white">
                  <div className="flex flex-col lg:flex-row overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="relative w-full lg:w-1/2 h-80 lg:h-auto">
                      <Image
                        src="/images/backgroundImages/community/students.jpg"
                        alt="Community gathering"
                        fill
                        className="object-cover"
                        unoptimized={true}
                        priority
                      />
                    </div>
                    <div className="flex flex-col justify-center bg-black text-white w-full lg:w-1/2 p-8 lg:p-16 space-y-6">
                      <h2 className="text-3xl md:text-5xl font-medium leading-tight">
                        Host your Community or social impact on Mefie
                      </h2>
                      <p className="text-base md:text-lg leading-relaxed">
                        Bring your community initiatives and social impact
                        projects to a wider audience. Share your mission,
                        connect with supporters, and grow movements that create
                        lasting change.
                      </p>
                      <Button className="bg-[#93C01F] hover:bg-[#7ea919] text-white font-medium w-fit px-4 py-3 rounded-md cursor-pointer">
                        List your Community
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Business section */}
                <div className="py-12 px-4 lg:px-16">
                  <div className="flex flex-row justify-between items-end md:items-center gap-3 mb-8">
                    <div className="flex flex-col space-y-2">
                      <h2 className="font-semibold text-xl md:text-4xl">
                        Best deals for you!
                      </h2>
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

                  <BusinessSectionCarousel businesses={businesses} />
                </div>

                {/* Events section */}
                <div className="py-12 px-4 lg:px-16">
                  <div className="flex flex-row justify-between items-end md:items-center gap-3 mb-8">
                    <div className="flex flex-col space-y-2">
                      <h2 className="font-semibold text-xl md:text-4xl">
                        Spotlight Events
                      </h2>
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
                  <EventSectionCarousel events={events} />
                </div>

                {/* CTA */}
                <div className="py-12 px-4 lg:px-16">
                  <div className="relative flex flex-col justify-center items-center text-center bg-[#152B40] text-white rounded-3xl overflow-hidden h-[350px] shadow-sm px-20 lg:px-0">
                    <div className="absolute -left-32 lg:-left-6 lg:-bottom-20">
                      <Image
                        src="/images/backgroundImages/bg-pattern.svg"
                        alt="pattern"
                        width={320}
                        height={320}
                        className="object-contain h-[150px] lg:h-[400px]"
                      />
                    </div>
                    <div className="hidden lg:block absolute bottom-20 lg:-bottom-20 -right-24 lg:right-0">
                      <Image
                        src="/images/backgroundImages/bg-pattern-1.svg"
                        alt="pattern"
                        width={320}
                        height={320}
                        className="object-contain"
                      />
                    </div>
                    <div className="block lg:hidden absolute bottom-16 -right-32">
                      <Image
                        src="/images/backgroundImages/mobile-pattern.svg"
                        alt="pattern"
                        width={320}
                        height={320}
                        className="object-contain h-[120px]"
                      />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
                      Ready to Grow Your Business?
                    </h2>
                    <p className="text-base md:text-lg font-normal text-gray-100 mb-6">
                      Join thousands of African businesses already listed on
                      Mefie Directory
                    </p>
                    <Button className="bg-[#93C01F] hover:bg-[#7ea919] text-white font-medium text-base px-4 py-2 rounded-md transition-all duration-200">
                      List your business today
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // Filtered View
              <>
                <div className="py-12 px-4 lg:px-16">
                  <CommunityCarousel
                    communities={filteredCommunities}
                    title={
                      categories.find((c) => c.value === selectedCategory)
                        ?.label || "Filtered Communities"
                    }
                    showNavigation={true}
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <div className="py-16 px-4 lg:px-16 text-center">
            <p className="text-gray-500 text-lg">
              No communities found in this category.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
