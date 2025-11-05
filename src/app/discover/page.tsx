import { Suspense } from "react";
import NavigationTab from "@/components/navigation-tab";
import SearchHeader from "@/components/search-header";
import BusinessCardCarousel from "@/components/discover/business-card-carousel";
import EventCardCarousel from "@/components/discover/event-card-carousel";
import BusinessBestCarousel from "@/components/discover/business-best-carousel";
import { featuredBusinesses, Events } from "@/lib/data";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import BusinessSectionCarousel from "@/components/business-section-carousel";
import EventSectionCarousel from "@/components/event-section-carousel";

export default async function Discover() {
  const businesses = featuredBusinesses;
  const events = Events;

  return (
    <div className="overflow-x-hidden pt-20 bg-gray-50">
      <div className="w-full">
        <NavigationTab />
        <Suspense fallback={<div className="h-20" />}>
          <SearchHeader context="discover" />
        </Suspense>
      </div>

      {/* content */}
      <div className="space-y-2">
        <BusinessCardCarousel businesses={businesses} />
        <EventCardCarousel events={events} />

        {/* another carousel section */}
        <BusinessBestCarousel businesses={businesses} />

        {/* Ready to grow your business section */}
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
              <Button className="bg-(--accent-primary) hover:bg-[#93C956] text-white font-medium w-fit px-4 py-3 rounded-md cursor-pointer">
                Join as a vendor
              </Button>
            </div>
          </div>
        </div>

        {/*  Business section*/}
        <div className="py-12 px-4 lg:px-16">
          <div className="flex flex-row justify-between items-end md:items-center gap-3 mb-8">
            <div className="flex flex-col space-y-2">
              <h2 className="font-semibold text-xl md:text-4xl">Businesses</h2>
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
          {/* {businesses.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {businesses.slice(0, 4).map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          )} */}
          <BusinessSectionCarousel businesses={businesses} />
        </div>

        {/* Events section*/}
        <div className="py-12 px-4 lg:px-16">
          <div className="flex flex-row justify-between items-end md:items-center gap-3 mb-8">
            <div className="flex flex-col space-y-2">
              <h2 className="font-semibold text-xl md:text-4xl">Events</h2>
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
          {/* {events.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {events.slice(0, 3).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )} */}
          <EventSectionCarousel events={events} />
        </div>

        {/* Communities section */}
        {/* <div className="py-12 px-4 lg:px-16">
          <div className="flex flex-row justify-between items-end md:items-center gap-3 mb-8">
            <div className="flex flex-col space-y-2">
              <h2 className="font-semibold text-xl md:text-4xl">Communities</h2>
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

    
          <EventSectionCarousel events={events} />
        </div> */}

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
            <Button className="bg-(--accent-primary) hover:bg-[#93C956] text-white font-medium text-base px-4 py-2 rounded-md transition-all duration-200">
              List your business today
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
