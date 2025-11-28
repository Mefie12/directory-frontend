"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils"; // Standard shadcn utility

// --- Types ---

interface Review {
  id: string;
  customer: {
    name: string;
    avatar: string;
  };
  listingName: string;
  vendor: string;
  review: string;
  dateSubmitted: string;
  status: "Published" | "Flagged" | "Pending";
}

// Interface strictly matching backend response
interface RawReview {
  id: number | string;
  user?: { name: string; avatar?: string };
  customer_name?: string;
  customer_avatar?: string;
  listing?: { name: string };
  listing_name?: string;
  vendor?: { name: string };
  vendor_name?: string;
  content?: string;
  review?: string;
  created_at?: string;
  status?: string;
}

interface ApiResponse {
  data?: RawReview[];
  items?: RawReview[];
  last_page?: number;
  totalPages?: number;
}

export default function ReviewsPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();

  // --- State ---
  const [data, setData] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 10;

  // --- Helper: Auth Token ---
  const getAuthToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  };

  // --- Helper: Data Mapping ---
  // Replaced 'any' with 'unknown' and type guards/casting
  const extractReviewsFromResponse = (apiData: unknown): Review[] => {
    if (!apiData || typeof apiData !== "object") return [];

    const response = apiData as ApiResponse;

    // Determine where the array lives (Laravel 'data' vs standard 'items')
    const rawItems: RawReview[] = (
      Array.isArray(response) ? response : response.data || response.items || []
    ) as RawReview[];

    return rawItems.map((item) => ({
      id: item.id.toString(),
      customer: {
        name: item.user?.name || item.customer_name || "Anonymous",
        avatar: item.user?.avatar || item.customer_avatar || "",
      },
      listingName: item.listing?.name || item.listing_name || "Unknown Listing",
      vendor: item.vendor?.name || item.vendor_name || "Unknown Vendor",
      review: item.content || item.review || "No content provided",
      dateSubmitted: item.created_at
        ? new Date(item.created_at).toLocaleDateString()
        : "N/A",
      status:
        (item.status as "Published" | "Flagged" | "Pending") || "Published",
    }));
  };

  // --- API Fetch ---
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;

      if (!authUser) {
        // Handle unauthenticated state (e.g., redirect)
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const token = getAuthToken();
        const API_URL = process.env.API_URL || "https://me-fie.co.uk";

        // Build Query String
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          search: search,
          status: statusFilter !== "All" ? statusFilter : "",
          rating: ratingFilter !== "All" ? ratingFilter : "",
        });

        // Add Date Range params if selected
        if (date?.from) {
          queryParams.append("date_from", date.from.toISOString());
        }
        if (date?.to) {
          queryParams.append("date_to", date.to.toISOString());
        }

        const response = await fetch(`${API_URL}/api/reviews`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch reviews");
        }

        const json = await response.json();

        // Handle Data
        const reviews = extractReviewsFromResponse(json);
        setData(reviews);

        // Handle Pagination
        // Cast json to ApiResponse to access paging properties safely
        const pageData = json as ApiResponse;
        const total = pageData.last_page || pageData.totalPages || 1;
        setTotalPages(total);
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    authUser,
    authLoading,
    currentPage,
    search,
    statusFilter,
    ratingFilter,
    date,
  ]);

  // --- Handlers ---
  const handleRowClick = (id: string) => {
    router.push(`/dashboard/admin/reviews/${id}`);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxPagesToShow = 4;
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
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

  const getStatusBadge = (status: string) => {
    if (status === "Published") {
      return (
        <Badge className="bg-[#548235] hover:bg-[#548235]/90 text-white gap-1 pl-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white block" /> Published
        </Badge>
      );
    }
    if (status === "Flagged") {
      return (
        <Badge
          variant="destructive"
          className="bg-[#EB5757] hover:bg-[#EB5757]/90 text-white gap-1 pl-1.5"
        >
          <span className="w-3 h-3 rounded-full bg-white/20 flex items-center justify-center text-[8px] font-bold">
            !
          </span>{" "}
          Flagged
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-500 hover:bg-gray-600 text-white gap-1 pl-1.5">
        {status}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="p-2 lg:p-6 space-y-6 min-h-screen">
      <h1 className="text-3xl font-semibold text-gray-900">Reviews</h1>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="relative flex w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search reviews..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1); // Reset to page 1 on search
            }}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="text-gray-600 font-normal min-w-[100px] justify-between"
              >
                {statusFilter === "All" ? "Status" : statusFilter}{" "}
                <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter("All")}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Published")}>
                Published
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Flagged")}>
                Flagged
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Rating Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="text-gray-600 font-normal min-w-[100px] justify-between"
              >
                {ratingFilter === "All" ? "Rating" : `${ratingFilter} Stars`}{" "}
                <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setRatingFilter("All")}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRatingFilter("5")}>
                5 Stars
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRatingFilter("4")}>
                4 Stars
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRatingFilter("3")}>
                3 Stars
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRatingFilter("2")}>
                2 Stars
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRatingFilter("1")}>
                1 Star
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date Range Picker (Shadcn) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "justify-start text-left font-normal min-w-60",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-200">
            <TableRow>
              <TableHead className="w-[200px]">Customer</TableHead>
              <TableHead>Listing Name</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="w-[300px]">Review</TableHead>
              <TableHead>Date Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-gray-500"
                >
                  Loading reviews...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-gray-500"
                >
                  No reviews found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(item.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={item.customer.avatar} />
                        <AvatarFallback>
                          {getInitials(item.customer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-gray-900">
                        {item.customer.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {item.listingName}
                  </TableCell>
                  <TableCell className="text-gray-600">{item.vendor}</TableCell>
                  <TableCell className="text-gray-500 truncate max-w-[250px]">
                    {item.review}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {item.dateSubmitted}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleRowClick(item.id)}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Delete Review
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && data.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-gray-600">
            Showing page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="h-8 w-8 rounded-full border-gray-200"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </Button>

            <div className="flex gap-1">
              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  size="icon"
                  variant={currentPage === page ? "default" : "ghost"}
                  onClick={() => handlePageChange(page)}
                  className={`h-8 w-8 rounded-full ${
                    currentPage === page
                      ? "bg-[#93C01F] hover:bg-[#93C01F]/90 text-white"
                      : "text-gray-600"
                  }`}
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="h-8 w-8 rounded-full border-gray-200"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
