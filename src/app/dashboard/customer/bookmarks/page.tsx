/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Star,
  Heart,
  Bookmark,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { useBookmark, BookmarkItemType } from "@/context/bookmark-context";
import { cn } from "@/lib/utils";
import Link from "next/link";

// --- Types ---
interface ListingItem {
  id: string;
  title: string;
  type: BookmarkItemType;
  category: string;
  image: string;
  location: string;
  verified: boolean;
  description?: string;
  date?: string;
  rating?: number;
  reviews?: string;
  slug: string; // Ensure this is always a string
}

interface ApiImage {
  id?: number;
  media: string;
  media_type?: string;
}

interface ApiRawItem {
  id: number | string;
  slug?: string; // API might return null/undefined
  title?: string;
  name?: string;
  type?: string;
  category?: { name: string } | string;
  categories?: { name: string }[];
  images?: (ApiImage | string)[];
  image?: string;
  cover_image?: string;
  location?: string;
  is_verified?: boolean;
  description?: string;
  bio?: string;
  start_date?: string;
  rating?: number | string;
  reviews_count?: number | string;
}

// --- 1. ROBUST IMAGE HELPER ---
const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/placeholders/generic.jpg";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
  return `${API_URL}/${url.replace(/^\//, "")}`;
};

// --- 2. LISTING CARD ---
const ListingCard = ({
  item,
  onRemove,
}: {
  item: ListingItem;
  onRemove: (id: string) => void;
}) => {
  const { toggleBookmark } = useBookmark();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRemoving(true);

    try {
      // We toggle using the ID (or slug, depending on your context requirement)
      // Usually, removal by ID is safer for local state updates
      await toggleBookmark(item.slug);
      onRemove(item.id);
    } catch (error) {
      console.error(error);
      setIsRemoving(false);
    }
  };

  if (isRemoving) {
    return (
      <div className="h-[380px] rounded-2xl border border-gray-100 bg-gray-50 flex flex-col items-center justify-center text-gray-400 animate-pulse">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <span className="text-sm">Removing...</span>
      </div>
    );
  }

  const linkPath =
    item.type === "event"
      ? `/events/${item.slug}`
      : item.type === "community"
      ? `/communities/${item.slug}`
      : `/discover/${item.slug}`; // Default to discover/business

  return (
    <Link
      href={linkPath}
      className="group bg-white rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100 h-full flex flex-col"
    >
      {/* Image Container */}
      <div className="relative w-full aspect-4/3 overflow-hidden bg-gray-100">
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized={true}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.includes("generic.jpg")) {
              target.src = "/images/placeholders/generic.jpg";
            }
          }}
        />

        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-80" />

        {/* Top Right: Bookmark Button */}
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={handleRemoveClick}
            className="p-2 rounded-full bg-white/90 backdrop-blur-md shadow-sm hover:bg-red-50 group/btn transition-colors"
            title="Remove bookmark"
          >
            <Bookmark className="w-4 h-4 fill-blue-600 text-blue-600 group-hover/btn:fill-red-500 group-hover/btn:text-red-500 transition-colors" />
          </button>
        </div>

        {/* Bottom: Name & Badge */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20 flex flex-col justify-end">
          <div className="flex justify-between items-end gap-2 w-full">
            {/* Title Section */}
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-lg text-white line-clamp-1">
                  {item.title}
                </h3>
                {item.verified && (
                  <Image
                    src="/images/icons/verify.svg"
                    alt="Verified"
                    width={16}
                    height={16}
                    className="shrink-0"
                  />
                )}
              </div>
            </div>

            {/* Badge Section */}
            <Badge className="shrink-0 bg-white/90 text-gray-900 hover:bg-white border-0 px-2.5 py-1 text-xs font-medium">
              {item.category}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Description */}
        {item.description ? (
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed h-10">
            {item.description}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic h-10">
            No description available
          </p>
        )}

        <div className="mt-auto pt-3 flex flex-col gap-2">
          {/* Rating Row */}
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-3.5 h-3.5",
                    i < Math.floor(item.rating || 0)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-100 text-gray-200"
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-gray-700">
              {item.rating?.toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">({item.reviews})</span>
          </div>

          {/* Location & Date Row */}
          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-50 pt-3 mt-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="line-clamp-1 max-w-[140px]">
                {item.location}
              </span>
            </div>

            {item.date && (
              <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-medium">{item.date}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

// --- Main Component ---
export default function Bookmarks() {
  const { user, loading: authLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<ListingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (authLoading) return;

      const token = localStorage.getItem("authToken");
      if (!user || !token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

        const response = await fetch(`${API_URL}/api/my_bookmarks`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch bookmarks");

        const json = await response.json();

        // --- Handle Various API Response Structures ---
        let rawData: ApiRawItem[] = [];
        if (json.bookmarks && Array.isArray(json.bookmarks.data)) {
          rawData = json.bookmarks.data;
        } else if (Array.isArray(json.data)) {
          rawData = json.data;
        } else if (Array.isArray(json.bookmarks)) {
          rawData = json.bookmarks;
        } else if (Array.isArray(json)) {
          rawData = json;
        }

        const mappedData: ListingItem[] = rawData.map((item) => {
          let itemType: BookmarkItemType = "business";
          if (item.type === "event" || item.type === "community") {
            itemType = item.type;
          }

          // --- FIX: Robust Category ---
          let categoryName = "General";
          if (Array.isArray(item.categories) && item.categories.length > 0) {
            categoryName = item.categories[0].name;
          } else if (
            item.category &&
            typeof item.category === "object" &&
            "name" in item.category
          ) {
            categoryName = (item.category as any).name;
          } else if (typeof item.category === "string") {
            categoryName = item.category;
          }

          // --- FIX: Description Fallback ---
          const descriptionText = item.bio || item.description || "";

          // --- FIX: Robust Image ---
          const rawImages = Array.isArray(item.images) ? item.images : [];
          const validImages = rawImages
            .filter((img: any) => {
              if (typeof img === "string") return true;
              if (img && typeof img === "object" && img.media) {
                const badStatuses = [
                  "processing",
                  "failed",
                  "pending",
                  "error",
                ];
                return !badStatuses.includes(img.media);
              }
              return false;
            })
            .map((img: any) => {
              const mediaPath = typeof img === "string" ? img : img.media;
              return getImageUrl(mediaPath);
            });

          if (validImages.length === 0) {
            if (item.image) validImages.push(getImageUrl(item.image));
            else if (item.cover_image)
              validImages.push(getImageUrl(item.cover_image));
          }

          const finalImage =
            validImages.length > 0
              ? validImages[0]
              : "/images/placeholders/generic.jpg";

          // --- FIX: Slug Fallback to ID ---
          // This ensures if slug is null, the ID is used for routing
          const finalSlug = item.slug || String(item.id);

          return {
            id: String(item.id),
            slug: finalSlug, // Uses ID if slug is missing
            title: item.title || item.name || "Untitled",
            type: itemType,
            category: categoryName,
            image: finalImage,
            location: item.location || "Online",
            verified: !!item.is_verified,
            description: descriptionText,
            date: item.start_date
              ? new Date(item.start_date).toLocaleDateString()
              : undefined,
            rating: Number(item.rating) || 0,
            reviews: item.reviews_count ? String(item.reviews_count) : "0",
          };
        });

        setBookmarks(mappedData);
      } catch (e) {
        console.error("Error fetching bookmarks:", e);
        setBookmarks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, [user, authLoading]);

  const handleRemoveFromList = (idToRemove: string) => {
    setBookmarks((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  // Pagination Logic
  const totalItems = bookmarks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = bookmarks.slice(startIndex, endIndex);

  return (
    <div className="px-1 lg:px-8 py-6 space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookmarks</h1>
          <p className="text-gray-500 mt-1">
            All your saved bookmarks are lodged here!
          </p>
        </div>
        <Button className="bg-[#93C01F] hover:bg-[#7fa818] text-white gap-2 h-11 px-6 shadow-sm">
          <Plus className="w-5 h-5" />
          Add new bookmark
        </Button>
      </div>

      {/* Sort Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">My Collection</h2>
            <p className="text-gray-500 text-sm mt-1">
              This has been grouped based on your picks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select defaultValue="newest">
              <SelectTrigger className="w-52 bg-white">
                <span className="text-gray-500 mr-2">Sort by</span>
                <SelectValue placeholder="Newest" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest Saved</SelectItem>
                <SelectItem value="oldest">Oldest Saved</SelectItem>
                <SelectItem value="rating">A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[380px] bg-gray-100 animate-pulse rounded-2xl"
            />
          ))}
        </div>
      ) : (
        /* Data Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentItems.length > 0 ? (
            currentItems.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                onRemove={handleRemoveFromList}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <div className="flex flex-col items-center justify-center">
                <Heart className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900">
                  No bookmarks yet
                </h3>
                <p className="text-gray-500">
                  Items you bookmark will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination Footer */}
      {!isLoading && bookmarks.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-4 border-t border-gray-100 mt-4">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {startIndex + 1}-{Math.min(endIndex, totalItems)}
            </span>{" "}
            from <span className="font-bold text-gray-900">{totalItems}</span>{" "}
            data
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 border-gray-200 hover:bg-gray-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-2">
              <Button
                className={cn(
                  "rounded-full h-10 w-10 p-0 font-medium",
                  currentPage === 1
                    ? "bg-[#93C01F] hover:bg-[#82ab1b] text-white"
                    : "bg-transparent text-gray-700 hover:bg-gray-100"
                )}
                onClick={() => setCurrentPage(1)}
              >
                1
              </Button>
              {totalPages > 1 && (
                <Button
                  className={cn(
                    "rounded-full h-10 w-10 p-0 font-medium",
                    currentPage === 2
                      ? "bg-[#93C01F] hover:bg-[#82ab1b] text-white"
                      : "bg-transparent text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => setCurrentPage(2)}
                >
                  2
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 border-gray-200 hover:bg-gray-50"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
