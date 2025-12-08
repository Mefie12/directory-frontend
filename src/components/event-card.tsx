import Image from "next/image";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useBookmark } from "@/context/bookmark-context";
import { cn } from "@/lib/utils";

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
  verified: boolean;
};

type EventCardProps = {
  event: Event;
};

export function EventCard({ event }: EventCardProps) {
  const { isBookmarked, toggleBookmark } = useBookmark();
  const isActive = isBookmarked(event.slug);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating if card is a link
    e.stopPropagation();
    toggleBookmark(event.slug);
  };
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block rounded-2xl overflow-hidden hover:shadow-sm transition-all duration-300 h-full"
    >
      {/* Image Container with Gradient Overlay */}
      <div className="relative w-full h-[280px] overflow-hidden">
        <Image
          src={event.image}
          alt={event.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-b  from-transparent via-black/30 to-black/80" />

        {/* Bookmark Icon - Always visible on mobile, hover on desktop */}
        <button
          onClick={handleBookmarkClick}
          className="absolute top-2 right-2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors md:opacity-0 md:group-hover:opacity-100"
          aria-label="Bookmark event"
        >
          <Bookmark
            className={cn(
              "w-5 h-5 transition-colors",
              isActive
                ? "fill-blue-500 text-blue-500"
                : "text-gray-100 hover:text-blue-500"
            )}
          />
        </button>

        {/* Event Title and Category at Bottom */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <h3 className="font-bold text-xl text-white leading-tight">
            {event.name}
          </h3>

          {/* Category Badge with Verification */}
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-4 py-1 rounded-full bg-white text-xs font-normal text-gray-700">
              {event.category}
            </span>
            {event.verified && (
              <Image
                src="/images/icons/verify.svg"
                alt="Verified"
                width={20}
                height={20}
              />
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
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
            alt="Calendar"
            width={16}
            height={16}
          />
          <span className="text-xs">
            {event.startDate} - {event.endDate}
          </span>
        </div>
      </div>
    </Link>
  );
}
