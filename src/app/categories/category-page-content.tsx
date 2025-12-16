"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, MapPin } from "lucide-react"; // Removed Loader2
import ScrollableCategoryTabs from "@/components/scrollable-category-tabs";
import SearchHeader from "@/components/search-header";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  categories,
  categoryPageContent,
  categoryPageContentByMain,
  type ServiceProvider,
} from "@/lib/data";

// --- API Types ---
interface ApiImage {
  id?: number;
  media?: string;
  url?: string;
  media_type?: string;
}

interface ApiListing {
  id: number;
  name: string;
  slug: string;
  bio: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  primary_phone: string | null;
  email: string | null;
  website: string | null;
  images: (ApiImage | string)[];
  cover_image?: string;
  categories: Array<{ id: number; name: string; type: string }>;
  rating: number;
  ratings_count: number;
  status: string;
  created_at: string;
  title?: string;
  subtitle?: string;
  badge?: string;
}

interface ApiListingsResponse {
  data: ApiListing[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
  links: {
    next: string | null;
    prev: string | null;
  };
}

// --- EXTENDED ServiceProvider ---
type ExtendedServiceProvider = Omit<ServiceProvider, "title" | "badge"> & {
  title?: string;
  badge?: string;
};

// --- Utilities ---
const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/placeholder-listing.png";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
  return `${API_URL}/${url.replace(/^\//, "")}`;
};

const processImages = (
  images: (ApiImage | string)[],
  coverImage?: string
): string[] => {
  const rawImages = Array.isArray(images) ? images : [];

  const validImages = rawImages
    .filter((img: string | ApiImage) => {
      if (typeof img === "string") {
        return img.trim().length > 0;
      }
      if (img && typeof img === "object") {
        if (img.media) {
          const badStatuses = ["processing", "failed", "pending", "error"];
          return !badStatuses.includes(img.media);
        }
        if (img.url && img.url.trim().length > 0) {
          return true;
        }
      }
      return false;
    })
    .map((img: string | ApiImage) => {
      let mediaPath = "";
      if (typeof img === "string") {
        mediaPath = img;
      } else if (img && typeof img === "object") {
        mediaPath = img.media || img.url || "";
      }
      return getImageUrl(mediaPath);
    });

  if (validImages.length === 0 && coverImage) {
    validImages.push(getImageUrl(coverImage));
  }
  if (validImages.length === 0) {
    validImages.push("/images/placeholder-listing.png");
  }

  return validImages;
};

// --- Helper for Title Case ---
const toTitleCase = (str: string) => {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function CategoryPageContent() {
  const pathname = usePathname();

  // --- State ---
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [providersForMain, setProvidersForMain] = useState<
    ExtendedServiceProvider[]
  >([]);
  const [popularForSelection, setPopularForSelection] = useState<
    ExtendedServiceProvider[]
  >([]);
  const [dealsForSelection, setDealsForSelection] = useState<
    ExtendedServiceProvider[]
  >([]);
  const [isListingsLoading, setIsListingsLoading] = useState(false);
  const [visibleCountByMain, setVisibleCountByMain] = useState<
    Record<string, number>
  >({});

  // 1. Determine Active Main Category from URL
  const activeMainCategory = useMemo(() => {
    const segments = pathname?.split("/").filter(Boolean) ?? [];
    const categoriesIndex = segments.indexOf("categories");
    const candidate =
      categoriesIndex !== -1 ? segments[categoriesIndex + 1] : undefined;

    return candidate || "cultural-services";
  }, [pathname]);

  const [selectedSubcategoryByMain, setSelectedSubcategoryByMain] = useState<
    Record<string, string>
  >({});
  const selectedSubcategory =
    selectedSubcategoryByMain[activeMainCategory] ?? "all";
  const defaultVisibleCount = 12;
  const visibleCount =
    visibleCountByMain[activeMainCategory] ?? defaultVisibleCount;

  // --- 1. Fetch Categories Structure ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const response = await fetch(`${API_URL}/api/categories`, { headers });
        if (!response.ok) throw new Error("Failed to fetch categories");
        await response.json();
      } catch (error) {
        console.error("Category fetch error:", error);
      } finally {
        setIsCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // --- 2. Fetch Listings ---
  const fetchListings = useCallback(async () => {
    setIsListingsLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
      const categorySlugToFilter =
        selectedSubcategory === "all"
          ? activeMainCategory
          : selectedSubcategory;

      const query = new URLSearchParams({
        page: "1",
        category: categorySlugToFilter,
        per_page: "50",
      });

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/listings?${query}`, {
        headers,
      });

      if (!response.ok) throw new Error("Failed to fetch listings");
      const json: ApiListingsResponse = await response.json();

      const allListings: ExtendedServiceProvider[] = json.data.map((item) => {
        const validImages = processImages(item.images, item.cover_image);
        const primaryImage =
          validImages.length > 0
            ? validImages[0]
            : "/images/placeholder-listing.png";

        return {
          id: item.id.toString(),
          name: item.name,
          slug: item.slug,
          category: activeMainCategory,
          subcategory:
            selectedSubcategory === "all" ? undefined : selectedSubcategory,
          image: primaryImage,
          rating: item.rating || 0,
          reviews: String(item.ratings_count || 0),
          location: item.city
            ? `${item.city}, ${item.country}`
            : "Location not specified",
          verified: false,
          subtitle: item.bio
            ? item.bio.substring(0, 60) + "..."
            : "No description available",
          description: item.bio || "",
          phone: item.primary_phone || "",
          email: item.email || "",
          website: item.website || "",
          title: item.name,
          badge: item.badge,
        } as ExtendedServiceProvider;
      });

      setProvidersForMain(allListings);
      setPopularForSelection(
        allListings.filter((provider) => provider.rating >= 4).slice(0, 10)
      );
      setDealsForSelection(
        allListings
          .filter((provider) => provider.badge || provider.rating >= 3.5)
          .slice(0, 8)
      );
    } catch (error) {
      console.error("Listings fetch error:", error);
      toast.error("Failed to load listings");
      setProvidersForMain([]);
      setPopularForSelection([]);
      setDealsForSelection([]);
    } finally {
      setIsListingsLoading(false);
    }
  }, [activeMainCategory, selectedSubcategory]);

  useEffect(() => {
    if (activeMainCategory && selectedSubcategory) {
      fetchListings();
    }
  }, [fetchListings, activeMainCategory, selectedSubcategory]);

  // Dynamic Page Content (Titles/Descriptions)
  const pageContent = useMemo(() => {
    const mainContent = categoryPageContentByMain[activeMainCategory];

    if (mainContent) {
      const fallback = categoryPageContent;
      const base = mainContent.default ?? fallback;
      const subOverride = mainContent.subcategories?.[selectedSubcategory];

      return {
        heroTitle:
          subOverride?.heroTitle ?? base.heroTitle ?? fallback.heroTitle,
        heroDescription:
          subOverride?.heroDescription ??
          base.heroDescription ??
          fallback.heroDescription,
        cultureTitle:
          subOverride?.cultureTitle ??
          base.cultureTitle ??
          fallback.cultureTitle,
        cultureDescription:
          subOverride?.cultureDescription ??
          base.cultureDescription ??
          fallback.cultureDescription,
        dealsTitle:
          subOverride?.dealsTitle ?? base.dealsTitle ?? fallback.dealsTitle,
        dealsDescription:
          subOverride?.dealsDescription ??
          base.dealsDescription ??
          fallback.dealsDescription,
      };
    }

    const readableName = toTitleCase(activeMainCategory);
    return {
      heroTitle: `Best ${readableName} Services`,
      heroDescription: `Find the top-rated ${readableName} providers near you.`,
      cultureTitle: `Explore ${readableName}`,
      cultureDescription: `Discover diverse ${readableName} businesses tailored to your needs.`,
      dealsTitle: `${readableName} Deals`,
      dealsDescription: `Exclusive offers and promotions in ${readableName}.`,
    };
  }, [activeMainCategory, selectedSubcategory]);

  const filteredProviders = useMemo(
    () =>
      providersForMain
        .filter(
          (provider) =>
            selectedSubcategory === "all" ||
            provider.subcategory === selectedSubcategory
        )
        .map((provider) => ({
          categorySlug: activeMainCategory,
          provider,
        })),
    [providersForMain, selectedSubcategory, activeMainCategory]
  );

  const visibleProviders = filteredProviders.slice(0, visibleCount);
  const hasMore = filteredProviders.length > visibleCount;

  const handleSubcategoryChange = useCallback(
    (value: string) => {
      setSelectedSubcategoryByMain((prev) => ({
        ...prev,
        [activeMainCategory]: value,
      }));
      setVisibleCountByMain((prev) => ({
        ...prev,
        [activeMainCategory]: defaultVisibleCount,
      }));
    },
    [activeMainCategory, defaultVisibleCount]
  );

  const handleShowMore = useCallback(() => {
    setVisibleCountByMain((prev) => {
      const current = prev[activeMainCategory] ?? defaultVisibleCount;
      const nextCount = Math.min(current + 8, filteredProviders.length);
      return {
        ...prev,
        [activeMainCategory]: nextCount,
      };
    });
  }, [activeMainCategory, defaultVisibleCount, filteredProviders.length]);

  // Carousel controls
  const [popularRef, popularApi] = useEmblaCarousel({
    align: "center",
    loop: false,
    skipSnaps: true,
    dragFree: true,
  });
  const [canPrevPopular, setCanPrevPopular] = useState(false);
  const [canNextPopular, setCanNextPopular] = useState(false);

  const scrollPrevPopular = useCallback(
    () => popularApi?.scrollPrev(),
    [popularApi]
  );
  const scrollNextPopular = useCallback(
    () => popularApi?.scrollNext(),
    [popularApi]
  );

  useEffect(() => {
    if (!popularApi) return;
    const update = () => {
      setCanPrevPopular(popularApi.canScrollPrev());
      setCanNextPopular(popularApi.canScrollNext());
    };
    popularApi.on("select", update);
    popularApi.on("reInit", update);
    update();
    return () => {
      popularApi.off("select", update);
      popularApi.off("reInit", update);
    };
  }, [popularApi]);

  const [dealsRef, dealsApi] = useEmblaCarousel({
    align: "center",
    loop: false,
    skipSnaps: true,
    dragFree: true,
  });
  const [canPrevDeals, setCanPrevDeals] = useState(false);
  const [canNextDeals, setCanNextDeals] = useState(false);

  const scrollPrevDeals = useCallback(() => dealsApi?.scrollPrev(), [dealsApi]);
  const scrollNextDeals = useCallback(() => dealsApi?.scrollNext(), [dealsApi]);

  useEffect(() => {
    if (!dealsApi) return;
    const update = () => {
      setCanPrevDeals(dealsApi.canScrollPrev());
      setCanNextDeals(dealsApi.canScrollNext());
    };
    dealsApi.on("select", update);
    dealsApi.on("reInit", update);
    update();
    return () => {
      dealsApi.off("select", update);
      dealsApi.off("reInit", update);
    };
  }, [dealsApi]);

  // --- INITIAL LOADING SKELETON ---
  if (isCategoriesLoading) {
    return (
      <div className="min-h-screen pt-24 mx-auto px-4 lg:px-16 space-y-8">
        {/* Search Header Placeholder */}
        <div className="w-full h-12 rounded-full bg-gray-100 animate-pulse" />

        {/* Tabs Placeholder */}
        <div className="flex gap-2 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full" />
          ))}
        </div>

        {/* Hero Section Placeholder */}
        <div className="space-y-4 py-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />

          {/* Popular Carousel Placeholder */}
          <div className="flex gap-4 overflow-hidden mt-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2 shrink-0">
                <Skeleton className="h-32 w-32 rounded-full" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 mx-auto">
      {/* Search & Tabs */}
      <div>
        <Suspense fallback={<div className="h-20" />}>
          <SearchHeader context="discover" />
        </Suspense>

        <ScrollableCategoryTabs
          key={activeMainCategory}
          mainCategorySlug={activeMainCategory}
          defaultValue={selectedSubcategory}
          onChange={handleSubcategoryChange}
          containerClassName="pt-4 pb-1"
        />
      </div>

      {/* Most Popular Attire Stylists Section */}
      {popularForSelection.length > 0 && (
        <section className="py-12 px-4 lg:px-16">
          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {pageContent.heroTitle}
            </h2>
            <p className="text-gray-600 text-sm lg:text-base">
              {pageContent.heroDescription}
            </p>
          </div>

          {/* Horizontal Carousel with controls */}
          <div className="relative">
            {/* Side controls */}
            <div className="pointer-events-none absolute inset-y-0 -left-5 bottom-20 hidden lg:flex items-center z-10">
              <Button
                variant="outline"
                size="icon"
                onClick={scrollPrevPopular}
                disabled={!canPrevPopular}
                className="pointer-events-auto rounded-full bg-white/95 hover:bg-white shadow-md hover:shadow-lg border-[#E2E8F0] disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </Button>
            </div>
            <div className="pointer-events-none absolute inset-y-0 -right-5 bottom-20 hidden lg:flex items-center z-10">
              <Button
                variant="outline"
                size="icon"
                onClick={scrollNextPopular}
                disabled={!canNextPopular}
                className="pointer-events-auto rounded-full bg-white/95 hover:bg-white shadow-md hover:shadow-lg border-[#E2E8F0] disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5 text-[#275782]" />
              </Button>
            </div>
            <div className="overflow-hidden pb-2" ref={popularRef}>
              <div className="flex gap-6">
                {popularForSelection.map((stylist) => {
                  const categoryObj = categories.find(
                    (c) => c.slug === stylist.category
                  );

                  return (
                    <div
                      key={stylist.id}
                      className="flex-[0_0_50%] min-w-0 sm:flex-[0_0_calc(30%-0.70rem)] lg:flex-[0_0_calc(19%-0.70rem)]"
                    >
                      <Link
                        href={`/categories/${
                          categoryObj?.slug || stylist.category
                        }/${stylist.slug}`}
                        className="group block"
                      >
                        {/* Image Container */}
                        <div className="relative aspect-square rounded-full overflow-hidden mb-3 shadow-xs group-hover:scale-101 transition-transform">
                          <Image
                            src={stylist.image}
                            alt={stylist.name}
                            fill
                            className="object-cover"
                            unoptimized={true}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (
                                !target.src.includes("placeholder-listing.png")
                              ) {
                                target.src = "/images/placeholder-listing.png";
                              }
                            }}
                          />
                        </div>

                        {/* Text Content */}
                        <div className="text-left space-y-2">
                          <h3 className="font-semibold text-sm lg:text-base text-gray-900 line-clamp-2 mb-1">
                            {stylist.name}
                          </h3>
                          <p className="text-xs text-gray-600 mb-2">
                            {stylist.subtitle}
                          </p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(stylist.rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : i < stylist.rating
                                    ? "fill-yellow-400/50 text-yellow-400"
                                    : "fill-gray-200 text-gray-200"
                                }`}
                              />
                            ))}
                            <span className="text-sm text-gray-600 ml-1">
                              ({stylist.reviews})
                            </span>
                          </div>
                          {stylist.location && (
                            <div className="flex items-center justify-start gap-1 mt-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3" />
                              <span className="line-clamp-1">
                                {stylist.location}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 z-20">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#F8FAFC] text-[#64748A] text-xs font-medium border border-gray-200/50 mt-1">
                              {categoryObj?.name || stylist.category}
                            </span>
                            {stylist.verified && (
                              <Image
                                src="/images/icons/verify.svg"
                                alt="Verified"
                                width={20}
                                height={20}
                              />
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Culture in Every Detail Section */}
      <section className="py-12 px-4 lg:px-16 bg-white">
        <div className="mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            {pageContent.cultureTitle}
          </h2>
          <p className="text-gray-600 text-sm lg:text-base">
            {pageContent.cultureDescription}
          </p>
        </div>

        {/* --- REPLACED: Listing Grid Loading State with Skeletons --- */}
        {isListingsLoading && providersForMain.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Generate 8 Skeletons to mimic the grid */}
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                {/* Image Skeleton */}
                <Skeleton className="h-[217px] w-full rounded-2xl" />
                {/* Content Skeleton */}
                <div className="space-y-2 px-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {visibleProviders.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-500">
                  We&apos;re adding businesses for this subcategory soon. Check
                  back in a bit.
                </div>
              ) : (
                visibleProviders.map(({ categorySlug, provider }, index) => {
                  const category = categories.find(
                    (c) => c.slug === categorySlug
                  );

                  return (
                    <div
                      key={`${categorySlug}-${provider.id || index}`}
                      className="flex flex-col"
                    >
                      <Link
                        href={`/categories/${categorySlug}/${provider.slug}`}
                        className="group relative aspect-4/3 rounded-2xl overflow-hidden shadow-sm hover:shadow-sm transition-all mb-3"
                      >
                        <Image
                          src={provider.image}
                          alt={category?.name || categorySlug}
                          fill
                          className="object-cover h-[217px]"
                          unoptimized={true}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (
                              !target.src.includes("placeholder-listing.png")
                            ) {
                              target.src = "/images/placeholder-listing.png";
                            }
                          }}
                        />

                        {/* Category badge at bottom left */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#F8FAFC] text-[#64748A] text-xs font-medium">
                              {category?.name || categorySlug}
                            </span>
                            {provider.verified && (
                              <Image
                                src="/images/icons/verify.svg"
                                alt="Verified"
                                width={20}
                                height={20}
                              />
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* Content below image */}
                      <div className="px-0 space-y-1">
                        <h3 className="text-gray-900 font-semibold text-sm mb-1.5 line-clamp-2">
                          {provider.name}
                        </h3>
                        {/* Rating */}
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(provider.rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : i < provider.rating
                                  ? "fill-yellow-400/50 text-yellow-400"
                                  : "fill-gray-200 text-gray-200"
                              }`}
                            />
                          ))}
                          <span className="text-sm text-gray-600 ml-1">
                            ({provider.reviews})
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="line-clamp-1">
                            {provider.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-center py-10">
              <Button
                onClick={handleShowMore}
                disabled={!hasMore}
                className="px-4 py-3 border-2 bg-transparent border-[#9ACC23] text-[#9ACC23] disabled:opacity-50 rounded-md font-medium hover:bg-[#9ACC23] hover:text-white transition-colors"
              >
                {hasMore ? "Explore more businesses" : "No more businesses"}
              </Button>
            </div>
          </>
        )}
      </section>

      {/* Host Your Service on Mefie Banner */}
      <section>
        <div className="py-12 px-4 lg:px-16 bg-white">
          <div className="flex flex-col lg:flex-row overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="relative w-full lg:w-1/2 h-80 lg:h-auto">
              <Image
                src="/images/backgroundImages/business/vendor.jpg"
                alt="Vendor serving customer"
                fill
                className="object-cover"
                priority
                unoptimized={true}
              />
            </div>
            <div className="flex flex-col justify-center bg-black text-white w-full lg:w-1/2 p-8 lg:p-16 space-y-6">
              <h2 className="text-3xl md:text-5xl font-medium leading-tight">
                Host Your Service on Mefie
              </h2>
              <p className="text-base md:text-lg leading-relaxed">
                Share your talent, business, or event with a global audience.
                List your service today and connect with people who need what
                you offer.
              </p>
              <Button className="bg-(--accent-primary) hover:bg-[#93C956] text-white font-medium w-fit px-4 py-3 rounded-md cursor-pointer">
                List your business
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Best Deals Section */}
      {dealsForSelection.length > 0 && (
        <section className="py-12 px-4 lg:px-16 bg-white">
          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {pageContent.dealsTitle}
            </h2>
            <p className="text-gray-600 text-sm lg:text-base">
              {pageContent.dealsDescription}
            </p>
          </div>

          <div className="relative">
            {/* Side controls */}
            <div className="pointer-events-none absolute inset-y-0 -left-5 bottom-34 hidden lg:flex items-center pl-1 z-10">
              <Button
                variant="outline"
                size="icon"
                onClick={scrollPrevDeals}
                disabled={!canPrevDeals}
                className="pointer-events-auto rounded-full bg-white/95 hover:bg-white shadow-md hover:shadow-lg border-[#E2E8F0] disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </Button>
            </div>
            <div className="pointer-events-none absolute inset-y-0 -right-5 bottom-34 hidden lg:flex items-center pr-1 z-10">
              <Button
                variant="outline"
                size="icon"
                onClick={scrollNextDeals}
                disabled={!canNextDeals}
                className="pointer-events-auto rounded-full bg-white/95 hover:bg-white shadow-md hover:shadow-lg border-[#E2E8F0] disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5 text-[#275782]" />
              </Button>
            </div>
            <div className="overflow-hidden pb-2" ref={dealsRef}>
              <div className="flex gap-4">
                {dealsForSelection.length === 0 ? (
                  <div className="py-10 text-center text-gray-500 w-full">
                    No promotional deals for this subcategory yet.
                  </div>
                ) : (
                  dealsForSelection.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex-[0_0_85%] min-w-0 sm:flex-[0_0_calc(50%-0.5rem)] lg:flex-[0_0_calc(25%-0.75rem)]"
                    >
                      <Link
                        href={`/listing/${deal.slug}`}
                        className="group block"
                      >
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 shadow-xs group-hover:shadow-sm transition-shadow">
                          <Image
                            src={deal.image}
                            alt={deal.title || deal.name}
                            fill
                            className="object-cover group-hover:scale-103 transition-transform duration-300"
                            unoptimized={true}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (
                                !target.src.includes("placeholder-listing.png")
                              ) {
                                target.src = "/images/placeholder-listing.png";
                              }
                            }}
                          />
                          {deal.badge && (
                            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              {deal.badge}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-base lg:text-lg text-gray-900 line-clamp-2 mb-1">
                            {deal.title || deal.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {deal.subtitle}
                          </p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(deal.rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : i < deal.rating
                                    ? "fill-yellow-400/50 text-yellow-400"
                                    : "fill-gray-200 text-gray-200"
                                }`}
                              />
                            ))}
                            <span className="text-sm text-gray-600 ml-1">
                              ({deal.reviews})
                            </span>
                          </div>
                          {deal.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <MapPin className="w-4 h-4" />
                              <span className="line-clamp-1">
                                {deal.location}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
