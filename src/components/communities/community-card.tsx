"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Bookmark } from "lucide-react";
import Link from "next/link";
// We use 'any' for the type here to allow flexibility between 'image' and 'imageUrl' props
// during the transition from mock data to API data.
import type { CommunityCard } from "@/lib/data";
import { useBookmark } from "@/context/bookmark-context";
import { cn } from "@/lib/utils";

interface CommunityCardProps {
  community: CommunityCard & { image?: string }; // Extend type to allow 'image'
}

export default function CommunityCard({ community }: CommunityCardProps) {
  const { isBookmarked, toggleBookmark } = useBookmark();
  const isActive = isBookmarked(community.slug);

  // 1. LOGIC FIX: robustly find the image source
  // The API maps to 'image', but legacy data might use 'imageUrl'. We check both.
  const initialImage =
    community.image || community.imageUrl || "/images/placeholders/generic.jpg";

  // 2. Use State to hold the image source (Prevents looping)
  const [imageSrc, setImageSrc] = useState(initialImage);

  // 3. Sync state if the prop changes
  useEffect(() => {
    setImageSrc(initialImage);
  }, [initialImage]);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(community.slug);
  };

  return (
    <Link
      href={`/communities/${community.slug}`}
      className="group block rounded-3xl overflow-hidden hover:shadow-sm transition-all duration-300 h-full border border-[#E2E8F0]"
    >
      {/* Image container */}
      <div className="relative p-3 w-full overflow-hidden">
        {/* Image with fixed aspect ratio */}
        <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-gray-100">
          <Image
            src={imageSrc}
            alt={community.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized={true} // Bypass Next.js optimization for external URLs
            onError={() => {
              // 4. Safety check to prevent infinite loops
              if (imageSrc !== "/images/placeholders/generic.jpg") {
                setImageSrc("/images/placeholders/generic.jpg");
              }
            }}
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/30 to-black/80" />
        </div>

        {/* Bookmark Icon */}
        <button
          onClick={handleBookmarkClick}
          className="absolute top-2 right-2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors md:opacity-0 md:group-hover:opacity-100"
          aria-label="Bookmark community"
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

        {/* Tag and Verified group */}
        <div className="flex items-center gap-2 z-10 pt-4">
          <Badge className="px-3 py-1.5 bg-[#64748A14] text-gray-500 hover:bg-gray-100 rounded-full border-0">
            <span className="text-xs font-medium">
              {community.tag || "Community"}
            </span>
          </Badge>

          {community.verified && (
            <Image
              src="/images/icons/verify.svg"
              alt="Verified"
              width={20}
              height={20}
            />
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="px-6 pb-4 space-y-2">
        <h2 className="text-lg font-black leading-tight text-gray-900 line-clamp-1">
          {community.name}
        </h2>

        <p className="text-sm font-normal text-gray-500 line-clamp-2">
          {community.description}
        </p>

        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Image
            src="/images/icons/location.svg"
            alt="Location"
            width={20}
            height={20}
          />
          <span>{community.location || "Online"}</span>
        </div>
      </div>
    </Link>
  );
}
