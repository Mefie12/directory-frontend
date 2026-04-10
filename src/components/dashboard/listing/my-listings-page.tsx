"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, SpinnerGap } from "@phosphor-icons/react";

import { ListingsTable } from "@/components/dashboard/listing/listing-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { useRolePath } from "@/hooks/useRolePath";

// --- Interfaces ---

interface ListingImage {
  id: number;
  media: string | null;
  media_type: string;
}

interface Category {
  id: number;
  name: string;
}

interface ApiListing {
  id: number;
  name: string;
  slug: string;
  bio: string;
  address: string;
  country: string;
  city: string;
  status: string;
  type?: string;
  images: ListingImage[];
  categories: Category[];
  rating: number;
  ratings_count: number;
  views_count: number;
  bookmarks_count: number;
}

interface ApiResponse {
  data: ApiListing[];
  meta?: unknown;
}

interface ListingsTableItem {
  id: string;
  slug: string;
  name: string;
  image: string;
  allImages: string[];
  category: string;
  location: string;
  status: "published" | "pending" | "drafted";
  type: string;
  views: number;
  comments: number;
  bookmarks: number;
  rating: number;
  description?: string;
}

const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/placeholder-listing.png";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const API_URL = process.env.API_URL || "https://me-fie.co.uk";
  return `${API_URL}/${url.replace(/^\//, "")}`;
};

export default function MyListingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { listingCreate, listingEdit, listingDetail } = useRolePath();

  const [listings, setListings] = useState<ListingsTableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteListingId, setDeleteListingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Authentication required");

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
        if (response.status === 401) throw new Error("Session expired");
        throw new Error("Failed to fetch listings");
      }

      const data: ApiResponse = await response.json();

      const transformedListings: ListingsTableItem[] = data.data.map(
        (listing) => {
          const rawImages = listing.images || [];
          const validImages = rawImages
            .filter((img) => {
              if (!img.media) return false;
              const badStatuses = ["processing", "failed", "pending", "error"];
              if (badStatuses.includes(img.media)) return false;
              return true;
            })
            .map((img) => getImageUrl(img.media));

          const coverImage =
            validImages.length > 0
              ? validImages[0]
              : getImageUrl("/images/placeholder-listing.png");

          const categoryText =
            listing.categories?.[0]?.name || "Uncategorized";
          const location =
            [listing.city, listing.country].filter(Boolean).join(", ") ||
            "Online";

          let status: "published" | "pending" | "drafted" = "drafted";
          const backendStatus = (listing.status || "").toLowerCase();

          if (["published", "active", "approved"].includes(backendStatus)) {
            status = "published";
          } else if (backendStatus === "pending") {
            status = "pending";
          }

          let resolvedType = listing.type;
          if (!resolvedType && listing.categories?.length > 0) {
            const catName = listing.categories[0].name.toLowerCase();
            if (["community", "event"].includes(catName)) {
              resolvedType = catName;
            }
          }

          return {
            id: listing.id.toString(),
            slug: listing.slug,
            name: listing.name,
            image: coverImage,
            allImages: validImages,
            category: categoryText,
            location: location,
            status: status,
            type: resolvedType || "business",
            views: listing.views_count || 0,
            comments: listing.ratings_count || 0,
            bookmarks: listing.bookmarks_count || 0,
            rating: Number(listing.rating) || 0,
            description: listing.bio,
          };
        },
      );

      setListings(transformedListings);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) fetchListings();
  }, [user, authLoading, fetchListings]);

  const handleDelete = async () => {
    if (!deleteListingId) return;
    setIsDeleting(true);

    try {
      const token = localStorage.getItem("authToken");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
      const listingToDelete = listings.find((l) => l.id === deleteListingId);

      if (!listingToDelete) {
        toast.error("Listing not found for deletion");
        return;
      }

      const identifier = listingToDelete.slug || listingToDelete.id;

      const res = await fetch(`${API_URL}/api/listing/${identifier}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Delete failed with status: ${res.status}`,
        );
      }

      toast.success("Listing deleted successfully");
      setListings((prev) => prev.filter((l) => l.id !== deleteListingId));
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete listing",
      );
    } finally {
      setIsDeleting(false);
      setDeleteListingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-[#93C01F]" />
      </div>
    );
  }

  return (
    <div className="px-1 lg:px-8 py-3 space-y-6">
      <div className="flex flex-col md:flex-row lg:items-center justify-between">
        <div className="mb-4">
          <h4 className="text-2xl font-semibold">My Listings</h4>
          <p className="text-sm text-gray-500 mt-1">Manage your listings</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-[#93C01F] hover:bg-[#93C01F]/80 gap-2">
              <Plus className="w-4 h-4" /> Add new listing
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["business", "event", "community"].map((type, index) => (
              <DropdownMenuItem
                key={type}
                onClick={() => router.push(listingCreate(type))}
                className="capitalize cursor-pointer"
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#93C01F] text-white text-xs font-medium">
                  {index + 1}
                </span>
                {type} Listing
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {listings.length > 0 ? (
        <ListingsTable
          listings={listings}
          showPagination={true}
          itemsPerPage={6}
          onViewClick={(listing) => router.push(listingDetail(listing.slug))}
          onEditClick={(listing) =>
            router.push(listingEdit(listing.type, listing.slug))
          }
          onDeleteClick={(id: string) => setDeleteListingId(id)}
          onWhatWeDoClick={(listing) =>
            router.push(`${listingDetail(listing.slug)}?tab=services`)
          }
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl bg-gray-50">
          <p className="text-gray-500">No listings yet</p>
        </div>
      )}

      <AlertDialog
        open={!!deleteListingId}
        onOpenChange={(open) => !open && setDeleteListingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
