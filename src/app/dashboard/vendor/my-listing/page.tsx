"use client";
import { ListingsTable } from "@/components/dashboard/listing-table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Type for the API response
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
    type: 'mainCategory' | 'subCategory';
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
    bookmarks_count: number; // ✅ Added this
    created_at: string;
    updated_at: string;
    status: 'pending' | 'published' | 'draft' | 'rejected';
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

// Type for ListingsTable component
interface ListingsTableItem {
    id: string;
    name: string;
    image: string;
    category: string;
    location: string;
    status: 'published' | 'pending' | 'drafted';
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
                    throw new Error("Authentication required");
                }

                const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
                const response = await fetch(`${API_URL}/api/listing/my_listings`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch listings: ${response.status}`);
                }

                const data: ApiResponse = await response.json();

                // Transform API data to match ListingsTable component format
                const transformedListings: ListingsTableItem[] = data.data.map((listing) => {
                    // Get first image URL or fallback
                    // ✅ FIXED: Use 'media' field instead of 'image_path'
                    // Filter out images with 'processing' and use first valid URL
                    const validImages = listing.images.filter(img =>
                        img.media && img.media !== 'processing' && img.media.startsWith('http')
                    );

                    const firstImage = validImages.length > 0
                        ? validImages[0].media
                        : "/images/placeholder-listing.jpg";

                    // Get categories as comma-separated string (show only main categories)
                    const mainCategories = listing.categories
                        .filter(cat => cat.parent_id === null)
                        .map(cat => cat.name)
                        .join(', ');

                    const categoryText = mainCategories || 'Uncategorized';

                    // Format location
                    const location = `${listing.city}, ${listing.country}`;

                    // Map status
                    let status: 'published' | 'pending' | 'drafted' = 'drafted';
                    if (listing.status === 'published') status = 'published';
                    if (listing.status === 'pending') status = 'pending';
                    if (listing.status === 'rejected') status = 'drafted'; // Map rejected to drafted

                    return {
                        id: listing.id.toString(),
                        name: listing.name,
                        image: firstImage,
                        category: categoryText,
                        location: location,
                        status: status,
                        views: listing.views_count,
                        comments: listing.ratings_count || 0, // Use ratings_count for comments
                        bookmarks: listing.bookmarks_count || 0, // ✅ Now uses API's bookmarks_count
                        rating: listing.rating,
                    };
                });

                setListings(transformedListings);
            } catch (error) {
                console.error('Error fetching listings:', error);
                setError(error instanceof Error ? error.message : 'Failed to load listings');
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
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            className="bg-[#93C01F] py-3.5 px-4 hover:bg-[#93C01F]/80 cursor-pointer"
                            disabled={loading}
                        >
              <span>
                <Plus className="w-4 h-4" />
              </span>
                            Add new listing
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="shadow-xs -mt-1">
                        <DropdownMenuItem
                            onClick={() =>
                                router.push("/dashboard/vendor/my-listing/create?type=business")
                            }
                        >
              <span className="border bg-[#93C01F]/30 rounded-full px-2">
                1
              </span>{" "}
                            Business Listing
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() =>
                                router.push("/dashboard/vendor/my-listing/create?type=event")
                            }
                        >
              <span className="border bg-[#93C01F]/30 rounded-full px-2">
                2
              </span>{" "}
                            Event Listing
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() =>
                                router.push("/dashboard/vendor/my-listing/create?type=community")
                            }
                        >
              <span className="border bg-[#93C01F]/30 rounded-full px-2">
                3
              </span>{" "}
                            Community Listing
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-[#93C01F]" />
                        <p className="text-gray-600">Loading your listings...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    <p className="font-medium">Error loading listings</p>
                    <p className="text-sm mt-1">{error}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </Button>
                </div>
            )}

            {/* Success State - Show Table */}
            {!loading && !error && (
                <div>
                    <ListingsTable
                        listings={listings}
                        showPagination={true}
                        button={false}
                        itemsPerPage={6}
                    />

                    {/* Empty State */}
                    {listings.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Plus className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
                            <p className="text-gray-500 mb-6">Get started by creating your first listing</p>
                            <Button
                                className="bg-[#93C01F] hover:bg-[#93C01F]/80"
                                onClick={() => router.push("/dashboard/vendor/my-listing/create?type=business")}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Listing
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}