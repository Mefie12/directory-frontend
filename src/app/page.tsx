"use client";
import { useState, useMemo } from "react";
import HeroSlider from "@/components/landing-page/hero-slider";
import { Sort, SortOption } from "@/components/sort";
import { BusinessCarousel } from "@/components/landing-page/business-carousel";
import { EventCarousel } from "@/components/landing-page/event-carousel";
import Image from "next/image";
import Link from "next/link";
import { categories, Events, featuredBusinesses } from "@/lib/data";

export default function Home() {
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

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

  return (
    <div>
      <HeroSlider />

      {/* Explore by Category */}
      <div className="py-16 px-4 lg:px-16 mt-6">
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

        {/* Category Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedCategories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group relative overflow-hidden rounded-2xl w-[173px] h-[114px] md:w-[310px] md:h-[204px] aspect-4/3 hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent z-10" />
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-110 transition-transform duration-300"
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
      <div className="py-16 px-4 lg:py-20 lg:px-16 mt-6">
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

        {/* Businesses Carousel */}
        <BusinessCarousel businesses={featuredBusinesses} />
      </div>

      {/* Upcoming Events */}
      <div className="py-16 px-4 lg:py-20 lg:px-16 mt-6">
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

        {/* Businesses Carousel */}
        <EventCarousel events={Events} />
      </div>
    </div>
  );
}
