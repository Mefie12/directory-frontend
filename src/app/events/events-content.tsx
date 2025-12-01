"use client";

import { useState, useMemo, Suspense } from "react";
import ScrollableCategoryTabs from "@/components/scrollable-category-tabs";
import SearchHeader from "@/components/search-header";
import { EventsCategory, Event, communityCards } from "@/lib/data";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import EventSectionCarousel from "@/components/event-section-carousel";
import EventCarousel from "@/components/events/event-carousel";
import CommunitySectionCarousel from "@/components/community-section-carousel";

interface EventsContentProps {
  categories: EventsCategory[];
  events: Event[];
}

export default function EventsContent({
  categories,
  events,
}: EventsContentProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Filter events based on selected category
  const filteredevents = useMemo(() => {
    if (selectedCategory === "all") {
      return events;
    }

    return events.filter((event) => {
      // Normalize both values for flexible matching
      const normalizeString = (str: string) =>
        str
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/&/g, "")
          .replace(/'/g, "");

      const eventsCategory = normalizeString(event.category);
      const selectedCat = normalizeString(selectedCategory);

      // Flexible matching: exact match or partial match
      return (
        eventsCategory === selectedCat ||
        eventsCategory.includes(selectedCat) ||
        selectedCat.includes(eventsCategory)
      );
    });
  }, [events, selectedCategory]);

  // Get events by specific category
  const getEventsByCategory = (category: string) => {
    return filteredevents.filter((e) => e.category === category);
  };

  // Main categories to show initially (in order)
  const mainCategories = ["Online Events", "Comedy", "Theatre"];

  // Additional categories to show after "Explore more"
  const additionalCategories = [
    "Concert",
    "Festival",
    "Art & Craft",
    "Food & Hospitality",
    "Fashion & Lifestyle",
  ];

  return (
    <>
      {/* Scrollable Category Tabs */}
      <div>
        <ScrollableCategoryTabs
          categories={categories}
          defaultValue="all"
          onChange={(value) => {
            setSelectedCategory(value);
            setShowAllCategories(false); // Reset expand state when category changes
          }}
          containerClassName="pt-4 pb-1"
        />
      </div>

      {/* Search and Filter Bar */}
      <div>
        <Suspense fallback={<div className="h-20" />}>
          <SearchHeader context="events" />
        </Suspense>
      </div>

      {/* Events content */}
      <div className="bg-gray-50">
        {filteredevents.length > 0 ? (
          <>
            {selectedCategory === "all" ? (
              // Show structured sections for "All" view
              <>
                {/* Top Best Deals Section */}
                <EventCarousel
                  events={filteredevents.slice(0, 8)}
                  title="Popular Events coming up"
                  showNavigation={true}
                />

                {/* Main Category Sections */}
                {mainCategories.map((category) => {
                  const categoryEvents = getEventsByCategory(category);
                  if (categoryEvents.length === 0) return null;

                  return (
                    <div key={category} className="py-12 px-4 lg:px-16">
                      <EventSectionCarousel
                        events={categoryEvents}
                        title={category}
                        showNavigation={true}
                      />
                    </div>
                  );
                })}

                {/* Explore More Button */}
                {/* {!showAllCategories && (
                        <div className="flex justify-center py-10">
                          <Button
                            onClick={() => setShowAllCategories(true)}
                            className="px-4 py-3 border-2 bg-transparent border-[#9ACC23] text-[#9ACC23] rounded-md font-medium hover:bg-[#9ACC23] hover:text-white transition-colors"
                          >
                            Explore more businesses
                          </Button>
                        </div>
                      )} */}

                {/* Additional Categories (shown after expand) */}
                {showAllCategories && (
                  <>
                    {additionalCategories.map((category) => {
                      const categoryEvents = getEventsByCategory(category);
                      if (categoryEvents.length === 0) return null;

                      return (
                        <div key={category} className="py-12 px-4 lg:px-16">
                          <EventSectionCarousel
                            events={categoryEvents}
                            title={category}
                            showNavigation={true}
                          />
                        </div>
                      );
                    })}
                  </>
                )}
                {/* Explore more or less button */}
                <div className="flex justify-center py-10">
                  <Button
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    className="px-4 py-3 border-2 bg-transparent border-[#9ACC23] text-[#9ACC23] rounded-md font-medium hover:bg-[#9ACC23] hover:text-white transition-colors"
                  >
                    {showAllCategories
                      ? "Show less"
                      : "Explore more businesses"}
                  </Button>
                </div>

                {/* Ready to grow your business section */}
                <div className="py-12 px-4 lg:px-16 bg-white">
                  <div className="flex flex-col lg:flex-row overflow-hidden rounded-2xl bg-white shadow-sm">
                    {/* Left: Image */}
                    <div className="relative w-full lg:w-1/2 h-80 lg:h-auto">
                      <Image
                        src="/images/backgroundImages/business/vendor2.jpg"
                        alt="Vendor serving customer"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>

                    {/* Right: Text Content */}
                    <div className="flex flex-col justify-center bg-black text-white w-full lg:w-1/2 p-8 lg:p-16 space-y-6">
                      <h2 className="text-3xl md:text-5xl font-medium leading-tight">
                        List Your Events on Mefie
                      </h2>
                      <p className="text-base md:text-lg leading-relaxed">
                        Showcase your products and services to a wider audience.
                        Create a listing, reach new customers, and grow your
                        business within the global African community.
                      </p>
                      <Button className="bg-(--accent-primary) hover:bg-[#93C956] text-white font-medium w-fit px-4 py-3 rounded-md cursor-pointer">
                        List your event
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Communities section */}
                <div className="py-10 px-4 lg:px-16">
                  <div className="flex flex-row justify-between items-end md:items-center gap-3 mb-6">
                    <div className="flex flex-col space-y-2">
                      <h2 className="font-semibold text-xl md:text-4xl">
                        Communities
                      </h2>
                    </div>
                    <div>
                      <Link
                        href="/communities"
                        className="text-[#275782] font-medium hidden lg:block"
                      >
                        Explore Communities
                      </Link>
                      <Link
                        href="/communities"
                        className="text-[#275782] font-medium lg:hidden"
                      >
                        Explore all
                      </Link>
                    </div>
                  </div>

                  <CommunitySectionCarousel communities={communityCards} />
                </div>

                {/* CTA */}
                <div className="py-12 px-4 lg:px-16">
                  <div className="relative flex flex-col justify-center items-center text-center bg-[#152B40] text-white rounded-3xl overflow-hidden h-[350px] shadow-sm px-20 lg:px-0">
                    {/* Background patterns */}
                    <div className="absolute -left-32 lg:-left-6 lg:-bottom-20">
                      <Image
                        src="/images/backgroundImages/bg-pattern.svg"
                        alt="background pattern left"
                        width={320}
                        height={320}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-contain h-[150px] lg:h-[400px]"
                        priority
                      />
                    </div>
                    <div className="hidden lg:block absolute bottom-20 lg:-bottom-20 -right-24 lg:right-0">
                      <Image
                        src="/images/backgroundImages/bg-pattern-1.svg"
                        alt="background pattern right"
                        width={320}
                        height={320}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-contain"
                        priority
                      />
                    </div>
                    <div className="block lg:hidden absolute bottom-16 -right-32">
                      <Image
                        src="/images/backgroundImages/mobile-pattern.svg"
                        alt="background pattern right"
                        width={320}
                        height={320}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-contain h-[120px]"
                        priority
                      />
                    </div>

                    {/* Text content */}
                    <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
                      Ready to Grow Your Business?
                    </h2>
                    <p className="text-base md:text-lg font-normal text-gray-100 mb-6">
                      Join thousands of African businesses already listed on
                      Mefie Directory
                    </p>

                    {/* CTA button */}
                    <Button className="bg-(--accent-primary) hover:bg-[#93C956] text-white font-medium text-base px-4 py-2 rounded-md transition-all duration-200">
                      List your business today
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // Show filtered events in a single section
              <>
                <div className="py-12 px-4 lg:px-16">
                  <EventSectionCarousel
                    events={filteredevents}
                    title={
                      categories.find((c) => c.value === selectedCategory)
                        ?.label || "Filtered Events"
                    }
                    showNavigation={true}
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <div className="py-16 px-4 lg:px-16 text-center">
            <p className="text-gray-500 text-lg">
              No events found in this category.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
