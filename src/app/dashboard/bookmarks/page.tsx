/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  // Plus,
  ChevronLeft,
  ChevronRight,
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
import { useAuth } from "@/context/auth-context";
import { useBookmark, BookmarkItemType } from "@/context/bookmark-context";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InviteFriendModal } from "@/components/dashboard/invite-friend-modal";

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
  original: string;
  thumb: string;
  webp: string;
  mime_type?: string;
}

interface ApiRawItem {
  id: number | string;
  slug?: string;
  title?: string;
  name?: string;
  type?: string;
  category?: { name: string } | string;
  categories?: { name: string }[];
  images?: (ApiImage | string)[];
  image?: string;
  cover_image?: string;
  location?: string;
  address?: string;
  city?: string;
  country?: string;
  is_verified?: boolean;
  description?: string;
  bio?: string;
  start_date?: string;
  rating?: number | string;
  average_rating?: number | string;
  reviews_count?: number | string;
  ratings_count?: number | string;
}

// --- 1. ROBUST IMAGE HELPER ---
const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/no-image.jpg";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
  return `${API_URL}/${url.replace(/^\//, "")}`;
};

// --- 2. LISTING CARD (Matches BusinessCard / EventCard layout) ---
const ListingCard = ({
  item,
  onRemove,
}: {
  item: ListingItem;
  onRemove: (id: string) => void;
}) => {
  const { toggleBookmark } = useBookmark();
  const [isRemoving, setIsRemoving] = useState(false);
  const [imageSrc, setImageSrc] = useState(item.image);

  const handleRemoveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRemoving(true);

    try {
      await toggleBookmark(item.slug);
      onRemove(item.id);
    } catch (error) {
      console.error(error);
      setIsRemoving(false);
    }
  };

  if (isRemoving) {
    return (
      <div className="h-[380px] rounded-2xl border border-[#E2E8F0] bg-gray-50 flex flex-col items-center justify-center text-gray-400 animate-pulse">
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
        : `/discover/${item.slug}`;

  return (
    <Link
      href={linkPath}
      className="group block bg-white rounded-2xl overflow-hidden hover:shadow-sm transition-all duration-300 border border-[#E2E8F0]"
    >
      {/* Image Container — no dark overlay, matches BusinessCard */}
      <div className="relative w-full aspect-4/3 overflow-hidden">
        <Image
          src={imageSrc}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          unoptimized={true}
          onError={() => {
            if (imageSrc !== "/images/no-image.jpg") {
              setImageSrc("/images/no-image.jpg");
            }
          }}
        />

        {/* Bookmark Button */}
        <button
          onClick={handleRemoveClick}
          className="absolute top-2 right-2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors md:opacity-0 md:group-hover:opacity-100"
          title="Remove bookmark"
        >
          <Bookmark className="w-5 h-5 fill-blue-500 text-blue-500 transition-colors" />
        </button>
      </div>

      {/* Content Section — matches BusinessCard layout */}
      <div className="p-4 space-y-2">
        {/* Category Badge + Verified */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#64748A14] text-[#64748A] text-xs font-medium">
            {item.category}
          </span>
          {item.verified && (
            <Image
              src="/images/icons/verify.svg"
              alt="Verified"
              width={20}
              height={20}
            />
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base md:text-lg line-clamp-2 group-hover:text-[#275782] transition-colors">
          {item.title}
        </h3>

        {/* Star Rating */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.floor(item.rating || 0)
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          ))}
          <span className="text-sm text-gray-600 ml-1">
            ({item.reviews})
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
          <span>{item.location}</span>
        </div>

        {/* Date (for events) */}
        {item.date && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{item.date}</span>
          </div>
        )}
      </div>
    </Link>
  );
};

// --- Main Component ---
export default function Bookmarks() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<ListingItem[]>([]);
  const [isJoiningVendor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
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

        // Debug: log the raw API response to see available fields
        console.log("Bookmarks API response:", JSON.stringify(json, null, 2));

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
              if (typeof img === "string") return !!img;
              return !!(img && typeof img === "object" && img.original);
            })
            .map((img: any) => {
              const mediaPath = typeof img === "string" ? img : img.original;
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
              : "/images/no-image.jpg";

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
            location: item.location || item.address || "Online",
            verified: !!item.is_verified,
            description: descriptionText,
            date: item.start_date
              ? new Date(item.start_date).toLocaleDateString()
              : undefined,
            rating: Number(item.average_rating || item.rating) || 0,
            reviews: String(item.ratings_count || item.reviews_count || 0),
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

  const handleClickEvent = () => {
    if (user) {
      // Authenticated -> Go to Claim Page
      router.push("/claim");
    } else {
      // Not Authenticated -> Go to Login, then redirect to Claim Page
      router.push("/auth/login?redirect=/claim");
    }
  };

  return (
    <div className="px-1 lg:px-8 py-6 space-y-8 pb-20">
      <div className="space-y-5 mt-4 py-4">
        {/* <h3 className="text-xl font-semibold text-gray-900">
          Progress & Rewards
        </h3> */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#C9D9E8] rounded-xl p-8 flex flex-col justify-between min-h-[200px]">
            <div className="space-y-2 max-w-sm">
              <h4 className="text-lg font-semibold text-gray-900">
                Grow your business with Mefie
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Showcase your products, connect with customers, and expand your
                business in a thriving digital marketplace.
              </p>
            </div>
            <button
              onClick={handleClickEvent}
              disabled={isJoiningVendor}
              className="bg-white rounded-lg py-2 px-3 text-gray-900 hover:bg-gray-50 w-fit mt-10 border border-gray-200 shadow-sm cursor-pointer flex items-center gap-2"
            >
              {isJoiningVendor && <Loader2 className="h-4 w-4 animate-spin" />}
              {isJoiningVendor ? "Joining..." : "Join as a vendor"}
            </button>
          </div>

          <div className="bg-[#275782] rounded-xl p-8 flex flex-col justify-between min-h-[200px] relative overflow-hidden">
            <div className="relative z-10 space-y-2 max-w-sm">
              <h4 className="text-lg font-semibold text-white">
                Invite a friend and help them discover Mefie and both of you get
                a reward.
              </h4>
            </div>
            <div className="absolute right-0 bottom-0 opacity-20 md:opacity-100">
              <Image
                src="/images/backgroundImages/present.svg"
                alt="Gift Box"
                width={220}
                height={220}
                className="object-contain"
              />
            </div>
            <button
              onClick={() => setInviteOpen(true)}
              className="bg-white rounded-lg py-2 px-3 text-gray-900 hover:bg-gray-50 w-fit mt-10 border border-gray-200 shadow-sm cursor-pointer"
            >
              Invite a friend
            </button>
          </div>
        </div>
      </div>

      <InviteFriendModal open={inviteOpen} onOpenChange={setInviteOpen} />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookmarks</h1>
          <p className="text-gray-500 mt-1">
            All your saved bookmarks are lodged here!
          </p>
        </div>
        {/* <Button className="bg-[#93C01F] hover:bg-[#7fa818] text-white gap-2 h-11 px-6 shadow-sm">
          <Plus className="w-5 h-5" />
          Add new bookmark
        </Button> */}
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
                    : "bg-transparent text-gray-700 hover:bg-gray-100",
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
                      : "bg-transparent text-gray-700 hover:bg-gray-100",
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
