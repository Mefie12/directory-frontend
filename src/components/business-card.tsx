import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Bookmark } from "lucide-react";
import { useBookmark } from "@/context/bookmark-context";
import { cn } from "@/lib/utils";

export type Business = {
  id: string;
  name: string;
  category: string;
  images: string[];
  rating: number;
  reviewCount: string | number;
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

  // 1. Grab the first valid image from the array we fixed in HomeContent
  const initialImage =
    business.images && business.images.length > 0
      ? business.images[0]
      : "/images/placeholders/generic.jpg";

  // 2. Use State to hold the image source.
  // This is the cure for the "looping" issue.
  const [imageSrc, setImageSrc] = useState(initialImage);

  useEffect(() => {
    setImageSrc(initialImage);
  }, [initialImage]);

  return (
    <Link
      href={`/discover/${business.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden hover:shadow-sm transition-all duration-300 border border-[#E2E8F0]"
    >
      <div className="relative w-full aspect-4/3 overflow-hidden">
        <Image
          src={imageSrc}
          alt={business.name}
          fill
          // 3. 'unoptimized' is key if the server is external (me-fie.co.uk)
          unoptimized={true}
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => {
            // 4. If it fails, switch state to placeholder ONE TIME only.
            // This stops the infinite loop.
            if (imageSrc !== "/images/placeholders/generic.jpg") {
              setImageSrc("/images/placeholders/generic.jpg");
            }
          }}
        />

        {/* ... Bookmark button and other UI ... */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleBookmark(business.slug);
          }}
          className="absolute top-2 right-2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors md:opacity-0 md:group-hover:opacity-100"
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
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-2">
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
        <h3 className="font-semibold text-base md:text-lg line-clamp-2 group-hover:text-[#275782] transition-colors">
          {business.name}
        </h3>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.floor(business.rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          ))}
          <span className="text-sm text-gray-600 ml-1">
            ({business.reviewCount})
          </span>
        </div>
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
