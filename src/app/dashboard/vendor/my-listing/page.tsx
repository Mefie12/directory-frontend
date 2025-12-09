"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Edit,
  MapPin,
  Tag,
  User,
  Gem,
  RefreshCcw,
} from "lucide-react";
import Image from "next/image";

import { ListingsTable } from "@/components/dashboard/listing-table";
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
import { Sheet, SheetContent, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

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

// Extended Table Item
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

// Helper function for image URLs
const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/placeholder-listing.png";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const API_URL = process.env.API_URL || "https://me-fie.co.uk";
  return `${API_URL}/${url.replace(/^\//, "")}`;
};

export default function MyListing() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [listings, setListings] = useState<ListingsTableItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Action States ---
  const [viewListing, setViewListing] = useState<ListingsTableItem | null>(
    null
  );
  const [deleteListingId, setDeleteListingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getStatusColor = (status: string) => {
    if (status === "published") return "bg-[#E9F5D6] text-[#5F8B0A]";
    if (status === "pending") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-800";
  };

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

      // DEBUG: Check what the API is actually returning
      console.log("Raw API Listings Data:", data.data);

      const transformedListings: ListingsTableItem[] = data.data.map(
        (listing) => {
          // 1. Image Logic
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

          const categoryText = listing.categories?.[0]?.name || "Uncategorized";
          const location =
            [listing.city, listing.country].filter(Boolean).join(", ") ||
            "Online";

          // 2. Status Mapping
          let status: "published" | "pending" | "drafted" = "drafted";
          const backendStatus = (listing.status || "").toLowerCase();

          if (["published", "active", "approved"].includes(backendStatus)) {
            status = "published";
          } else if (backendStatus === "pending") {
            status = "pending";
          }

          // 3. Type Logic (FIXED)
          // We check 'listing.type' first.
          // If missing, we assume 'business' is the safe default, BUT we check categories first.
          let resolvedType = listing.type;

          if (!resolvedType && listing.categories?.length > 0) {
            // Try to find if a category matches a known type
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
            type: resolvedType || "business", // Use the resolved type
            views: listing.views_count || 0,
            comments: listing.ratings_count || 0,
            bookmarks: listing.bookmarks_count || 0,
            rating: Number(listing.rating) || 0,
            description: listing.bio,
          };
        }
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

  const handleEdit = (listing: ListingsTableItem) => {
    router.push(
      `/dashboard/vendor/my-listing/edit?type=${listing.type}&slug=${listing.slug}`
    );
  };

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
          errorData.message || `Delete failed with status: ${res.status}`
        );
      }

      toast.success("Listing deleted successfully");
      setListings((prev) => prev.filter((l) => l.id !== deleteListingId));
      setViewListing(null);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete listing"
      );
    } finally {
      setIsDeleting(false);
      setDeleteListingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#93C01F]" />
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
                onClick={() =>
                  router.push(
                    `/dashboard/vendor/my-listing/create?type=${type}`
                  )
                }
                className="capitalize cursor-pointer"
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#93C01F] text-white text-xs  font-medium">
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
          onViewClick={setViewListing}
          onEditClick={handleEdit}
          onDeleteClick={(id: string) => setDeleteListingId(id)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl bg-gray-50">
          <p className="text-gray-500">No listings yet</p>
        </div>
      )}

      {/* --- VIEW SIDEBAR (Sheet) --- */}
      <Sheet
        open={!!viewListing}
        onOpenChange={(open) => !open && setViewListing(null)}
      >
        <SheetContent className="w-[400px] sm:w-[540px] p-0 overflow-y-auto">
          <SheetDescription className="sr-only">
            Details for {viewListing?.name}
          </SheetDescription>
          {viewListing && (
            <>
              {/* Header */}
              <div className="p-6 pb-2 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-gray-900"
                    onClick={() => setViewListing(null)}
                  >
                    ← Back
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(viewListing)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                <h2 className="text-2xl font-bold">{viewListing.name}</h2>
              </div>

              {/* Content */}
              <div className="p-6 space-y-8">
                {/* Details Grid */}
                <div className="grid grid-cols-[24px_1fr_auto] gap-y-6 gap-x-3 items-center text-sm">
                  <RefreshCcw className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Status</span>
                  <div className="justify-self-end">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        viewListing.status
                      )}`}
                    >
                      {viewListing.status === "published"
                        ? "Published"
                        : viewListing.status === "pending"
                        ? "Pending Review"
                        : "Draft"}
                    </span>
                  </div>

                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Owner</span>
                  <div className="justify-self-end flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px]">
                        {user
                          ? getInitials(user.name || user.email || "U")
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-900">
                      {user?.name || user?.email || "You"}
                    </span>
                  </div>

                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Location</span>
                  <div className="justify-self-end font-medium text-gray-900">
                    {viewListing.location}
                  </div>

                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Type</span>
                  <div className="justify-self-end font-medium text-gray-900 capitalize">
                    {viewListing.type}
                  </div>

                  <Gem className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Category</span>
                  <div className="justify-self-end">
                    <Badge variant="outline" className="text-xs">
                      {viewListing.category}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">
                    Listing Description
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 leading-relaxed border border-gray-100">
                    {viewListing.description || "No description provided."}
                  </div>
                </div>

                <div>
                  <div className="flex border-b border-gray-200 mb-6">
                    <button className="pb-3 px-1 text-sm font-medium text-[#93C01F] border-b-2 border-[#93C01F]">
                      Media
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {viewListing.allImages.length > 0 ? (
                      <div className="aspect-square bg-gray-100 rounded-lg relative overflow-hidden group">
                        <Image
                          src={viewListing.allImages[0]}
                          alt="Cover image"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          unoptimized={true}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.src.includes("placeholder")) {
                              target.src = "/images/placeholder-listing.png";
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs border border-dashed border-gray-300">
                        No cover image
                      </div>
                    )}

                    {viewListing.allImages.length > 1 &&
                      viewListing.allImages.slice(1, 4).map((img, index) => (
                        <div
                          key={index}
                          className="aspect-square bg-gray-100 rounded-lg relative overflow-hidden group"
                        >
                          <Image
                            src={img}
                            alt={`Media ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            unoptimized={true}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (!target.src.includes("placeholder")) {
                                target.src = "/images/placeholder-listing.png";
                              }
                            }}
                          />
                        </div>
                      ))}

                    {viewListing.allImages.length < 4 && (
                      <div
                        onClick={() => handleEdit(viewListing)}
                        className="aspect-square bg-gray-50 rounded-lg flex flex-col gap-2 items-center justify-center text-gray-400 text-xs cursor-pointer hover:bg-gray-100 border border-dashed border-gray-300 transition-all"
                      >
                        <Plus className="w-5 h-5 opacity-50" />
                        <span>Add Media</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="text-2xl font-bold text-gray-900">
                      {viewListing.views}
                    </div>
                    <div className="text-sm text-gray-500">Views</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="text-2xl font-bold text-gray-900">
                      {viewListing.bookmarks}
                    </div>
                    <div className="text-sm text-gray-500">Bookmarks</div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setViewListing(null)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1 bg-[#93C01F] hover:bg-[#82ab1b]"
                  onClick={() => handleEdit(viewListing)}
                >
                  Edit Listing
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

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
