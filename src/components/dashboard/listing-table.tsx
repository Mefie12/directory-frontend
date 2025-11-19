"use client";
import { useState } from "react";
import {
  MoreHorizontal,
  Eye,
  MessageSquare,
  Bookmark,
  Star,
  Plus,
  Check,
  Clock,
  CircleDashed,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type ListingStatus = "published" | "pending" | "drafted";

interface Listing {
  id: string;
  name: string;
  image: string;
  category: string;
  location: string;
  status: ListingStatus;
  views: number;
  comments: number;
  bookmarks: number;
  rating: number;
}

interface ListingsTableProps {
  listings: Listing[];
  showPagination?: boolean;
  button?: boolean;
  itemsPerPage?: number;
}

const getStatusConfig = (status: ListingStatus) => {
  switch (status) {
    case "published":
      return {
        label: "Published",
        className: "bg-[#3E875E] text-white border-[#0A7B3E]/20",
        icon: (
          <span className="border border-white rounded-full w-4 h-4 flex items-center justify-center bg-white">
            <Check className="w-4 h-4 text-black" />
          </span>
        ),
      };
    case "pending":
      return {
        label: "Pending review",
        className: "bg-[#2E61B4] text-white border-[#1976D2]/20",
        icon: (
          <span>
            <Clock className="w-4 h-4" />
          </span>
        ),
      };
    case "drafted":
      return {
        label: "Drafted",
        className: "bg-[#F5F5F5] text-[#616161] border-[#616161]/20",
        icon: (
          <span>
            <CircleDashed className="w-4 h-4" />
          </span>
        ),
      };
  }
};

export function ListingsTable({
  listings,
  showPagination = false,
  button = true,
  itemsPerPage = 4,
}: ListingsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(listings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentListings = listings.slice(startIndex, endIndex);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxPagesToShow = 4;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with smart logic
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4);
      } else if (currentPage >= totalPages - 2) {
        pages.push(totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(
          currentPage - 1,
          currentPage,
          currentPage + 1,
          currentPage + 2
        );
      }
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const listingsToRender = showPagination ? currentListings : listings;

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-0 px-4">
        <div className="w-20 h-20 rounded-full bg-[#F0F4FF] flex items-center justify-center">
          <Image
            src="/images/icons/empty.svg"
            alt="No Activity"
            width={40}
            height={40}
          />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mt-2">
          No listings yet
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          No Listings yet. Add one to start reaching customers
        </p>
        {button && (
          <Button className="mt-6 bg-[#93C01F] py-3.5 px-4 hover:bg-[#93C01F]/80 cursor-pointer">
            <span>
              <Plus className="w-4 h-4" />
            </span>
            Add your first listing
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border">
      <Table>
        <TableHeader className="rounded-2xl">
          <TableRow className="border-b border-[#E3E8EF] hover:bg-transparent bg-gray-100">
            <TableHead className="text-[#425466] font-medium text-sm rounded-tl-xl">
              Listings
            </TableHead>
            <TableHead className="text-[#425466] font-medium text-sm">
              Category & Location
            </TableHead>
            <TableHead className="text-[#425466] font-medium text-sm">
              Status
            </TableHead>
            <TableHead className="text-[#425466] font-medium text-sm">
              Stats Summary
            </TableHead>
            <TableHead className="w-12 rounded-tr-xl"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listingsToRender.map((listing) => {
            const statusConfig = getStatusConfig(listing.status);
            return (
              <TableRow
                key={listing.id}
                className="border-b border-[#E3E8EF] hover:bg-gray-50/50"
              >
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                      <Image
                        src={listing.image}
                        alt={listing.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-medium text-[#0F1A2A]">
                      {listing.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-2 text-[#425466]">
                    <span>{listing.category}</span>
                    <span className="w-1 h-1 rounded-full bg-[#425466]"></span>
                    <span>{listing.location}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium ${statusConfig.className}`}
                  >
                    <span>{statusConfig.icon}</span>
                    <span>{statusConfig.label}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-4 text-[#425466]">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">
                        {listing.views.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">{listing.comments}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bookmark className="w-4 h-4" />
                      <span className="text-sm">{listing.bookmarks}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4" />
                      <span className="text-sm">{listing.rating}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 px-4 py-4 border-t border-[#E3E8EF]">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="h-8 w-8 hover:bg-gray-100 disabled:opacity-50 border rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="border rounded-full"> 
          {getPageNumbers().map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "ghost"}
              size="icon"
              onClick={() => handlePageChange(page)}
              className={`h-8 w-8 rounded-full ${
                currentPage === page
                  ? "bg-[#93C01F] text-white hover:bg-[#93C01F]/90"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {page}
            </Button>
          ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="h-8 w-8 hover:bg-gray-100 disabled:opacity-50 border rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
