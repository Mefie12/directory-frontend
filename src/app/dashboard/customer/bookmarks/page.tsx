"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Star,
  CheckCircle,
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
import { useBookmark, BookmarkItemType } from "@/context/bookmark-context"; // Import Type
import { cn } from "@/lib/utils";

// --- Types ---
interface ListingItem {
  id: string;
  title: string;
  type: BookmarkItemType; // Use strict type from context
  category: string;
  image: string;
  location: string;
  verified: boolean;
  description?: string;
  date?: string;
  rating?: number;
  reviews?: string;
}

// Raw API Interface
interface ApiRawItem {
  id: number | string;
  slug: string;
  title?: string;
  name?: string;
  type?: string;
  category?: { name: string } | string;
  image?: string;
  cover_image?: string;
  location?: string;
  is_verified?: boolean;
  description?: string;
  start_date?: string;
  rating?: number | string;
  reviews_count?: number | string;
}

// --- Reusable Listing Card ---
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
      // FIX 1: Pass only ID/Slug if context expects one arg,
      // OR update context to accept type.
      // Assuming context signature is toggleBookmark(slug: string) based on previous error.
      // If you updated context to accept (slug, type), this is fine.
      // If error persists, it means context definition is still (slug: string).

      // Attempting call with single argument first to match likely context definition:
      await toggleBookmark(item.id);

      // Update Parent UI
      onRemove(item.id);
    } catch (error) {
      console.error(error);
      setIsRemoving(false);
    }
  };

  if (isRemoving) {
    return (
      <div className="h-80 rounded-xl border border-gray-100 bg-gray-50 flex flex-col items-center justify-center text-gray-400 animate-pulse">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <span className="text-sm">Removing...</span>
      </div>
    );
  }

  return (
    <div className="group relative rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all">
      <button
        onClick={handleRemoveClick}
        className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 backdrop-blur-md border border-gray-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all shadow-sm group-hover:scale-105"
        title="Remove bookmark"
      >
        <Bookmark className="w-5 h-5 fill-blue-600 text-blue-600 hover:fill-red-500 hover:text-red-500 transition-colors" />
      </button>

      <div className="relative h-48 w-full bg-gray-200">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover"
          unoptimized={true}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/images/placeholders/generic.jpg";
          }}
        />

        {item.type === "event" && (
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-xl font-bold line-clamp-1">
                {item.title}
              </h3>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/90 text-black hover:bg-white border-none">
                  {item.category}
                </Badge>
                {item.verified && (
                  <CheckCircle className="w-5 h-5 text-green-500 fill-white" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {item.type === "business" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                {item.category}
              </Badge>
              {item.verified && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>
            <h3 className="font-semibold text-gray-900 text-base line-clamp-1">
              {item.title}
            </h3>
            <div className="flex items-center gap-1">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.floor(item.rating || 0)
                        ? "fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">
                ({item.reviews || "0"})
              </span>
            </div>
          </div>
        )}

        {item.type === "event" && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="space-y-2 pt-1 border-t border-gray-50 mt-2">
          <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="line-clamp-1">{item.location}</span>
          </div>
          {item.date && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{item.date}</span>
            </div>
          )}
        </div>
      </div>
    </div>
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
        const API_URL = process.env.API_URL || "https://me-fie.co.uk";
        const response = await fetch(`${API_URL}/api/my_bookmarks`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch bookmarks");

        const json = await response.json();
        const rawData: ApiRawItem[] = json.data || [];

        const mappedData: ListingItem[] = rawData.map((item) => {
          // FIX 2: Safely cast type string to BookmarkItemType
          let itemType: BookmarkItemType = "business";
          if (item.type === "event" || item.type === "community") {
            itemType = item.type;
          }

          return {
            id: item.id.toString(),
            title: item.title || item.name || "Untitled",
            type: itemType, // Use strict type
            category:
              typeof item.category === "object"
                ? item.category?.name || "General"
                : item.category || "General",
            image:
              item.image ||
              item.cover_image ||
              "/images/placeholders/generic.jpg",
            location: item.location || "Online",
            verified: !!item.is_verified,
            description: item.description || "",
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

  const totalItems = bookmarks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = bookmarks.slice(startIndex, endIndex);

  return (
    <div className="px-1 lg:px-8 py-6 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookmarks</h1>
          <p className="text-gray-500 mt-1">
            All your saved bookmarks are lodged here!
          </p>
        </div>
        <Button className="bg-[#93C01F] hover:bg-[#7fa818] text-white gap-2 h-11 px-6">
          <Plus className="w-5 h-5" />
          Add new bookmark
        </Button>
      </div>

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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 bg-gray-100 animate-pulse rounded-xl"
            />
          ))}
        </div>
      ) : (
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

      {!isLoading && bookmarks.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-4">
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
              className="rounded-full h-10 w-10 border-gray-200"
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
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 border-gray-200"
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
