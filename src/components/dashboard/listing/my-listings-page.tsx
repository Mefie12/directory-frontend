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
import { Input } from "@/components/ui/input";

// --- Interfaces ---

interface ListingImage {
  id: number;
  original: string;
  thumb: string;
  webp: string;
  mime_type?: string;
}

interface Category {
  id: number;
  name: string;
}

interface ApiListing {
  id?: number;
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
  listing_verified?: boolean;
  is_verified?: boolean;
}

interface ApiMeta {
  current_page: number;
  last_page: number;
  total: number;
}

interface ApiResponse {
  data: ApiListing[];
  meta?: ApiMeta;
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
  verified: boolean;
  views: number;
  comments: number;
  bookmarks: number;
  rating: number;
  description?: string;
}

const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/no-image.jpg";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
  return `${API_URL}/${url.replace(/^\//, "")}`;
};

export default function MyListingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { listingCreate, listingEdit, listingDetail } = useRolePath();

  const [listings, setListings] = useState<ListingsTableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteListingId, setDeleteListingId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchListings = useCallback(async (page = 1) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Authentication required");

      const response = await fetch(`/api/listing/my_listings?page=${page}`, {
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
      // Handle: { data: [...] }  OR  { data: { data: [...] } }  OR  { listings: [...] }
      let rawListings: ApiListing[] = [];
      let meta: ApiMeta | undefined;
      if (Array.isArray(data?.data)) {
        rawListings = data.data;
        meta = data.meta;
      } else if (Array.isArray((data as any)?.data?.data)) {
        rawListings = (data as any).data.data;
        meta = (data as any)?.data?.meta;
      } else if (Array.isArray((data as any)?.listings)) {
        rawListings = (data as any).listings;
      }

      if (meta) {
        setCurrentPage(meta.current_page);
        setTotalPages(meta.last_page);
      }

      const transformedListings: ListingsTableItem[] = rawListings.map(
        (listing) => {
          const rawImages = listing.images || [];
          const validImages = rawImages
            .filter((img) => !!img.original)
            .map((img) => getImageUrl(img.original));

          const coverImage =
            validImages.length > 0
              ? validImages[0]
              : getImageUrl("/images/no-image.jpg");

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
            id: listing.id?.toString() ?? listing.slug,
            slug: listing.slug,
            name: listing.name,
            image: coverImage,
            allImages: validImages,
            category: categoryText,
            location: location,
            status: status,
            type: resolvedType || "business",
            verified: !!(listing.listing_verified ?? listing.is_verified ?? false),
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
    if (!authLoading && user) fetchListings(currentPage);
  }, [user, authLoading, fetchListings, currentPage]);

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
      setDeleteConfirmName("");
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
        <>
          <ListingsTable
            listings={listings}
            showPagination={false}
            itemsPerPage={listings.length}
            onViewClick={(listing) => router.push(listingDetail(listing.slug))}
            onEditClick={(listing) =>
              router.push(listingEdit(listing.type, listing.slug))
            }
            onDeleteClick={(id: string) => setDeleteListingId(id)}
            onWhatWeDoClick={(listing) =>
              router.push(`${listingDetail(listing.slug)}?tab=services`)
            }
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl bg-gray-50">
          <p className="text-gray-500">No listings yet</p>
        </div>
      )}

      <AlertDialog
        open={!!deleteListingId}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteListingId(null);
            setDeleteConfirmName("");
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Delete listing
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-sm text-gray-500">
                <p>
                  This will permanently delete{" "}
                  <span className="font-semibold text-gray-900">
                    {listings.find((l) => l.id === deleteListingId)?.name}
                  </span>
                  . This action{" "}
                  <span className="font-semibold text-gray-900">
                    cannot be undone
                  </span>
                  .
                </p>
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-red-700 text-xs leading-relaxed">
                  All associated data — images, services, reviews, and
                  stats — will be permanently removed.
                </div>
                <div className="space-y-1.5">
                  <p>
                    To confirm, type{" "}
                    <span className="font-semibold text-gray-900 font-mono">
                      {listings.find((l) => l.id === deleteListingId)?.name}
                    </span>{" "}
                    below:
                  </p>
                  <Input
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Enter listing name"
                    className="h-9 text-sm"
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        deleteConfirmName ===
                          listings.find((l) => l.id === deleteListingId)?.name
                      ) {
                        handleDelete();
                      }
                    }}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={
                isDeleting ||
                deleteConfirmName !==
                  listings.find((l) => l.id === deleteListingId)?.name
              }
              className="bg-red-600 hover:bg-red-700 disabled:opacity-40"
            >
              {isDeleting ? "Deleting..." : "Delete listing"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
