import Image from "next/image";
import Link from "next/link";
import { Bookmark } from "lucide-react";

export type Event = {
  id: string;
  name: string;
  category: string;
  image: string;
  location: string;
  description: string;
  slug: string;
  startDate: string;
  endDate: string;
};

type EventCardProps = {
  event: Event;
};

export function EventCard({ event }: EventCardProps) {
  return (
    <div className="group bg-white rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-[#E2E8F0] h-full">
      {/* Image Container */}
      <div className="relative w-full h-[280px] md:h-[320px] overflow-hidden">
        <Image
          src={event.image}
          alt={event.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/40 to-black/70" />

        {/* Bookmark Icon */}
        <button
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
          aria-label="Bookmark event"
        >
          <Bookmark className="w-5 h-5 text-white" />
        </button>

        {/* Event Title Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="font-bold text-2xl md:text-3xl text-white leading-tight">
            {event.name}
          </h3>
        </div>

        {/* Category Badge with Verification */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F8FAFC] text-xs font-medium text-gray-700">
            {event.category}
          </span>
          <div className="w-6 h-6  flex items-center justify-center">
            <Image
              src="/images/icons/verify.svg"
              alt="Verified"
              width={20}
              height={20}
            />
          </div>
        </div>
      </div>

      {/* Card Content */}
      <Link href={`/events/${event.slug}`} className="block p-5 space-y-3">
        {/* Description */}
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
          {event.description}
        </p>

        {/* Location */}
        <div className="flex items-center gap-2 text-gray-500">
          <Image
            src="/images/icons/location.svg"
            alt="Location"
            width={16}
            height={16}
          />
          <span className="text-xs">{event.location}</span>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2 text-gray-500">
          <Image
            src="/images/icons/calendar.svg"
            alt="Verified"
            width={20}
            height={20}
          />
          <span className="text-xs">
            {event.startDate} - {event.endDate}
          </span>
        </div>
      </Link>
    </div>
  );
}
