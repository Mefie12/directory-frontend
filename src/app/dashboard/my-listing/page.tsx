"use client"
import { ListingsTable } from "@/components/dashboard/listing-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MyListing() {
  const router = useRouter();
  const listings = [
    {
      id: "1",
      name: "Greenbowl Restaurant",
      image: "/images/image-1.jpg",
      category: "Restaurant",
      location: "Accra, Ghana",
      status: "published" as const,
      views: 1234,
      comments: 32,
      bookmarks: 18,
      rating: 4.7,
    },
    {
      id: "2",
      name: "Ghana Cultural Festival",
      image: "/images/image-2.jpg",
      category: "Festival",
      location: "Accra, Ghana",
      status: "pending" as const,
      views: 1234,
      comments: 32,
      bookmarks: 18,
      rating: 4.7,
    },
    {
      id: "3",
      name: "Greenbowl Restaurant",
      image: "/images/image-1.jpg",
      category: "Beauty",
      location: "Accra, Ghana",
      status: "drafted" as const,
      views: 1234,
      comments: 32,
      bookmarks: 18,
      rating: 4.7,
    },
    {
      id: "4",
      name: "Greenbowl Restaurant",
      image: "/images/image-1.jpg",
      category: "Beauty",
      location: "Accra, Ghana",
      status: "drafted" as const,
      views: 1234,
      comments: 32,
      bookmarks: 18,
      rating: 4.7,
    },
    {
      id: "5",
      name: "Ghana Cultural Festival",
      image: "/images/image-2.jpg",
      category: "Festival",
      location: "Accra, Ghana",
      status: "pending" as const,
      views: 1234,
      comments: 32,
      bookmarks: 18,
      rating: 4.7,
    },
    {
      id: "6",
      name: "Greenbowl Restaurant",
      image: "/images/image-1.jpg",
      category: "Restaurant",
      location: "Accra, Ghana",
      status: "published" as const,
      views: 1234,
      comments: 32,
      bookmarks: 18,
      rating: 4.7,
    },
    {
      id: "7",
      name: "Greenbowl Restaurant",
      image: "/images/image-1.jpg",
      category: "Restaurant",
      location: "Accra, Ghana",
      status: "published" as const,
      views: 1234,
      comments: 32,
      bookmarks: 18,
      rating: 4.7,
    },
  ];
  return (
    <div className="px-1 lg:px-8 py-3 space-y-6">
      {/* Header Intro */}
      <div className="flex flex-col md:flex-row lg:items-center justify-between">
        <div className="mb-4">
          <h4 className="text-2xl font-semibold">My Listings</h4>
        </div>
        <Button
        onClick={()=>(router.push("/dashboard/my-listing/create"))} 
        className="bg-[#93C01F] py-3.5 px-4 hover:bg-[#93C01F]/80 cursor-pointer">
          <span>
            <Plus className="w-4 h-4" />
          </span>
          Add new listing
        </Button>
      </div>

      {/* Table */}
      <div>
        {/* Replace the empty array with actual listings data when available */}
        <ListingsTable
          listings={listings}
          showPagination={true}
          button={false}
          itemsPerPage={6}
        />
      </div>
    </div>
  );
}
