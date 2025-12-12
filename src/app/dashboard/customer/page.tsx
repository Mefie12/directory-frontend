"use client";

import { useState, useEffect } from "react";
import {
  Bookmark,
  TrendingDown,
  TrendingUp,
  Mail,
  Calendar,
  MapPin,
  Star,
  CheckCircle,
} from "lucide-react";
import StatCard from "@/components/dashboard/stat-cards";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

// --- Types ---
interface ListingItem {
  id: string;
  title: string;
  type: "event" | "business" | "community";
  category: string;
  image: string;
  location: string;
  verified: boolean;
  description?: string;
  date?: string;
  rating?: number;
  reviews?: string;
}

interface ApiRawItem {
  id: number | string;
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

// --- Listing Card ---
const ListingCard = ({ item }: { item: ListingItem }) => {
  return (
    <div className="group rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-48 w-full bg-gray-200">
        <Image
          src={item.image || "/images/placeholders/generic.jpg"}
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
              <Badge
                variant="secondary"
                className="bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
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

        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2 text-xs text-gray-500">
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

// --- Skeleton ---
const CardSkeleton = () => (
  <div className="rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm h-80 animate-pulse">
    <div className="h-48 w-full bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 w-20 bg-gray-200 rounded" />
      <div className="h-6 w-3/4 bg-gray-200 rounded" />
      <div className="h-4 w-1/2 bg-gray-200 rounded" />
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [bookmarks, setBookmarks] = useState<ListingItem[]>([]);
  const [eventsNearMe, setEventsNearMe] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("authToken");

        // 1. If no token yet, don't fetch (but don't stop forever, the effect will re-run when `user` changes)
        if (!token) return;

        // 2. FIX: Use NEXT_PUBLIC_ for client-side access
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

        const [bookmarksRes, eventsRes] = await Promise.all([
          fetch(`${API_URL}/api/my_bookmarks`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }),
          fetch(`${API_URL}/api/events/recommended`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }),
        ]);

        if (bookmarksRes.ok) {
          const json = await bookmarksRes.json();
          // Debugging: Log what the API actually returned
          console.log("Bookmarks Data:", json);

          const rawData: ApiRawItem[] = json.data || [];

          const mappedBookmarks: ListingItem[] = rawData.map((item) => {
            let validParamsType: "business" | "event" | "community" =
              "business";
            const typeStr = item.type?.toLowerCase();
            if (typeStr === "event" || typeStr === "community") {
              validParamsType = typeStr;
            }

            return {
              id: item.id.toString(),
              title: item.title || item.name || "Untitled",
              type: validParamsType,
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
              description: item.description,
              date: item.start_date
                ? `${new Date(item.start_date).toLocaleDateString()}`
                : undefined,
              rating: Number(item.rating) || 0,
              reviews: item.reviews_count ? `${item.reviews_count}` : "0",
            };
          });
          setBookmarks(mappedBookmarks);
        } else {
          console.error("Bookmarks fetch failed:", await bookmarksRes.text());
        }

        if (eventsRes.ok) {
          const json = await eventsRes.json();
          const rawData: ApiRawItem[] = json.data || [];
          const mappedEvents: ListingItem[] = rawData.map((item) => ({
            id: item.id.toString(),
            title: item.title || item.name || "Untitled Event",
            type: "event",
            category:
              typeof item.category === "object"
                ? item.category?.name || "Event"
                : item.category || "Event",
            image:
              item.image ||
              item.cover_image ||
              "/images/placeholders/generic.jpg",
            location: item.location || "TBD",
            verified: !!item.is_verified,
            description: item.description,
            date: item.start_date
              ? `${new Date(item.start_date).toLocaleDateString()}`
              : undefined,
          }));
          setEventsNearMe(mappedEvents);
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    // 3. Only run fetch if we have a user (meaning auth is likely ready)
    if (user) {
      fetchDashboardData();
    }
  }, [user]); // 4. FIX: Added 'user' to dependencies so it re-runs when auth completes

  return (
    <div className="px-1 lg:px-8 py-3 space-y-8 pb-20">
      {/* Header Intro */}
      <div className="flex flex-col md:flex-row lg:items-center justify-between">
        <div className="mb-4">
          <h4 className="text-2xl font-semibold text-gray-900">
            Welcome back, {user?.name || "User"}!
          </h4>
          <p className="text-base text-gray-500">
            Here is what&apos;s happening with your listings
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Bookmarks"
          icon={Bookmark}
          statValue={bookmarks.length}
          trend={5}
          trendIconUp={TrendingUp}
          trendIconDown={TrendingDown}
        />
        <StatCard
          title="Inquiries Received"
          icon={Mail}
          statValue={45}
          trend={18}
          trendIconUp={TrendingUp}
          trendIconDown={TrendingDown}
        />
        <StatCard
          title="Events"
          icon={Calendar}
          statValue={eventsNearMe.length}
          trend={-8}
          trendIconUp={TrendingUp}
          trendIconDown={TrendingDown}
        />
      </div>

      {/* Progress & Rewards Section */}
      <div className="space-y-5 mt-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Progress & Rewards
        </h3>
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
            <Button
              onClick={() => router.push("/become-a-vendor")}
              className="bg-white text-gray-900 hover:bg-gray-50 w-fit mt-10 border border-gray-200 shadow-sm"
            >
              Join as a vendor
            </Button>
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
            <Button className="bg-white text-gray-900 hover:bg-gray-100 w-fit mt-6 relative z-10">
              Invite a friend
            </Button>
          </div>
        </div>
      </div>

      {/* Saved Bookmarks Section */}
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Saved Bookmarks
            </h3>
            <p className="text-base text-gray-500">
              All your favourite listings in one place
            </p>
          </div>
          <Link
            href="/dashboard/customer/bookmarks"
            className="text-sm text-[#5F8B0A] hover:underline font-medium"
          >
            See more bookmarks
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? [1, 2, 3].map((n) => <CardSkeleton key={n} />)
            : bookmarks
                .slice(0, 3)
                .map((item) => <ListingCard key={item.id} item={item} />)}
          {!loading && bookmarks.length === 0 && (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Bookmark className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-gray-900 font-medium">No bookmarks yet</h3>
              <p className="text-gray-500 text-sm">
                Save listings to see them here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Events Near Me Section */}
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Events near me
            </h3>
            <p className="text-base text-gray-500">
              This has been grouped based on your picks
            </p>
          </div>
          <Link
            href="/events"
            className="text-sm text-[#5F8B0A] hover:underline font-medium"
          >
            Explore Events
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? [1, 2, 3].map((n) => <CardSkeleton key={n} />)
            : eventsNearMe.map((item) => (
                <ListingCard key={item.id} item={item} />
              ))}
          {!loading && eventsNearMe.length === 0 && (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-gray-900 font-medium">
                No events found nearby
              </h3>
              <p className="text-gray-500 text-sm">
                Check back later for upcoming events.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
