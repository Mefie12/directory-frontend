"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import ScrollableCategoryTabs from "@/components/scrollable-category-tabs";
import SearchHeader from "@/components/search-header";
import { BusinessCategory } from "@/lib/data";
import BusinessSection from "@/components/business/business-section";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import EventSectionCarousel from "@/components/event-section-carousel";
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
  city?: string;
  country?: string;
  status: string;
  images: (ApiImage | string)[];
  cover_image?: string;
  image?: string;
  categories: ApiCategory[];
  bio?: string;
  description?: string;
  start_date?: string;
  date?: string; // Check this too
  created_at?: string; // Fallback
  is_verified?: boolean;
}

// --- Extended Business Interface for UI ---
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
  reviewCount: number;
  category: string;
  type: string;
  country: string;
  createdAt: Date;
}

// --- Helper Functions ---
const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/placeholders/generic.jpg";
  if (url.startsWith("http")) return url;
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

  // If we have a start_date, assume event even if type is not explicit
  if (item.start_date || rawType === "event") return "event";
  if (rawType === "community") return "community";
  return "business";
};

// --- Main Component ---
export default function BusinessesContent({
  categories,
}: {
  categories: BusinessCategory[];
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [businesses, setBusinesses] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = useState<any[]>([]);
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

        const businessesList: ProcessedBusiness[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eventsList: any[] = [];

        data.forEach((item) => {
          // Robust Image Logic
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
            slug: item.slug,
            description: item.bio || item.description || "",
            image: validImages[0],
            images: validImages,
            location: location,
            verified: item.is_verified || false,
            rating: Number(item.rating) || 0,
            reviewCount: Number(item.ratings_count) || 0,
            category: categoryName,
            type: listingType,
            country: item.country || "Ghana",
            createdAt: item.created_at ? new Date(item.created_at) : new Date(),
          };

          if (listingType === "event") {
            // FIX: Check multiple date fields
            const eventDate = item.start_date || item.date || item.created_at;

            eventsList.push({
              ...commonProps,
              title: item.name,
              // Use robust formatter
              startDate: formatDate(eventDate),
              endDate: formatDate(eventDate),
            });
          } else if (listingType === "business") {
            businessesList.push(commonProps);
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
  }, []);

  // --- Filtering Logic ---
  const filteredBusinesses = useMemo(() => {
    if (selectedCategory === "all") {
      return businesses;
    }

    return businesses.filter((business) => {
      const normalizeString = (str: string) =>
        (str || "")
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/&/g, "")
          .replace(/'/g, "");

      const businessCategory = normalizeString(business.category);
      const selectedCat = normalizeString(selectedCategory);

      return (
        businessCategory === selectedCat ||
        businessCategory.includes(selectedCat) ||
        selectedCat.includes(businessCategory)
      );
    });
  }, [businesses, selectedCategory]);

  const getBusinessesByCategory = (category: string) => {
    return filteredBusinesses.filter(
      (b) => b.category.toLowerCase() === category.toLowerCase()
    );
  };

  const mainCategories = ["Clothing", "Jewellery", "Art & Crafts"];

  const additionalCategories = [
    "Caterer",
    "Dancers",
    "Cultural Attire Stylist",
    "Drummers & Cultural Performers",
    "Toys & Games",
    "Books & Magazines",
  ];

  if (isLoading) {
    return (
      <div className="space-y-8 px-4 lg:px-16 pt-8">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-32 rounded-full shrink-0" />
          ))}
        </div>
        <Skeleton className="h-14 w-full rounded-xl" />
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

      <div>
        <Suspense fallback={<div className="h-20" />}>
          <SearchHeader context="businesses" />
        </Suspense>
      </div>

      <div className="bg-gray-50">
        {filteredBusinesses.length > 0 ? (
          <>
            {selectedCategory === "all" ? (
              <>
                <BusinessSection
                  businesses={filteredBusinesses.slice(0, 8)}
                  title="Today's best deals just for you!"
                  showNavigation={true}
                />

                {mainCategories.map((category) => {
                  const categoryBusinesses = getBusinessesByCategory(category);
                  if (categoryBusinesses.length === 0) return null;

                  return (
                    <BusinessSection
                      key={category}
                      businesses={categoryBusinesses}
                      title={category}
                      showNavigation={true}
                    />
                  );
                })}

                {showAllCategories && (
                  <>
                    {additionalCategories.map((category) => {
                      const categoryBusinesses =
                        getBusinessesByCategory(category);
                      if (categoryBusinesses.length === 0) return null;

                      return (
                        <BusinessSection
                          key={category}
                          businesses={categoryBusinesses}
                          title={category}
                          showNavigation={true}
                        />
                      );
                    })}
                  </>
                )}

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

                <div className="py-12 px-4 lg:px-16 bg-white">
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
                        Join a network of vendors and service providers reaching
                        new audiences through Mefie. Showcase your products,
                        connect with customers, and expand your business in a
                        thriving digital marketplace.
                      </p>
                      <Button onClick={()=>router.push("/become-a-vendor")} className="bg-[#93C01F] hover:bg-[#7ea919] text-white font-medium w-fit px-4 py-3 rounded-md cursor-pointer">
                        Join as a vendor
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="py-12 px-4 lg:px-16">
                  <div className="flex flex-row justify-between items-end md:items-center gap-3 mb-8">
                    <div className="flex flex-col space-y-2">
                      <h2 className="font-semibold text-xl md:text-4xl">
                        Events
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
                    <Button onClick={()=>router.push("/become-a-vendor")} className="bg-[#93C01F] hover:bg-[#7ea919] text-white font-medium text-base px-4 py-2 rounded-md transition-all duration-200">
                      List your business today
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <BusinessSection
                  businesses={filteredBusinesses}
                  title={
                    categories.find((c) => c.value === selectedCategory)
                      ?.label || "Filtered Businesses"
                  }
                  showNavigation={true}
                />
              </>
            )}
          </>
        ) : (
          <div className="py-16 px-4 lg:px-16 text-center">
            <p className="text-gray-500 text-lg">No businesses found.</p>
          </div>
        )}
      </div>
    </>
  );
}
