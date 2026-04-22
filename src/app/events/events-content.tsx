"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import EventSectionCarousel from "@/components/event-section-carousel";
import EventCarousel from "@/components/events/event-carousel";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { DirectoryPageShell } from "@/components/directory/directory-page-shell";
import { useDirectoryListings } from "@/lib/directory/use-directory-listings";
import { useAuth } from "@/context/auth-context";
import type { ProcessedEvent } from "@/types/event";
import { createEventMapper } from "./map-event";

export default function EventsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const filterStartDate = searchParams.get("event_start_date");
  const filterEndDate = searchParams.get("event_end_date");

  // Stable mapper reference — recreate only when date filters change
  const eventMapper = useMemo(() => createEventMapper(), []);

  const { items, isLoading, detectedCountry } =
    useDirectoryListings<ProcessedEvent>({
      endpoint: "/api/events",
      mapItem: eventMapper,
      forwardParams: ["category_id"],
      // Events also accept date-range filters; send them when present.
      extraParams: {
        event_start_date: filterStartDate ?? undefined,
        event_end_date: filterEndDate ?? undefined,
      },
    });

  const handleCtaClick = () => {
    router.push(user ? "/claim" : "/auth/login?redirect=/claim");
  };

  return (
    <DirectoryPageShell<ProcessedEvent>
      mainCategorySlug="events"
      context="events"
      items={items}
      isLoading={isLoading}
      detectedCountry={detectedCountry}
      mapItem={eventMapper}
      groupBy={(e) => e.category}
      matchesCategory={(e, slug) => e.categorySlug === slug}
      heroSize={8}
      visibleGroups={3}
      emptyMessage="No events found in this category."
      gridTitle="All events"
      renderHero={(heroItems) => (
        <EventCarousel
          events={heroItems}
          title="Popular Events coming up"
          showNavigation
        />
      )}
      renderGroup={(name, groupItems) => (
        <div className="py-12 px-4 lg:px-16">
          <EventSectionCarousel events={groupItems} title={name} />
        </div>
      )}
      renderFiltered={(filtered) => (
        <div className="py-12 px-4 lg:px-16">
          <EventSectionCarousel
            events={filtered}
            title={`${filtered[0]?.category ?? "Filtered"} Events`}
          />
        </div>
      )}
      renderCard={(e) => (
        <EventCard
          event={{
            id: e.id,
            name: e.name,
            category: e.category,
            image: e.image,
            location: e.location,
            description: e.description,
            slug: e.slug,
            startDate: e.startDate,
            endDate: e.endDate,
            verified: e.verified,
          }}
        />
      )}
      renderFooterCta={() => (
        <div className="py-12 px-4 lg:px-16">
          <div className="relative flex flex-col justify-center items-center text-center bg-[#152B40] text-white rounded-3xl h-[350px] overflow-hidden px-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Ready to Grow Your Business?
            </h2>
            <Button
              onClick={handleCtaClick}
              className="bg-[#93C01F] hover:bg-[#93C956]"
            >
              List your business today
            </Button>
          </div>
        </div>
      )}
    />
  );
}
