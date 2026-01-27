/* eslint-disable @typescript-eslint/no-explicit-any */
// event-carousel.tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
// Remove this import:
// import type { Event } from "@/lib/data";
import { Button } from "../ui/button";
import { EventCardScroll } from "./event-card-scroll";

import type { ProcessedEvent } from "@/types/event";

// Define or import the ProcessedEvent type
// interface ProcessedEvent {
//   id: string;
//   name: string;
//   title: string;
//   slug: string;
//   description: string;
//   image: string;
//   images: string[];
//   location: string;
//   verified: boolean;
//   category: string;
//   categorySlug: string;
//   type: "event";
//   country: string;
//   createdAt: Date;
//   startDate: string;
//   endDate: string;
//   date: string;
//   price: string;
//   rating: number;
//   reviewCount: number;
// }

interface EventSectionCarouselProps {
  events: ProcessedEvent[]; // Changed from Event[] to ProcessedEvent[]
  title?: string;
  showTitle?: boolean;
  showNavigation?: boolean;
  noPadding?: boolean;
  onViewDetails?: (eventId: string) => void;
  onGetTickets?: (eventId: string) => void;
}

export default function EventCarousel({
  events,
  title = "Events",
  showTitle = true,
  showNavigation = true,
  noPadding = false,
  onViewDetails,
  onGetTickets,
}: EventSectionCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: false,
    skipSnaps: true,
    dragFree: true,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const updateButtons = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);

    // Initial check
    updateButtons();

    return () => {
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
    };
  }, [emblaApi]);

  return (
    <div className={noPadding ? "" : "py-12 px-4 lg:px-16"}>
      {/* Header with Title and Navigation Buttons */}
      {showTitle && (
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-semibold text-2xl md:text-3xl">{title}</h2>

          {/* Navigation Buttons */}
          {showNavigation && (
            <div className="hidden md:flex gap-2">
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
          )}
        </div>
      )}

      {/* Carousel Container */}
      <div className="overflow-hidden pb-2" ref={emblaRef}>
        <div className="flex gap-6">
          {events.map((eventItem) => (
            <div
              key={eventItem.id}
              className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_calc(50%-0.75rem)] lg:flex-[0_0_calc(50%-0.75rem)]"
            >
              <EventCardScroll
                event={eventItem as any}
                onViewDetails={onViewDetails}
                onGetTickets={onGetTickets}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}