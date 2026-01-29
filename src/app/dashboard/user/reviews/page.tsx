"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ChevronDown,
  Star,
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
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

// --- Types ---

interface Review {
  id: string;
  customer: {
    name: string;
    avatar: string;
    id: string;
  };
  listing: {
    name: string;
    id: string;
  };
  vendor: string;
  review: string;
  rating: number;
  dateSubmitted: string;
  status: "Published" | "Flagged" | "Pending";
}

interface RawReview {
  id: number | string;
  listing_id: number | string;
  user_id: number | string;
  rating: number;
  comment: string;
  created_at?: string; // FIXED: This is the correct field name
  status?: string;
  user?: {
    id: number | string;
    first_name: string;
    last_name: string;
    email: string;
    avatar?: string;
    profile_photo_url?: string;
  };
}

interface UserData {
  id: string | number;
  name: string;
  avatar?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  profile_photo_url?: string;
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
  const [displayData, setDisplayData] = useState<Review[]>([]);
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
  const getAuthToken = useCallback((): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  }, []);

  type UserResponseData = {
    data?: UserData;
    user?: UserData;
    id?: string | number;
    first_name?: string;
    last_name?: string;
    name?: string;
    username?: string;
    email?: string;
    avatar?: string;
    profile_photo_url?: string;
  };

  // --- Helper: Extract User Name ---
  const extractUserName = useCallback(
    (userData: UserResponseData | null | undefined): string => {
      if (!userData) return "Unknown User";
      const rawUser = userData.data || userData.user || userData;
      if (rawUser.first_name || rawUser.last_name) {
        return `${rawUser.first_name || ""} ${rawUser.last_name || ""}`.trim();
      }
      if (rawUser.name) return rawUser.name;
      return (
        rawUser.username ||
        (typeof rawUser.email === "string"
          ? rawUser.email.split("@")[0]
          : "Unknown User")
      );
    },
    []
  );

  // --- Helper: Extract User Avatar ---
  const extractUserAvatar = useCallback(
    (userData: UserResponseData | null | undefined): string => {
      if (!userData) return "";
      const rawUser = userData.data || userData.user || userData;
      return rawUser.avatar || rawUser.profile_photo_url || "";
    },
    []
  );

  // --- Helper: Format Date String ---
  const formatDateString = useCallback(
    (dateString: string | undefined): string => {
      if (!dateString) {
        // console.log("No date string provided for created_at");
        return "N/A";
      }

      // console.log(`Formatting created_at date string: "${dateString}"`);

      try {
        let date = new Date(dateString);

        if (isNaN(date.getTime())) {
          // Try removing timezone if present (some APIs return with timezone)
          const cleanDateStr = dateString.split("+")[0].split(".")[0];
          date = new Date(cleanDateStr);

          if (isNaN(date.getTime())) {
            // Try as timestamp
            const timestamp = Date.parse(dateString);
            if (!isNaN(timestamp)) {
              date = new Date(timestamp);
            }
          }
        }

        if (!isNaN(date.getTime())) {
          // Return formatted date
          return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
        } else {
          // console.warn(`Could not parse created_at date: ${dateString}`);
          return "Invalid Date";
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(`Error formatting created_at date ${dateString}:`, error);
        return "Error";
      }
    },
    []
  );

  // --- Helper: Data Mapping ---
  const extractReviewsFromResponse = useCallback(
    async (apiData: unknown): Promise<Review[]> => {
      if (!apiData || typeof apiData !== "object") return [];
      const response = apiData as ApiResponse;
      const rawItems: RawReview[] = (
        Array.isArray(response)
          ? response
          : response.data || response.items || []
      ) as RawReview[];

      // console.log("=== DEBUG: Raw API Response ===");
      // console.log("Total items:", rawItems.length);

      // if (rawItems.length > 0) {
      //   const firstItem = rawItems[0];
      //   console.log("First item created_at value:", firstItem.created_at);
      //   console.log("First item created_at type:", typeof firstItem.created_at);
      // }

      const reviews = rawItems.map((item) => {
        const userId =
          item.user_id?.toString() || item.user?.id?.toString() || "unknown";
        const listingId = item.listing_id.toString();

        let userName = "Unknown User";
        let userAvatar = "";

        if (item.user) {
          userName = extractUserName(item.user);
          userAvatar = extractUserAvatar(item.user);
        }

        let status: "Published" | "Flagged" | "Pending" = "Published";
        if (item.status) {
          const s = item.status.toLowerCase();
          if (s === "flagged") status = "Flagged";
          else if (s === "pending") status = "Pending";
        }

        // FIXED: Use created_at as per backend developer
        const rawDateString = item.created_at;

        // console.log(`Item ${item.id}:`, {
        //   id: item.id,
        //   created_at: item.created_at,
        //   formattedDate: formatDateString(item.created_at)
        // });

        return {
          id: item.id.toString(),
          customer: {
            id: userId,
            name: userName,
            avatar: userAvatar,
          },
          listing: {
            id: listingId,
            name: `Listing #${listingId}`,
          },
          vendor: "Vendor Name",
          review: item.comment || "No content provided",
          rating: item.rating || 0,
          dateSubmitted: formatDateString(rawDateString),
          status: status,
        };
      });

      // console.log("Mapped reviews with dates:", reviews.map(r => ({
      //   id: r.id,
      //   dateSubmitted: r.dateSubmitted
      // })));
      return reviews;
    },
    [extractUserName, extractUserAvatar, formatDateString]
  );

  // --- API Fetch ---
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;
      if (!authUser) return;

      setIsLoading(true);
      setError(null);

      try {
        const token = getAuthToken();
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

        let apiStatus = "";
        if (statusFilter !== "All") {
          apiStatus = statusFilter.toLowerCase();
        }

        let apiRating = "";
        if (ratingFilter !== "All") {
          apiRating = ratingFilter;
        }

        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          search: search,
        });

        if (apiStatus) queryParams.append("status", apiStatus);
        if (apiRating) queryParams.append("rating", apiRating);

        if (date?.from) {
          queryParams.append("date_from", format(date.from, "yyyy-MM-dd"));
        }
        if (date?.to) {
          queryParams.append("date_to", format(date.to, "yyyy-MM-dd"));
        }

        // console.log(`Fetching from: ${API_URL}/api/ratings?${queryParams}`);

        const response = await fetch(`${API_URL}/api/my_ratings?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch reviews: ${response.statusText}`);
        }

        const json = await response.json();

        // DEBUG: Log the full response structure
        // console.log("=== API RESPONSE DEBUG ===");
        // console.log("Full response keys:", Object.keys(json));

        // if (json.data && Array.isArray(json.data)) {
        //   console.log(`Found ${json.data.length} items in data array`);
        //   if (json.data.length > 0) {
        //     const firstItem = json.data[0];
        //     console.log("First item created_at:", firstItem.created_at);

        //     // Check if created_at exists and is not null
        //     if (firstItem.created_at === null || firstItem.created_at === undefined) {
        //       console.warn("WARNING: created_at is null or undefined in first item!");
        //       console.log("First item full structure:", firstItem);
        //     } else {
        //       console.log("created_at value type:", typeof firstItem.created_at);
        //       console.log("created_at value:", firstItem.created_at);
        //     }
        //   }
        // }

        const reviews = await extractReviewsFromResponse(json);
        setData(reviews);

        const pageData = json as ApiResponse;
        const total = pageData.last_page || pageData.totalPages || 1;
        setTotalPages(total);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        // console.error("Fetch error:", err);
        setError("Failed to load data");
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    authUser,
    authLoading,
    currentPage,
    search,
    statusFilter,
    ratingFilter,
    date,
    getAuthToken,
    extractReviewsFromResponse,
  ]);

  // --- Client-Side Safety Filter ---
  useEffect(() => {
    let filtered = [...data];

    if (statusFilter !== "All") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    if (ratingFilter !== "All") {
      filtered = filtered.filter(
        (item) => item.rating === parseInt(ratingFilter)
      );
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.customer.name.toLowerCase().includes(lowerSearch) ||
          item.review.toLowerCase().includes(lowerSearch) ||
          item.listing.name.toLowerCase().includes(lowerSearch)
      );
    }

    setDisplayData(filtered);
  }, [data, statusFilter, ratingFilter, search]);

  // --- Handlers ---
  const handleRowClick = (id: string) => {
    router.push(`/dashboard/customer/reviews/${id}`);
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

  // const getInitials = (name: string) => {
  //   return name
  //     .split(" ")
  //     .map((n) => n[0])
  //     .slice(0, 2)
  //     .join("")
  //     .toUpperCase();
  // };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating})</span>
      </div>
    );
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
              {/* <TableHead className="w-[200px]">Customer</TableHead> */}
              <TableHead>Listing Name</TableHead>
              <TableHead>Rating</TableHead>
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
            ) : displayData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-gray-500"
                >
                  No reviews found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(item.id)}
                >
                  {/* <TableCell>
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
                  </TableCell> */}
                  <TableCell className="text-gray-600">
                    {item.listing.name}
                  </TableCell>
                  <TableCell>{renderStars(item.rating)}</TableCell>
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
                        {/* <DropdownMenuItem
                          onClick={() => handleRowClick(item.id)}
                        >
                          View Details
                        </DropdownMenuItem> */}
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
      {!isLoading && displayData.length > 0 && totalPages > 1 && (
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
