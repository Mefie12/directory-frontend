"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, MapPin } from "lucide-react";
import ScrollableCategoryTabs from "@/components/scrollable-category-tabs";
import SearchHeader from "@/components/search-header";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { usePathname } from "next/navigation";
import {
  categories,
  popularStylists,
  categoryServiceProviders,
  bestDeals,
  categoryPageContent,
  categoryPageContentByMain,
  categorySubcategories,
  type ServiceProvider,
} from "@/lib/data";

export default function CategoryPageContent() {
  const pathname = usePathname();

  // Figure out which top-level category page we're on (fallback to the first one)
  const mainCategoryKeys = useMemo(
    () => Object.keys(categoryServiceProviders),
    []
  );
  const defaultMainCategory =
    (mainCategoryKeys.includes("cultural-services")
      ? "cultural-services"
      : mainCategoryKeys[0]) ?? "cultural-services";
  const activeMainCategory = useMemo(() => {
    const segments = pathname?.split("/").filter(Boolean) ?? [];
    const categoriesIndex = segments.indexOf("categories");
    const candidate =
      categoriesIndex !== -1 ? segments[categoriesIndex + 1] : undefined;

    if (candidate && candidate in categoryServiceProviders) {
      return candidate;
    }

    return defaultMainCategory;
  }, [pathname, defaultMainCategory]);

  // Track selected subcategory + pagination per main category so state is preserved when you navigate back
  const [selectedSubcategoryByMain, setSelectedSubcategoryByMain] = useState<
    Record<string, string>
  >({});
  const [visibleCountByMain, setVisibleCountByMain] = useState<
    Record<string, number>
  >({});
  const selectedSubcategory =
    selectedSubcategoryByMain[activeMainCategory] ?? "all";
  const defaultVisibleCount = 12;
  const visibleCount =
    visibleCountByMain[activeMainCategory] ?? defaultVisibleCount;

  const subcategoryTabs = useMemo(
    () =>
      categorySubcategories[activeMainCategory] ?? [
        { label: "All", value: "all" },
      ],
    [activeMainCategory]
  );

  const providersForMain = useMemo(
    () => categoryServiceProviders[activeMainCategory] ?? [],
    [activeMainCategory]
  );

  // Quick lookup for headings/descriptions based on the selection
  const pageContent = useMemo(() => {
    const fallback = categoryPageContent;
    const mainContent = categoryPageContentByMain[activeMainCategory];
    const base = mainContent?.default ?? fallback;
    const subOverride = mainContent?.subcategories?.[selectedSubcategory];

    return {
      heroTitle: subOverride?.heroTitle ?? base.heroTitle ?? fallback.heroTitle,
      heroDescription:
        subOverride?.heroDescription ??
        base.heroDescription ??
        fallback.heroDescription,
      cultureTitle:
        subOverride?.cultureTitle ?? base.cultureTitle ?? fallback.cultureTitle,
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
  }, [activeMainCategory, selectedSubcategory]);

  // Filter providers for the active main category by the chosen subcategory
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

  const popularForSelection = useMemo(
    () =>
      popularStylists.filter((provider) => {
        if (provider.category !== activeMainCategory) {
          return false;
        }

        if (selectedSubcategory === "all") {
          return true;
        }

        if (!provider.subcategory) {
          return true;
        }

        return provider.subcategory === selectedSubcategory;
      }),
    [activeMainCategory, selectedSubcategory]
  );

  const dealsForSelection = useMemo(
    () =>
      bestDeals.filter((deal) => {
        if (deal.category !== activeMainCategory) {
          return false;
        }

        if (selectedSubcategory === "all") {
          return true;
        }

        if (!deal.subcategory) {
          return true;
        }

        return deal.subcategory === selectedSubcategory;
      }),
    [activeMainCategory, selectedSubcategory]
  );

  // Keep tabs and pagination in sync when the subcategory pill changes
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

  const visibleProviders = filteredProviders.slice(0, visibleCount);
  const hasMore = filteredProviders.length > visibleCount;

  // Carousel controls - Popular section
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

  // Carousel controls - Deals section
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
  return (
    <div className="min-h-screen pt-20 mx-auto">
      {/* Scrollable Category Tabs */}
      <div>
        <ScrollableCategoryTabs
          key={activeMainCategory}
          categories={subcategoryTabs}
          defaultValue={selectedSubcategory}
          onChange={handleSubcategoryChange}
          containerClassName="pt-4 pb-1"
        />
        <Suspense fallback={<div className="h-20" />}>
          <SearchHeader context="discover" />
        </Suspense>
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

          {/* Horizontal Carousel with controls (matches business card scroll) */}
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
                {popularForSelection.map((stylist: ServiceProvider) => (
                  <div
                    key={stylist.id}
                    className="flex-[0_0_50%] min-w-0 sm:flex-[0_0_calc(30%-0.70rem)] lg:flex-[0_0_calc(19%-0.70rem)]"
                  >
                    <Link
                      href={`/listing/${stylist.slug}`}
                      className="group block"
                    >
                      <div className="relative aspect-square rounded-full overflow-hidden mb-3 shadow-xs group-hover:scale-101 transition-transform">
                        <Image
                          src={stylist.image}
                          alt={stylist.name}
                          fill
                          className="object-cover"
                        />
                      </div>
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
                    </Link>
                  </div>
                ))}
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

        {/* Grid of Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {visibleProviders.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500">
              We’re adding businesses for this subcategory soon. Check back in a
              bit.
            </div>
          ) : (
            visibleProviders.map(({ categorySlug, provider }, index) => {
              const category = categories.find((c) => c.slug === categorySlug);

              return (
                <div
                  key={`${categorySlug}-${provider.id || index}`}
                  className="flex flex-col"
                >
                  <Link
                    href={`/categories/${categorySlug}`}
                    className="group relative aspect-4/3 rounded-2xl overflow-hidden shadow-sm hover:shadow-sm transition-all mb-3"
                  >
                    <Image
                      src={provider.image}
                      alt={category?.name || categorySlug}
                      fill
                      className="object-cover h-[217px]"
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
                      <span className="line-clamp-1">{provider.location}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Explore All Categories Button */}
        {/* Explore more or less button */}
        <div className="flex justify-center py-10">
          <Button
            onClick={handleShowMore}
            disabled={!hasMore}
            className="px-4 py-3 border-2 bg-transparent border-[#9ACC23] text-[#9ACC23] disabled:opacity-50 rounded-md font-medium hover:bg-[#9ACC23] hover:text-white transition-colors"
          >
            {hasMore ? "Explore more businesses" : "No more businesses"}
          </Button>
        </div>
      </section>

      {/* Host Your Service on Mefie Banner */}
      <section>
        <div className="py-12 px-4 lg:px-16 bg-white">
          <div className="flex flex-col lg:flex-row overflow-hidden rounded-2xl bg-white shadow-sm">
            {/* Left: Image */}
            <div className="relative w-full lg:w-1/2 h-[320px] lg:h-auto">
              <Image
                src="/images/backgroundImages/business/vendor.jpg"
                alt="Vendor serving customer"
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Right: Text Content */}
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
      <section className="py-12 px-4 lg:px-16 bg-white">
        <div className="mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            {pageContent.dealsTitle}
          </h2>
          <p className="text-gray-600 text-sm lg:text-base">
            {pageContent.dealsDescription}
          </p>
        </div>

        {/* Horizontal Carousel for Deals */}
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
                          alt={deal.title}
                          fill
                          className="object-cover group-hover:scale-103 transition-transform duration-300"
                        />
                        {deal.badge && (
                          <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            {deal.badge}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-base lg:text-lg text-gray-900 line-clamp-2 mb-1">
                          {deal.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {deal.subtitle}
                        </p>
                        <div className="flex items-center gap-1 text-sm mb-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{deal.rating}</span>
                          <span className="text-gray-500">
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
    </div>
  );
}
