// components/landing-page/home-content.tsx
"use client";
import { useState, useMemo, useEffect } from "react";
import HeroSlider from "@/components/landing-page/hero-slider";
import { Sort, SortOption } from "@/components/sort";
import { BusinessCarousel } from "@/components/landing-page/business-carousel";
import { DirectoryEventCarousel } from "@/components/landing-page/directory-event-carousel";
import Image from "next/image";
import Link from "next/link";
import { categories, communities, Business, Event } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Faqs } from "@/components/landing-page/faqs";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeContent() {
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch featured businesses and upcoming events in parallel
        const [businessesResponse, eventsResponse] = await Promise.all([
          fetch('/api/listings?featured=true&limit=8'),
          fetch('/api/listings?type=event&upcoming=true&limit=6')
        ]);

        if (!businessesResponse.ok || !eventsResponse.ok) {
          throw new Error('Failed to fetch home page data');
        }

        const [businessesData, eventsData] = await Promise.all([
          businessesResponse.json(),
          eventsResponse.json()
        ]);

        setFeaturedBusinesses(businessesData.data || []);
        setUpcomingEvents(eventsData.data || []);

      } catch (err) {
        console.error('Error fetching home page data:', err);
        setError('Failed to load data. Please try again later.');
        // You can set fallback data here if needed
        // setFeaturedBusinesses(fallbackBusinesses);
        // setUpcomingEvents(fallbackEvents);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

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

  // Loading state
  if (loading) {
    return (
      <div className="overflow-x-hidden">
        <HeroSlider />
        
        {/* Categories Skeleton */}
        <div className="py-12 px-4 lg:px-16">
          <div className="flex flex-row justify-between items-center md:items-center gap-3 mb-8">
            <div className="flex flex-col space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-32 rounded-2xl" />
            ))}
          </div>
        </div>

        {/* Featured Businesses Skeleton */}
        <div className="py-12 px-4 lg:py-20 lg:px-16">
          <div className="flex flex-row justify-between items-end md:items-center gap-3 mb-8">
            <div className="flex flex-col space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex space-x-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-80 h-48 rounded-xl shrink-0" />
            ))}
          </div>
        </div>

        {/* Upcoming Events Skeleton */}
        <div className="py-12 px-4 lg:py-20 lg:px-16">
          <div className="flex flex-row justify-between items-end md:items-center gap-3 mb-8">
            <div className="flex flex-col space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex space-x-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="w-96 h-56 rounded-xl shrink-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="overflow-x-hidden">
        <HeroSlider />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-[#93C01F] hover:bg-[#7ca818]"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden">
      <HeroSlider />

      {/* Explore by Category */}
      <div className="py-12 px-4 lg:px-16">
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
              className="group relative overflow-hidden rounded-2xl w-[173px] h-[114px] md:w-[310px] md:h-[204px] aspect-4/3 hover:shadow-xl transition-all duration-300 mx-auto"
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
      <div className="py-12 px-4 lg:py-20 lg:px-16">
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
      <div className="py-12 px-4 lg:py-20 lg:px-16">
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

        {/* Events Carousel */}
        <DirectoryEventCarousel events={upcomingEvents} />
      </div>

      {/* Ready to grow your business section */}
      <div className="py-12 px-4 lg:px-16">
        <div className="flex flex-col lg:flex-row overflow-hidden rounded-2xl bg-white shadow-sm">
          {/* Left: Image */}
          <div className="relative w-full lg:w-1/2 h-80 lg:h-auto">
            <Image
              src="/images/backgroundImages/business/vendor.jpg"
              alt="Vendor serving customer"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Right: Text Content */}
          <div className="flex flex-col justify-center bg-[#0D7077] text-white w-full lg:w-1/2 p-8 lg:p-16 space-y-6">
            <h2 className="text-3xl md:text-5xl font-medium leading-tight">
              Grow Your Business with Mefie
            </h2>
            <p className="text-base md:text-lg leading-relaxed">
              Join a network of vendors and service providers reaching new
              audiences through Mefie. Showcase your products, connect with
              customers, and expand your business in a thriving digital
              marketplace.
            </p>
            <Button className="bg-[#93C01F] hover:bg-[#7ca818] text-white font-medium w-fit px-4 py-3 rounded-md cursor-pointer">
              Join as a vendor
            </Button>
          </div>
        </div>
      </div>

      {/* Rest of your existing sections remain the same */}
      {/* Community you can explore section */}
      <div className="py-12 px-4 lg:px-16">
        <div className="flex flex-row justify-between items-center md:items-center gap-3 mb-10">
          <div className="flex flex-col space-y-2">
            <h2 className="font-semibold text-xl md:text-4xl">
              Community you can explore
            </h2>
            <p className="font-normal text-sm md:text-base">
              Join supportive network that celebrates african heritage and
              empowers businesses across the diaspora
            </p>
          </div>
        </div>

        {/* cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-6">
          {communities.map((item, index) => (
            <div
              key={index}
              className="flex flex-row bg-white rounded-3xl shadow-sm border overflow-hidden"
            >
              {/* Image Section */}
              <div className="relative w-32 sm:w-48 h-[165px] sm:h-auto p-3 shrink-0">
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Text Section */}
              <div className="flex flex-col justify-center mt-1.5 p-1 md:p-3">
                <h4 className="text-lg md:text-2xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h4>
                <p className="text-sm md:text-base text-gray-500 mb-2 md:mb-5 font-normal">
                  {item.description}
                </p>
                <Button className="hidden md:block bg-[#152B40] hover:bg-[#253754] text-white font-medium w-full rounded-md px-5 py-2">
                  Join Community
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Button */}
        <Button className="flex justify-center bg-[#93C01F] hover:bg-[#7ca818] text-white font-medium w-full md:w-fit px-4 py-3 rounded-md cursor-pointer mx-auto mt-5">
          Explore more communities
        </Button>
      </div>

      {/* FAQs */}
      <div className="py-12 px-4 lg:px-16">
        <div className="flex flex-row justify-center items-center md:items-center gap-3 mb-8">
          <div className="flex flex-col space-y-2 text-center">
            <h2 className="font-semibold text-xl md:text-4xl capitalize">
              Frequently Asked Questions{" "}
              <span className="text-[#93C01F]">(FAQs)</span>
            </h2>
            <p className="font-normal text-sm md:text-base max-w-5xl">
              Here, we&apos;ve answered the most common questions to help
              vendors and customers get the best out of Mefie. Whether
              you&apos;re listing your business or searching for trusted
              services, this section will guide you through every step of the
              journey.
            </p>
          </div>
        </div>

        {/* FAQ Cards */}
        <Faqs />
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
            Join thousands of African businesses already listed on Mefie
            Directory
          </p>

          {/* CTA button */}
          <Button className="bg-[#93C01F] hover:bg-[#7ca818] text-white font-medium text-base px-4 py-2 rounded-md transition-all duration-200">
            List your business today
          </Button>
        </div>
      </div>
    </div>
  );
}