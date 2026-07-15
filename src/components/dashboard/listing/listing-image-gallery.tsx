"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ListingImageGalleryProps {
  images: string[];
  alt: string;
  verified?: boolean;
  className?: string;
}

const THUMB_LIMIT = 4;

/**
 * Shared slideable image gallery for listing detail pages (vendor + admin
 * dashboards): a large embla carousel with prev/next controls, a thumbnail
 * strip that scrolls the carousel on click, and a fullscreen lightbox.
 */
export function ListingImageGallery({
  images,
  alt,
  verified,
  className,
}: ListingImageGalleryProps) {
  const safeImages = images.length > 0 ? images : ["/images/no-image.jpg"];
  const hasMultiple = safeImages.length > 1;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: hasMultiple });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    // Embla always starts on scroll snap 0, matching the initial state, so we
    // only need to subscribe to future changes here (no synchronous setState).
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = (index: number) => emblaApi?.scrollTo(index);
  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  const visibleThumbs = safeImages.slice(0, THUMB_LIMIT);
  const extraCount = safeImages.length - THUMB_LIMIT;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main carousel */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 group">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {safeImages.map((src, i) => (
              <div
                key={i}
                className="relative min-w-0 flex-[0_0_100%] h-64 sm:h-80 lg:h-96 cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
              >
                <Image
                  src={src}
                  alt={`${alt} ${i + 1}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                  unoptimized
                  priority={i === 0}
                />
              </div>
            ))}
          </div>
        </div>

        {verified && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 bg-white rounded-full shadow-sm border border-gray-200">
            <Image
              src="/images/icons/verify.svg"
              alt="Verified"
              width={13}
              height={13}
            />
            <span className="text-xs font-medium text-gray-700">
              Verified
            </span>
          </div>
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scrollPrev();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scrollNext();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-medium">
              {selectedIndex + 1} / {safeImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {hasMultiple && (
        <div className="flex items-center gap-2">
          {visibleThumbs.map((src, i) => {
            const isLastVisible = i === THUMB_LIMIT - 1;
            const showOverlay = isLastVisible && extraCount > 0;
            return (
              <button
                key={i}
                type="button"
                onClick={() =>
                  showOverlay ? setLightboxOpen(true) : scrollTo(i)
                }
                className={cn(
                  "relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-lg overflow-hidden ring-2 transition-all",
                  i === selectedIndex
                    ? "ring-[#93C01F]"
                    : "ring-transparent hover:ring-gray-200",
                )}
              >
                <Image
                  src={src}
                  alt={`${alt} thumbnail ${i + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized
                />
                {showOverlay && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-semibold">
                    +{extraCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{alt} — image preview</DialogTitle>
          </DialogHeader>
          <div className="relative w-full max-h-[88vh] flex items-center justify-center">
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-50 h-9 w-9 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/80 border border-white/20 transition-colors"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
            {hasMultiple && (
              <>
                <button
                  onClick={scrollPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/80 border border-white/20 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={scrollNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/80 border border-white/20 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            <Image
              src={safeImages[selectedIndex]}
              alt={`${alt} full preview`}
              width={1200}
              height={800}
              className="object-contain max-h-[88vh] w-auto"
              unoptimized
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
