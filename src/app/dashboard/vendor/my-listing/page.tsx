"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { ListingsTable } from "@/components/dashboard/listing-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- API Response Interfaces ---
interface ListingImage {
  id: number;
  media: string | null;
  media_type: string;
  file_size: number;
  file_size_formatted: string;
  mime_type: string;
  is_compressed: number;
  compression_status: string;
  created_at: string;
  updated_at: string;
}

interface OpeningHour {
  id: number;
  listing_id: number;
  day_of_week: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface Social {
  id: number;
  listing_id: number;
  facebook: string;
  instagram: string;
  twitter: string;
  tiktok: string;
  youtube: string;
}

interface Service {
  id: number;
  listing_id: number;
  name: string;
  description: string;
}

interface Category {
  id: number;
  name: string;
  parent_id: string | null;
  type: "mainCategory" | "subCategory";
  description: string;
}

interface CompressionMeta {
  total_files: number;
  compressed_files: number;
  pending_compression: number;
  compression_progress: number;
  total_size: string;
  compressed_size: string;
  has_pending_compression: boolean;
}

interface ApiListing {
  id: number;
  name: string;
  slug: string;
  bio: string;
  address: string;
  country: string;
  city: string;
  primary_phone: string;
  secondary_phone: string;
  email: string;
  google_plus_code: string;
  business_reg_num: string;
  website: string;
  images: ListingImage[];
  opening_hours: OpeningHour[];
  socials: Social[];
  services: Service[];
  categories: Category[];
  rating: number;
  ratings_count: number;
  views_count: number;
  unique_visitors_count: number;
  authenticated_viewers_count: number;
  guest_viewers_count: number;
  bookmarks_count: number; // ✅ Included API field
  created_at: string;
  updated_at: string;
  status: "pending" | "published" | "draft" | "rejected";
  compression_meta: CompressionMeta;
}

interface ApiResponse {
  data: ApiListing[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    path: string;
    per_page: number;
    next_cursor: string | null;
    prev_cursor: string | null;
  };
}

// --- Table Component Interface ---
interface ListingsTableItem {
  id: string;
  name: string;
  image: string;
  category: string;
  location: string;
  status: "published" | "pending" | "drafted";
  views: number;
  comments: number;
  bookmarks: number;
  rating: number;
}

export default function MyListing() {
  const router = useRouter();
  const [listings, setListings] = useState<ListingsTableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch listings from API
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("authToken");
        if (!token) {
          // Optional: Redirect to login logic here
          throw new Error("Authentication required");
        }

        const API_URL = process.env.API_URL || "https://me-fie.co.uk";
        const response = await fetch(`${API_URL}/api/listing/my_listings`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Session expired. Please login again.");
          }
          throw new Error(`Failed to fetch listings: ${response.status}`);
        }

        const data: ApiResponse = await response.json();

        // Transform API data to match ListingsTable component format
        const transformedListings: ListingsTableItem[] = data.data.map(
          (listing) => {
            // 1. Image Handling: Safely find the first valid image URL
            const validImages = listing.images.filter(
              (img) =>
                img.media && // Ensure not null
                typeof img.media === "string" && // Ensure string
                img.media !== "processing" && // Ensure not stuck in processing
                img.media.startsWith("http") // Ensure valid URL
            );

            const firstImage =
              validImages.length > 0 && validImages[0].media
                ? validImages[0].media
                : "/images/placeholders/generic-business.jpg"; // Safe fallback

            // 2. Category Handling
            const mainCategories = listing.categories
              .filter((cat) => cat.parent_id === null)
              .map((cat) => cat.name)
              .join(", ");

            const categoryText = mainCategories || "Uncategorized";

            // 3. Location Handling
            const locationParts = [listing.city, listing.country].filter(
              Boolean
            );
            const location =
              locationParts.length > 0 ? locationParts.join(", ") : "Online";

            // 4. Status Mapping
            let status: "published" | "pending" | "drafted" = "drafted";
            const lowerStatus = listing.status.toLowerCase();
            if (lowerStatus === "published") status = "published";
            else if (lowerStatus === "pending") status = "pending";
            // Map 'rejected' or 'draft' to 'drafted' UI state
            else status = "drafted";

            return {
              id: listing.id.toString(),
              name: listing.name,
              image: firstImage,
              category: categoryText,
              location: location,
              status: status,
              views: listing.views_count || 0,
              comments: listing.ratings_count || 0,
              bookmarks: listing.bookmarks_count || 0, // ✅ Using correct API field
              rating: Number(listing.rating) || 0,
            };
          }
        );

        setListings(transformedListings);
      } catch (err) {
        console.error("Error fetching listings:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load listings"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  return (
    <div className="px-1 lg:px-8 py-3 space-y-6">
      {/* Header Intro */}
      <div className="flex flex-col md:flex-row lg:items-center justify-between">
        <div className="mb-4">
          <h4 className="text-2xl font-semibold">My Listings</h4>
          <p className="text-sm text-gray-500 mt-1">
            Manage your business, events, and community listings
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="bg-[#93C01F] py-3.5 px-4 hover:bg-[#93C01F]/80 cursor-pointer gap-2"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              Add new listing
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="shadow-lg border border-gray-100 -mt-1 w-56"
            align="end"
          >
            <DropdownMenuItem
              className="cursor-pointer py-2.5"
              onClick={() =>
                router.push("/dashboard/vendor/my-listing/create?type=business")
              }
            >
              <span className="border bg-[#93C01F]/30 text-[#93C01F] rounded-full px-2 py-0.5 text-xs font-medium mr-2">
                1
              </span>
              Business Listing
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer py-2.5"
              onClick={() =>
                router.push("/dashboard/vendor/my-listing/create?type=event")
              }
            >
              <span className="border bg-[#93C01F]/30 text-[#93C01F] rounded-full px-2 py-0.5 text-xs font-medium mr-2">
                2
              </span>
              Event Listing
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer py-2.5"
              onClick={() =>
                router.push(
                  "/dashboard/vendor/my-listing/create?type=community"
                )
              }
            >
              <span className="border bg-[#93C01F]/30 text-[#93C01F] rounded-full px-2 py-0.5 text-xs font-medium mr-2">
                3
              </span>
              Community Listing
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* States */}

      {/* 1. Loading */}
      {loading && (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#93C01F]" />
            <p className="text-gray-500 font-medium">
              Loading your listings...
            </p>
          </div>
        </div>
      )}

      {/* 2. Error
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Error loading listings</p>
            <p className="text-sm mt-1 opacity-90">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 bg-white hover:bg-gray-50 border-red-200 text-red-700"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </div>
      )} */}

      {/* 3. Success (Table or Empty) */}
      {!loading && !error && (
        <>
          {listings.length > 0 ? (
            <ListingsTable
              listings={listings}
              showPagination={true}
              button={false}
              itemsPerPage={6}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                No listings yet
              </h3>
              <p className="text-gray-500 mb-6 max-w-sm text-center">
                You haven&apos;t created any listings yet. Get started by adding
                your first business, event, or community.
              </p>
              <Button
                className="bg-[#93C01F] hover:bg-[#93C01F]/80"
                onClick={() =>
                  router.push(
                    "/dashboard/vendor/my-listing/create?type=business"
                  )
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Listing
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
