"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
import Image from "next/image";

interface Listing {
  id: string;
  name: string;
  vendor: string;
  category: string;
  location: string;
  type: string;
  submission: "Published" | "Pending review" | "Draft";
  approval: "Published" | "Pending" | "Rejected";
  image: string;
}

export default function Listings() {
  const [data, setData] = useState<Listing[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 10;

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/listings?page=${currentPage}&status=${statusFilter}&type=${typeFilter}&search=${search}&limit=${itemsPerPage}`
        );
        const json = await res.json();
        setData(json.items || []);
        setTotalPages(json.totalPages || 1);
      } catch (error) {
        console.error("Failed to load listings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [statusFilter, typeFilter, search, currentPage]);

  const getSubmissionBadgeVariant = (status: string) => {
    switch (status) {
      case "Published":
        return "default";
      case "Pending review":
        return "secondary";
      default:
        return "destructive";
    }
  };

  const getApprovalBadgeVariant = (status: string) => {
    switch (status) {
      case "Published":
        return "default";
      case "Pending":
        return "secondary";
      default:
        return "destructive";
    }
  };

  // Generate page numbers to display
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

  if (
    !isLoading &&
    data.length === 0 &&
    statusFilter === "all" &&
    typeFilter === "all" &&
    !search
  ) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold mb-6">Listings</h1>
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-full h-full flex items-center justify-center">
            <Image
              src="/images/icons/tags-empty.png"
              alt="No Activity"
              width={100}
              height={100}
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mt-4">
            No listings yet
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-sm mt-2">
            No Listings yet. Add one to start reaching customers
          </p>
          <Button className="mt-6 bg-[#93C01F] py-3.5 px-4 hover:bg-[#93C01F]/80 cursor-pointer flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add your first listing
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Listings</h1>

      {/* Status Tabs */}
      <div className="flex gap-3">
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "flagged", label: "Flagged" },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={statusFilter === tab.key ? "default" : "outline"}
            className={`rounded-lg shadow-none px-6 ${
              statusFilter === tab.key
                ? "bg-[#93C01F] hover:bg-[#7ea919] text-white"
                : ""
            }`}
            onClick={() => {
              setStatusFilter(tab.key);
              setCurrentPage(1);
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Filters Section */}
      <div className="p-1 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search listings..."
              className="rounded-lg pl-9 shadow-none"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex gap-3">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="rounded-lg shadow-none w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="rounded-lg shadow-none w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="venue">Venue</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="package">Package</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-200">
                <TableHead className="font-semibold">Listing Name</TableHead>
                <TableHead className="font-semibold">Vendor</TableHead>
                <TableHead className="font-semibold">
                  Category & Location
                </TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">
                  Submission Status
                </TableHead>
                <TableHead className="font-semibold">Approval Status</TableHead>
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
                    Loading listings...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500"
                  >
                    No listings found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={item.image}
                          width={40}
                          height={40}
                          alt={item.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.vendor}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{item.category}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">{item.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{item.type}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getSubmissionBadgeVariant(item.submission)}
                        className={`${
                          item.submission === "Published"
                            ? "bg-green-600 hover:bg-green-700"
                            : item.submission === "Pending review"
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        {item.submission}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getApprovalBadgeVariant(item.approval)}
                        className={`${
                          item.approval === "Published"
                            ? "bg-green-600 hover:bg-green-700"
                            : item.approval === "Pending"
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        {item.approval}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Listing</DropdownMenuItem>
                          <DropdownMenuItem>Approve</DropdownMenuItem>
                          <DropdownMenuItem>Reject</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Delete
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
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="h-8 w-8 hover:bg-gray-100 disabled:opacity-50 border rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <div className="flex items-center gap-1 border rounded-full px-1">
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
          </div>
        )}
      </div>
    </div>
  );
}
