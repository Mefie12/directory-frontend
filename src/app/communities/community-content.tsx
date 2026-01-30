/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import ScrollableCategoryTabs, { CategoryTabItem } from "@/components/scrollable-category-tabs";
import SearchHeader from "@/components/search-header";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import CommunityCarousel from "@/components/communities/community-carousel";
import BusinessSectionCarousel from "@/components/business-section-carousel";
import EventSectionCarousel from "@/components/event-section-carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

// --- API & Processed Interfaces ---
interface ApiImage {
  id?: number;
  media: string;
  media_type?: string;
}

interface ApiCategory {
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
  date?: string;
  created_at?: string;
  is_verified?: boolean;
}

// Unified Community Interface for the Carousel
interface ProcessedCommunity {
  id: string;
  name: string;
  title: string;
  slug: string;
  description: string;
  image: string; // Used by CommunityCard
  imageUrl: string; // Mapping for compatibility
  images: string[];
  location: string;
  verified: boolean;
  category: string;
  categorySlug: string;
  tag: string;
  type: "community";
}

// --- Helpers ---
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
    return isNaN(date.getTime()) ? "TBA" : date.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch { return "TBA"; }
};

const classifyListing = (item: ApiListing): "business" | "event" | "community" => {
  const rawType = (item.type || item.listing_type || "").toString().trim().toLowerCase();
  if (item.start_date || rawType === "event") return "event";
  if (rawType === "community") return "community";
  return "business";
};

export default function CommunityContent() {
  const [communities, setCommunities] = useState<ProcessedCommunity[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [, setApiCategories] = useState<CategoryTabItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAllCategories, setShowAllCategories] = useState(false);

  const handleClickEvent = () => {
   if(user){
      router.push("/claim");
    } else {
      router.push("/auth/login?redirect=/claim");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

        const [listingsRes, categoriesRes] = await Promise.all([
          fetch(`${API_URL}/api/approved_listings?per_page=100`),
          fetch(`${API_URL}/api/categories`)
        ]);

        if (!listingsRes.ok) throw new Error("Failed to fetch listings");
        const listingsJson = await listingsRes.json();
        const data: ApiListing[] = listingsJson.data || listingsJson.listings || [];

        // 1. Process Categories for the Tabs
        if (categoriesRes.ok) {
          const categoriesJson = await categoriesRes.json();
          const rawCats: ApiCategory[] = categoriesJson.data || [];
          setApiCategories([
            { label: "All", value: "all" },
            ...rawCats.map(c => ({ label: c.name, value: c.slug }))
          ]);
        }

        const communitiesList: ProcessedCommunity[] = [];
        const businessesList: any[] = [];
        const eventsList: any[] = [];

        data.forEach((item) => {
          const rawImages = Array.isArray(item.images) ? item.images : [];
          const validImages = rawImages
            .filter(img => typeof img === "string" || (img && typeof img === "object" && !["processing", "failed"].includes((img as ApiImage).media)))
            .map(img => getImageUrl(typeof img === "string" ? img : (img as ApiImage).media));

          if (validImages.length === 0) validImages.push(getImageUrl(item.image || item.cover_image));

          const category = item.categories?.[0];
          const listingType = classifyListing(item);

          const commonProps = {
            id: item.id.toString(),
            name: item.name,
            title: item.name,
            slug: item.slug,
            description: item.bio || item.description || "",
            image: validImages[0],
            imageUrl: validImages[0],
            images: validImages,
            location: item.location || item.address || "Online",
            verified: item.is_verified || false,
            category: category?.name || "General",
            categorySlug: category?.slug || "general",
            tag: category?.name || "General",
            country: item.country || "Ghana",
          };

          if (listingType === "community") {
            communitiesList.push({ ...commonProps, type: "community" });
          } else if (listingType === "business") {
            businessesList.push({ ...commonProps, rating: Number(item.rating) || 0, reviewCount: Number(item.ratings_count) || 0 });
          } else if (listingType === "event") {
            const eventDate = item.start_date || item.date || item.created_at;
            const formattedDate = formatDateTime(eventDate);
            eventsList.push({ ...commonProps, startDate: formattedDate, endDate: formattedDate, date: formattedDate, reviewCount: Number(item.ratings_count) || 0 });
          }
        });

        setCommunities(communitiesList);
        setBusinesses(businessesList);
        setEvents(eventsList);
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Dynamic Grouping Logic ---
  const groupedCommunities = useMemo(() => {
    return communities.reduce((acc, community) => {
      const tagName = community.tag;
      if (!acc[tagName]) acc[tagName] = [];
      acc[tagName].push(community);
      return acc;
    }, {} as Record<string, ProcessedCommunity[]>);
  }, [communities]);

  const availableTags = useMemo(() => Object.keys(groupedCommunities), [groupedCommunities]);

  const filteredCommunities = useMemo(() => {
    if (selectedCategory === "all") return communities;
    return communities.filter((c) => c.categorySlug === selectedCategory);
  }, [communities, selectedCategory]);

  if (isLoading) return <LoadingSkeleton />;

  return (
    <>
      <ScrollableCategoryTabs
        mainCategorySlug="communities"
        defaultValue="all"
        onChange={setSelectedCategory}
        containerClassName="pt-4 pb-1"
      />

      <Suspense fallback={<div className="h-20" />}>
        <SearchHeader context="communities" />
      </Suspense>

      <div className="bg-gray-50">
        {filteredCommunities.length > 0 ? (
          <>
            {selectedCategory === "all" ? (
              <>
                {/* Hero Carousel */}
                <CommunityCarousel
                  communities={communities.slice(0, 9)}
                  title="Community Impact"
                />

                {/* Dynamic Category Sections (First 2 tags) */}
                {availableTags.slice(0, 2).map((tag) => (
                  <CommunityCarousel
                    key={tag}
                    communities={groupedCommunities[tag]}
                    title={tag}
                  />
                ))}

                {/* Expanded Dynamic Sections */}
                {showAllCategories && availableTags.slice(2).map((tag) => (
                  <CommunityCarousel
                    key={tag}
                    communities={groupedCommunities[tag]}
                    title={tag}
                  />
                ))}

                <div className="flex justify-center py-10">
                  <Button
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    variant="outline"
                    className="border-[#9ACC23] text-[#9ACC23] hover:bg-[#9ACC23] hover:text-white transition-all"
                  >
                    {showAllCategories ? "Show less" : "Explore more communities"}
                  </Button>
                </div>

                {/* Host Banner */}
                <section className="py-12 px-4 lg:px-16 bg-white">
                  <div className="flex flex-col lg:flex-row overflow-hidden rounded-2xl shadow-sm">
                    <div className="relative w-full lg:w-1/2 h-80 lg:h-auto">
                      <Image src="/images/backgroundImages/community/students.jpg" alt="Banner" fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex flex-col justify-center bg-black text-white w-full lg:w-1/2 p-8 lg:p-16 space-y-6">
                      <h2 className="text-3xl md:text-5xl font-medium">Host your Community on Mefie</h2>
                      <p className="text-lg opacity-90">Bring your community initiatives to a wider audience and grow movements that create lasting change.</p>
                      <Button onClick={handleClickEvent} className="bg-[#93C01F] hover:bg-[#7ea919] w-fit">List your Community</Button>
                    </div>
                  </div>
                </section>

                {/* Cross-Pollination Sections */}
                <div className="py-12 px-4 lg:px-16">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="font-semibold text-2xl md:text-4xl">Best deals for you!</h2>
                    <Link href="/businesses" className="text-[#275782] font-medium">Explore all</Link>
                  </div>
                  <BusinessSectionCarousel businesses={businesses} />
                </div>

                <div className="py-12 px-4 lg:px-16">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="font-semibold text-2xl md:text-4xl">Spotlight Events</h2>
                    <Link href="/events" className="text-[#275782] font-medium">Explore all</Link>
                  </div>
                  <EventSectionCarousel events={events} />
                </div>

                {/* Footer CTA */}
                <div className="py-12 px-4 lg:px-16">
                  <div className="relative flex flex-col justify-center items-center text-center bg-[#152B40] text-white rounded-3xl h-[350px] overflow-hidden">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to Grow Your Business?</h2>
                    <Button onClick={handleClickEvent} className="bg-[#93C01F] hover:bg-[#7ea919]">List your business today</Button>
                  </div>
                </div>
              </>
            ) : (
              <CommunityCarousel
                communities={filteredCommunities}
                title={`${filteredCommunities[0].category} Communities`}
              />
            )}
          </>
        ) : (
          <div className="py-16 text-center text-gray-500">No communities found in this category.</div>
        )}
      </div>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 px-4 lg:px-16 pt-8">
      <div className="flex gap-4 overflow-hidden">
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}