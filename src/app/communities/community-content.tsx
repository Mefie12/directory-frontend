"use client";

import { useState, useMemo, Suspense } from "react";
import ScrollableCategoryTabs from "@/components/scrollable-category-tabs";
import SearchHeader from "@/components/search-header";
import {
  CommunityCategory,
  CommunityCard,
  featuredBusinesses as DataBusinesses,
  Events,
} from "@/lib/data";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import CommunityCarousel from "@/components/communities/community-carousel";
import BusinessSectionCarousel from "@/components/business-section-carousel";
import EventSectionCarousel from "@/components/event-section-carousel";

interface CommunityContentProps {
  categories: CommunityCategory[];
  communities: CommunityCard[];
}

// Helper function to convert DataBusiness to API Business type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertDataBusinessToApiBusiness = (business: any) => {
  return {
    ...business,
    images: business.image ? [business.image] : ["/images/placeholders/generic.jpg"],
    // Remove the image property since API expects images array
    image: undefined,
  };
};

// Helper function to convert array of DataBusiness to API Business array
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertBusinessesArray = (businesses: any[]) => {
  return businesses.map(convertDataBusinessToApiBusiness);
};

export default function CommunityContent({
  categories,
  communities,
}: CommunityContentProps) {
  const businesses = useMemo(() => {
    return convertBusinessesArray(DataBusinesses);
  }, []);
  
  const events = Events;

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Filter communities based on selected category
  const filteredCommunities = useMemo(() => {
    if (selectedCategory === "all") {
      return communities;
    }

    return communities.filter((community) => {
      // Normalize both values for flexible matching
      const normalizeString = (str: string) =>
        str
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/&/g, "")
          .replace(/'/g, "");

      const communityTag = normalizeString(community.tag);
      const selectedCat = normalizeString(selectedCategory);

      // Flexible matching: exact match or partial match
      return (
        communityTag === selectedCat ||
        communityTag.includes(selectedCat) ||
        selectedCat.includes(communityTag)
      );
    });
  }, [communities, selectedCategory]);

  // Get communities by specific tag
  const getCommunitiesByTag = (tag: string) => {
    return filteredCommunities.filter((c) => c.tag === tag);
  };

  // Main tags to show initially (in order)
  const mainTags = ["Mental Health"];

  // Additional tags to show after "Explore more"
  const additionalTags = [
    "Community Interest",
    "School Groups",
    "Professional Groups",
    "Community Support",
    "Charities",
    "Sports Groups",
    "Hometown Groups",
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
          <SearchHeader context="communities" />
        </Suspense>
      </div>

      {/* Communities content */}
      <div className="bg-gray-50">
        {filteredCommunities.length > 0 ? (
          <>
            {selectedCategory === "all" ? (
              // Show structured sections for "All" view
              <>
                {/* Top Featured Communities Section */}
                <CommunityCarousel
                  communities={filteredCommunities.slice(0, 9)}
                  title="Community Impact"
                  showNavigation={true}
                />

                {/* Main Tag Sections */}
                {mainTags.map((tag) => {
                  const tagCommunities = getCommunitiesByTag(tag);
                  if (tagCommunities.length === 0) return null;

                  return (
                    <div key={tag}>
                      <CommunityCarousel
                        communities={tagCommunities}
                        title={tag}
                        showNavigation={true}
                      />
                    </div>
                  );
                })}

                {/* Additional Tags (shown after expand) */}
                {showAllCategories && (
                  <>
                    {additionalTags.map((tag) => {
                      const tagCommunities = getCommunitiesByTag(tag);
                      if (tagCommunities.length === 0) return null;

                      return (
                        <div key={tag}>
                          <CommunityCarousel
                            communities={tagCommunities}
                            title={tag}
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
                      : "Explore more communities"}
                  </Button>
                </div>

                {/* Join community section */}
                <div className="py-12 px-4 lg:px-16 bg-white">
                  <div className="flex flex-col lg:flex-row overflow-hidden rounded-2xl bg-white shadow-sm">
                    {/* Left: Image */}
                    <div className="relative w-full lg:w-1/2 h-80 lg:h-auto">
                      <Image
                        src="/images/backgroundImages/community/students.jpg"
                        alt="Community gathering"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>

                    {/* Right: Text Content */}
                    <div className="flex flex-col justify-center bg-black text-white w-full lg:w-1/2 p-8 lg:p-16 space-y-6">
                      <h2 className="text-3xl md:text-5xl font-medium leading-tight">
                        Host your Community or social impact on Mefie
                      </h2>
                      <p className="text-base md:text-lg leading-relaxed">
                        Bring your community initiatives and social impact
                        projects to a wider audience. Share your mission,
                        connect with supporters, and grow movements that create
                        lasting change.
                      </p>
                      <Button className="bg-[#93C01F] hover:bg-[#7ea919] text-white font-medium w-fit px-4 py-3 rounded-md cursor-pointer">
                        List your Community
                      </Button>
                    </div>
                  </div>
                </div>

                {/*  Business section*/}
                <div className="py-12 px-4 lg:px-16">
                  <div className="flex flex-row justify-between items-end md:items-center gap-3 mb-8">
                    <div className="flex flex-col space-y-2">
                      <h2 className="font-semibold text-xl md:text-4xl">
                        Best deals for you!
                      </h2>
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

                  <BusinessSectionCarousel businesses={businesses} />
                </div>

                {/* Events section*/}
                <div className="py-12 px-4 lg:px-16">
                  <div className="flex flex-row justify-between items-end md:items-center gap-3 mb-8">
                    <div className="flex flex-col space-y-2">
                      <h2 className="font-semibold text-xl md:text-4xl">
                        Spotlight Events
                      </h2>
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
                  <EventSectionCarousel events={events} />
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
                    <Button className="bg-[#93C01F] hover:bg-[#7ea919] text-white font-medium text-base px-4 py-2 rounded-md transition-all duration-200">
                      List your business today
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // Show filtered communities in a single section
              <>
                <div className="py-12 px-4 lg:px-16">
                  <CommunityCarousel
                    communities={filteredCommunities}
                    title={
                      categories.find((c) => c.value === selectedCategory)
                        ?.label || "Filtered Communities"
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
              No communities found in this category.
            </p>
          </div>
        )}
      </div>
    </>
  );
}