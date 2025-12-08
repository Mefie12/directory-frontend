import Image from "next/image";
import Link from "next/link";
import { Star, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useBookmark } from "@/context/bookmark-context";
import { cn } from "@/lib/utils";

export type Business = {
  id: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  reviewCount: string;
  location: string;
  verified?: boolean;
  slug: string;
  discount?: string;
};

type BusinessCardProps = {
  business: Business;
};

export function BusinessCard({ business }: BusinessCardProps) {
  const { isBookmarked, toggleBookmark } = useBookmark();
  const isActive = isBookmarked(business.slug);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating if card is a link
    e.stopPropagation();
    toggleBookmark(business.slug);
  };
  return (
    <Link
      href={`/discover/${business.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden hover:shadow-sm transition-all duration-300 border border-[#E2E8F0]"
    >
      {/* Image Container */}
      <div className="relative w-full aspect-4/3 overflow-hidden ">
        <Image
          src={business.image}
          alt={business.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

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

        {/* Discount Badge */}
        {business.discount && (
          <div className="absolute top-1 left-1">
            <Badge
              variant="destructive"
              className="bg-red-500 text-white font-normal"
            >
              {business.discount}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Category Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#64748A14] text-[#64748A] text-xs font-medium">
            {business.category}
          </span>
          {business.verified && (
            <Image
              src="/images/icons/verify.svg"
              alt="Verified"
              width={20}
              height={20}
            />
          )}
        </div>

        {/* Business Name */}
        <h3 className="font-semibold text-base md:text-lg line-clamp-2 group-hover:text-[#275782] transition-colors">
          {business.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.floor(business.rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : i < business.rating
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          ))}
          <span className="text-sm text-gray-600 ml-1">
            ({business.reviewCount})
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Image
            src="/images/icons/location.svg"
            alt="Location"
            width={20}
            height={20}
          />
          <span>{business.location}</span>
        </div>
      </div>
    </Link>
  );
}
