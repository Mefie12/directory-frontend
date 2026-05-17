"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star, Bookmark } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useBookmark } from "@/context/bookmark-context";
import { cn } from "@/lib/utils";
import type { CuratedCollection, CuratedCollectionListing } from "@/types/curated-collections";

// ─── Card ─────────────────────────────────────────────────────────────────────

function EditorialListingCard({ listing }: { listing: CuratedCollectionListing }) {
  const { isBookmarked, toggleBookmark } = useBookmark();
  const isActive = isBookmarked(listing.slug);

  const initialImage = listing.images[0]?.original || "/images/no-image.jpg";
  const [imageSrc, setImageSrc] = useState(initialImage);

  useEffect(() => {
    setImageSrc(listing.images[0]?.original || "/images/no-image.jpg");
  }, [listing.images]);

  const categoryName = listing.categories[0]?.name || "";

  const location =
    listing.type === "event"
      ? listing.event_venue || listing.event_city || listing.city || ""
      : listing.city || listing.country || "";

  const formattedDate = listing.event_start_date
    ? new Date(listing.event_start_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const showRating = listing.type !== "event" && listing.rating > 0;

  return (
    <Link
      href={`/discover/${listing.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden hover:shadow-sm transition-all duration-300 border border-[#E2E8F0]"
    >
      {/* Image — aspect-4/3 matches BusinessCard exactly */}
      <div className="relative w-full aspect-4/3 overflow-hidden">
        <Image
          src={imageSrc}
          alt={listing.name}
          fill
          unoptimized
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => {
            if (imageSrc !== "/images/no-image.jpg") {
              setImageSrc("/images/no-image.jpg");
            }
          }}
        />

        {/* Bookmark button — top-right, matches BusinessCard / EventCard */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleBookmark(listing.slug);
          }}
          className="absolute top-2 right-2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors md:opacity-0 md:group-hover:opacity-100"
        >
          <Bookmark
            className={cn(
              "w-5 h-5 transition-colors",
              isActive ? "fill-blue-500 text-blue-500" : "text-[#93C01F] hover:text-blue-500"
            )}
          />
        </button>

        {/* Category badge — bottom-right, matches BusinessCard / EventCard */}
        {categoryName && (
          <span className="absolute bottom-2 right-2 inline-flex items-center px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[#64748A] text-xs font-medium shadow-sm">
            {categoryName}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Name + verified icon — matches BusinessCard / EventCard */}
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base md:text-lg line-clamp-2 group-hover:text-[#275782] transition-colors">
            {listing.name}
          </h3>
          {listing.listing_verified && (
            <Image
              src="/images/icons/verify.svg"
              alt="Verified"
              width={20}
              height={20}
              className="shrink-0"
            />
          )}
        </div>

        {/* Business / Community: stars + review count */}
        {showRating && (
          <>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(listing.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 -mt-0.5 block">
              {listing.ratings_count}{" "}
              {Number(listing.ratings_count) === 1 ? "Review" : "Reviews"}
            </span>
          </>
        )}

        {/* Event: date row */}
        {listing.type === "event" && formattedDate && (
          <div className="flex items-center gap-2 text-gray-500">
            <Image
              src="/images/icons/calendar.svg"
              alt="Date"
              width={16}
              height={16}
            />
            <span className="text-xs">{formattedDate}</span>
          </div>
        )}

        {/* Location — matches both BusinessCard and EventCard */}
        {location && (
          <div className="flex items-center gap-0.5 text-sm text-gray-500 mt-1">
            <Image
              src="/images/icons/location.svg"
              alt="Location"
              width={20}
              height={20}
            />
            <span className={listing.type === "event" ? "text-xs" : ""}>
              {location}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Carousel ─────────────────────────────────────────────────────────────────

interface EditorialCarouselProps {
  collection: CuratedCollection;
}

export default function EditorialCarousel({ collection }: EditorialCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    skipSnaps: true,
    dragFree: true,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const updateButtons = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);
    updateButtons();

    return () => {
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
    };
  }, [emblaApi]);

  if (!collection.items || collection.items.length === 0) return null;

  return (
    <div className="py-8 px-4 lg:px-16">
      {/* Header — title + optional subtitle + nav buttons */}
      <div className="flex flex-row justify-between items-start mb-5">
        <div className="flex-1 min-w-0 pr-4">
          <h2 className="font-semibold text-2xl md:text-3xl text-gray-900 leading-tight">
            {collection.title}
          </h2>
          {collection.subtitle && (
            <p className="mt-1 text-sm text-gray-500 leading-relaxed">
              {collection.subtitle}
            </p>
          )}
        </div>
        <div className="hidden md:flex gap-2 shrink-0 mt-1">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="rounded-full bg-white hover:bg-[#E2E8F0] border-[#E2E8F0] disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="rounded-full bg-white hover:bg-[#E2E8F0] border-[#E2E8F0] disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5 text-[#275782]" />
          </Button>
        </div>
      </div>

      {/* Carousel — same slot sizing as BusinessCardCarousel */}
      <div className="overflow-hidden pb-2" ref={emblaRef}>
        <div className="flex gap-4">
          {collection.items.map((item) => (
            <div
              key={item.id}
              className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_calc(50%-0.5rem)] lg:flex-[0_0_calc(25%-0.75rem)]"
            >
              <EditorialListingCard listing={item.listing} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
