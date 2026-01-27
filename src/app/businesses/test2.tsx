/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import ScrollableCategoryTabs, {
  CategoryTabItem,
} from "@/components/scrollable-category-tabs";
import SearchHeader from "@/components/search-header";
import BusinessSection from "@/components/business/business-section";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import EventSectionCarousel from "@/components/event-section-carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

// --- API Interfaces ---
interface ApiImage {
  id?: number;
  media: string;
  media_type?: string;
}

interface ApiCategory {
  id: number;
  name: string;
  slug: string;
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
  end_date?: string; // Added to match API
  date?: string;
  created_at?: string;
  is_verified?: boolean;
}

// Strictly Typed Business for Components
interface ProcessedBusiness {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string; // Changed to string to satisfy component props and fix TS2322
  images: string[];
  location: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  category: string;
  categorySlug: string; // Added for robust filtering
  type: "business" | "event" | "community";
  country: string;
  createdAt: Date;
}

// Interface for EventSectionCarousel
interface ProcessedEvent extends ProcessedBusiness {
  type: "event";
  title: string;
  startDate: string;
  endDate: string; 
  date: string;
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
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "TBA"
      : date.toLocaleDateString("en-US", {
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
    .toLowerCase();
  if (item.start_date || rawType === "event") return "event";
  if (rawType === "community") return "community";
  return "business";
};

export default function BusinessesContent() {
  const [businesses, setBusinesses] = useState<ProcessedBusiness[]>([]);
  const [events, setEvents] = useState<ProcessedEvent[]>([]);
  const [apiCategories, setApiCategories] = useState<CategoryTabItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAllCategories, setShowAllCategories] = useState(false);

  const handleClickEvent = () => {
    if (user) {
      router.push("/claim");
    } else {
      router.push("/auth/login?redirect=/claim");
    }
  };

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

        // Fetching Categories the same way as Listings
        const [listingsRes, categoriesRes] = await Promise.all([
          fetch(`${API_URL}/api/listings?per_page=100`, {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }),
          fetch(`${API_URL}/api/categories`, {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }),
        ]);

        if (!listingsRes.ok) throw new Error("Failed to fetch listings");
        if (!categoriesRes.ok) throw new Error("Failed to fetch categories");

        const listingsJson = await listingsRes.json();
        const categoriesJson = await categoriesRes.json();

        // 1. Process Categories
        const rawCats: ApiCategory[] = categoriesJson.data || categoriesJson.categories || [];
        const formattedCats: CategoryTabItem[] = [
          { label: "All", value: "all" },
          ...rawCats.map((c) => ({ label: c.name, value: c.slug })),
        ];
        setApiCategories(formattedCats);

        // 2. Process Listings
        const data: ApiListing[] = listingsJson.data || listingsJson.listings || [];

        const businessesList: ProcessedBusiness[] = [];
        const eventsList: ProcessedEvent[] = [];

        data.forEach((item) => {
          const rawImages = Array.isArray(item.images) ? item.images : [];

          const validImages = rawImages
            .filter((img): img is string | ApiImage => {
              if (typeof img === "string") return true;
              if (img && typeof img === "object" && "media" in img) {
                const badStatuses = ["processing", "failed", "pending", "error"];
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
            else if (item.cover_image) validImages.push(getImageUrl(item.cover_image));
            else validImages.push("/images/placeholders/generic.jpg");
          }

          const categoryName = item.categories?.[0]?.name || "General";
          const categorySlug = item.categories?.[0]?.slug || "general";
          const location = item.location || item.address || "Online";
          const listingType = classifyListing(item);

          const commonProps = {
            id: item.id.toString(),
            name: item.name,
            slug: item.slug,
            description: item.bio || item.description || "",
            image: validImages[0], // Explicitly string
            images: validImages,
            location: location,
            verified: item.is_verified || false,
            rating: Number(item.rating) || 0,
            reviewCount: Number(item.ratings_count) || 0,
            category: categoryName,
            categorySlug: categorySlug,
            type: listingType,
            country: item.country || "Ghana",
            createdAt: item.created_at ? new Date(item.created_at) : new Date(),
          };

          if (listingType === "event") {
            const eventDate = item.start_date || item.date || item.created_at;
            eventsList.push({
              ...commonProps,
              type: "event",
              title: item.name,
              startDate: formatDate(eventDate),
              endDate: formatDate(item.end_date || eventDate),
              date: formatDate(eventDate),
            });
          } else if (listingType === "business") {
            businessesList.push(commonProps);
          }
        });

        setBusinesses(businessesList);
        setEvents(eventsList);
      } catch (error) {
        console.error("Failed to fetch page data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Dynamic Grouping Logic ---
  const groupedBusinesses = useMemo(() => {
    return businesses.reduce(
      (acc, business) => {
        const catName = business.category;
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(business);
        return acc;
      },
      {} as Record<string, ProcessedBusiness[]>,
    );
  }, [businesses]);

  const availableCategoryNames = useMemo(
    () => Object.keys(groupedBusinesses),
    [groupedBusinesses],
  );

  const filteredData = useMemo(() => {
    if (selectedCategory === "all") return businesses;
    return businesses.filter((b) => b.categorySlug === selectedCategory);
  }, [businesses, selectedCategory]);

  const businessOnlyFilter = (items: ProcessedBusiness[]) =>
    items.filter((i) => i.type === "business") as any;

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="bg-gray-50 min-h-screen">
      <ScrollableCategoryTabs
        categories={apiCategories}
        defaultValue="all"
        onChange={setSelectedCategory}
        containerClassName="pt-4 pb-1"
      />

      <Suspense fallback={<div className="h-20" />}>
        <SearchHeader context="businesses" />
      </Suspense>

      {filteredData.length > 0 ? (
        <>
          {selectedCategory === "all" ? (
            <>
              <BusinessSection
                businesses={businessOnlyFilter(businesses.slice(0, 8))}
                title="Today's best deals just for you!"
              />

              {availableCategoryNames.slice(0, 3).map((name) => (
                <BusinessSection
                  key={name}
                  businesses={businessOnlyFilter(groupedBusinesses[name])}
                  title={name}
                />
              ))}

              {showAllCategories &&
                availableCategoryNames
                  .slice(3)
                  .map((name) => (
                    <BusinessSection
                      key={name}
                      businesses={businessOnlyFilter(groupedBusinesses[name])}
                      title={name}
                    />
                  ))}

              <div className="flex justify-center py-10">
                <Button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  variant="outline"
                  className="border-[#9ACC23] text-[#9ACC23] hover:bg-[#9ACC23] hover:text-white transition-all"
                >
                  {showAllCategories ? "Show less" : "Explore more businesses"}
                </Button>
              </div>

              <section className="py-12 px-4 lg:px-16 bg-white">
                <div className="flex flex-col lg:flex-row overflow-hidden rounded-2xl shadow-sm">
                  <div className="relative w-full lg:w-1/2 h-80 lg:h-auto">
                    <Image
                      src="/images/backgroundImages/business/vendor.jpg"
                      alt="Vendor"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-col justify-center bg-[#0D7077] text-white w-full lg:w-1/2 p-8 lg:p-16 space-y-6">
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
                  <h2 className="font-semibold text-xl md:text-4xl">Events</h2>
                  <Link href="/events" className="text-[#275782] font-medium">
                    Explore all
                  </Link>
                </div>
                <EventSectionCarousel events={events} />
              </div>

              <div className="py-12 px-4 lg:px-16">
                <div className="relative flex flex-col justify-center items-center text-center bg-[#152B40] text-white rounded-3xl h-[350px] overflow-hidden">
                  <h2 className="text-3xl md:text-5xl font-bold mb-4">
                    Ready to Grow Your Business?
                  </h2>
                  <Button
                    onClick={handleClickEvent}
                    className="bg-[#93C01F] hover:bg-[#7ea919]"
                  >
                    List your business today
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <BusinessSection
              businesses={businessOnlyFilter(filteredData)}
              title={
                apiCategories.find((c) => c.value === selectedCategory)
                  ?.label || "Filtered Results"
              }
            />
          )}
        </>
      ) : (
        <div className="py-16 text-center text-gray-500">
          No results found for this category.
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 px-4 lg:px-16 pt-8">
      <div className="flex gap-4 overflow-hidden">
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <Skeleton className="h-80 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    </div>
  );
}