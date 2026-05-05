"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ProcessedEvent } from "@/types/event";

interface EventCardScrollProps {
  event: ProcessedEvent;
}

export const EventCardScroll = ({ event }: EventCardScrollProps) => {
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/events/${event.slug}`);
  };

  const handleGetTickets = () => {
    if (event.ticketUrl) {
      window.open(event.ticketUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="w-full">
      <div
        className="relative rounded-2xl overflow-hidden shadow-lg"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url("${event.image}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "280px",
        }}
      >
        <div
          className="p-6 md:p-8 flex flex-col h-full justify-between"
          style={{ minHeight: "280px" }}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex-1">
              {event.name}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              <span className="bg-white text-gray-800 text-xs font-medium px-3 py-1 rounded-full">
                {event.category}
              </span>
              {event.verified && (
                <Image
                  src="/images/icons/verify.svg"
                  alt="verify"
                  width={20}
                  height={20}
                  className="shrink-0"
                />
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-white text-sm md:text-base leading-relaxed mb-4 opacity-90 line-clamp-3">
            {event.description}
          </p>

          {/* Date and Time */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-white text-sm md:text-base font-semibold">
              {event.startDate}
            </span>
            {event.time && (
              <>
                <span className="text-white text-sm md:text-base font-semibold">
                  •
                </span>
                <span className="text-white text-sm md:text-base font-semibold">
                  {event.time}
                </span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-auto">
            <Button
              variant="secondary"
              onClick={handleViewDetails}
              className="flex-1 bg-white text-gray-800 hover:bg-gray-100 rounded-lg py-3 text-sm font-medium"
            >
              View Details
            </Button>
            {event.ticketUrl && (
              <Button
                onClick={handleGetTickets}
                className="flex-1 bg-[#9ACC23] hover:bg-[#8ABB13] text-white rounded-lg py-3 text-sm font-medium"
              >
                Get Tickets
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
