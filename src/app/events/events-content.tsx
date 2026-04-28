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

  const filterCountry = searchParams.get("country");
  const filterStartDate = searchParams.get("event_start_date");
  const filterEndDate = searchParams.get("event_end_date");

  const eventMapper = useMemo(() => createEventMapper(), []);

  const { items, isLoading, detectedCountry } =
    useDirectoryListings<ProcessedEvent>({
      endpoint: "/api/events",
      mapItem: eventMapper,
      forwardParams: ["category_id", "category_slug", "country"],
      extraParams: {
        event_start_date: filterStartDate ?? undefined,
        event_end_date: filterEndDate ?? undefined,
      },
    });

  const locationLabel = filterCountry
    ? `in ${filterCountry}`
    : detectedCountry
    ? "near you"
    : null;

  const heroTitle = "Events coming up";
  const gridTitle = locationLabel
    ? `All Events ${locationLabel}`
    : "All Events";

  // 4 months from today — the window for hero carousel events.
  const fourMonthsFromNow = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 4);
    return d;
  }, []);

  // All events: verified-first, then soonest within each group.
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.verified !== b.verified) return a.verified ? -1 : 1;
      const ta =
        a.startDateRaw ? new Date(a.startDateRaw).getTime() : Infinity;
      const tb =
        b.startDateRaw ? new Date(b.startDateRaw).getTime() : Infinity;
      return ta - tb;
    });
  }, [items]);

  const handleCtaClick = () => {
    router.push(user ? "/claim" : "/auth/login?redirect=/claim");
  };

  return (
    <DirectoryPageShell<ProcessedEvent>
      mainCategorySlug="events"
      context="events"
      items={sortedItems}
      isLoading={isLoading}
      detectedCountry={detectedCountry}
      mapItem={eventMapper}
      groupBy={(e) => e.category}
      matchesCategory={(e, slug) => e.categorySlug === slug}
      heroSize={8}
      visibleGroups={0}
      emptyMessage="No events found in this category."
      gridTitle={gridTitle}
      renderHero={(heroItems) => {
        // Hero shows only verified events starting within the next 4 months.
        const upcomingVerified = heroItems.filter((e) => {
          if (!e.verified) return false;
          if (!e.startDateRaw) return false;
          const start = new Date(e.startDateRaw);
          return !isNaN(start.getTime()) && start <= fourMonthsFromNow;
        });
        return (
          <EventCarousel
            events={upcomingVerified}
            title={heroTitle}
            showNavigation
          />
        );
      }}
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
