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
  Eye,
  MessageSquare,
  MoreHorizontal,
  Pause,
  Search,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  businessName?: string;
  phoneNumber: string;
  plan?: "Basic" | "Premium" | "Pro";
  numberOfListings?: string;
  lastActive: string;
  status: "Active" | "Pending" | "Suspended";
}

export default function Users() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"vendors" | "customers">("vendors");
  const [allData, setAllData] = useState<User[]>([]);
  const [displayData, setDisplayData] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 10;

  // Fetch all data without pagination parameters
  useEffect(() => {
    async function loadAllData() {
      setIsLoading(true);
      setError(null);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
        console.log("🚀 Fetching users data from:", `${API_URL}/api/all_users`);

        const response = await fetch(`${API_URL}/api/all_users`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: 'no-store' // Optional: prevent caching for fresh data
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("📥 Users response:", data);

        // Handle different response structures
        const users = data.items || data.users || data || [];
        console.log("✅ Users data loaded successfully, count:", users.length);
        
        setAllData(users);
      } catch (error) {
        console.error("❌ Failed to load users:", error);
        setError(error instanceof Error ? error.message : "Failed to load users");
        setAllData([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadAllData();
  }, [activeTab]);

  // Filter and paginate data client-side
  useEffect(() => {
    // Apply filters
    const filteredData = allData.filter((user) => {
      // Status filter
      if (
        statusFilter !== "all" &&
        user.status.toLowerCase() !== statusFilter
      ) {
        return false;
      }

      // Plan filter
      if (planFilter !== "all" && user.plan?.toLowerCase() !== planFilter) {
        return false;
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.businessName?.toLowerCase().includes(searchLower) ||
          user.phoneNumber.includes(search)
        );
      }

      return true;
    });

    // Calculate pagination
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    setTotalPages(totalPages);

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    setDisplayData(paginatedData);
  }, [allData, statusFilter, planFilter, search, currentPage, activeTab]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, planFilter, search, activeTab]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-600 hover:bg-green-700";
      case "Pending":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "Suspended":
        return "bg-red-600 hover:bg-red-700";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "Basic":
        return "bg-green-500 hover:bg-green-600";
      case "Premium":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "Pro":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
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

  const handleViewProfile = (userId: string) => {
    router.push(`/dashboard/admin/users/${userId}`);
  };

  // Calculate showing range for pagination info
  const getShowingRange = () => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, allData.length);
    return { startItem, endItem };
  };

  const { startItem, endItem } = getShowingRange();

  
  return (
    <div className="p-2 lg:p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Users</h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b">
        <button
          onClick={() => {
            setActiveTab("vendors");
            setCurrentPage(1);
          }}
          className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
            activeTab === "vendors"
              ? "text-[#93C01F]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Vendors
          {activeTab === "vendors" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#93C01F]" />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("customers");
            setCurrentPage(1);
          }}
          className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
            activeTab === "customers"
              ? "text-[#93C01F]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Customers
          {activeTab === "customers" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#93C01F]" />
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <strong>Error: </strong> {error}
        </div>
      )}

      {/* Filters Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search"
              className="rounded-lg pl-9 shadow-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex gap-3">
            {activeTab === "vendors" && (
              <>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="rounded-lg shadow-none w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="rounded-lg shadow-none w-[130px]">
                    <SelectValue placeholder="Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-200">
                {activeTab === "vendors" ? (
                  <>
                    <TableHead className="font-semibold">Vendor Name</TableHead>
                    <TableHead className="font-semibold">
                      Business Name
                    </TableHead>
                    <TableHead className="font-semibold">
                      Phone Number
                    </TableHead>
                    <TableHead className="font-semibold">Plan</TableHead>
                    <TableHead className="font-semibold">
                      Number of Listings
                    </TableHead>
                    <TableHead className="font-semibold">Last Active</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="font-semibold">
                      Customer Name
                    </TableHead>
                    <TableHead className="font-semibold">
                      Phone Number
                    </TableHead>
                    <TableHead className="font-semibold">Last Active</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={activeTab === "vendors" ? 8 : 4}
                    className="text-center py-8 text-gray-500"
                  >
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : displayData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={activeTab === "vendors" ? 8 : 4}
                    className="text-center py-8 text-gray-500"
                  >
                    {allData.length === 0 ? "No users available" : "No users match your filters"}
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={user.avatar || "/default-avatar.png"}
                          width={40}
                          height={40}
                          alt={user.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {activeTab === "vendors" && (
                      <>
                        <TableCell>{user.businessName || "-"}</TableCell>
                        <TableCell>{user.phoneNumber}</TableCell>
                        <TableCell>
                          <Badge
                            className={`${getPlanBadgeColor(
                              user.plan || ""
                            )} text-white`}
                          >
                            {user.plan || "No Plan"}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.numberOfListings || "0"}</TableCell>
                        <TableCell>{user.lastActive}</TableCell>
                        <TableCell>
                          <Badge
                            className={`${getStatusBadgeColor(
                              user.status
                            )} text-white`}
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                      </>
                    )}

                    {activeTab === "customers" && (
                      <>
                        <TableCell>{user.phoneNumber}</TableCell>
                        <TableCell>{user.lastActive}</TableCell>
                      </>
                    )}

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
                          <DropdownMenuItem
                            onClick={() => handleViewProfile(user.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pause className="mr-2 h-4 w-4" />
                            Suspend
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Message
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Verify
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
        {!isLoading && displayData.length > 0 && (
          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-semibold">
                {startItem}-{endItem}
              </span>{" "}
              from <span className="font-semibold">{allData.length}</span> data
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="h-9 w-9 hover:bg-gray-100 disabled:opacity-50 rounded-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "ghost"}
                  size="icon"
                  onClick={() => handlePageChange(page)}
                  className={`h-9 w-9 rounded-md ${
                    currentPage === page
                      ? "bg-[#93C01F] text-white hover:bg-[#93C01F]/90"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="h-9 w-9 hover:bg-gray-100 disabled:opacity-50 rounded-md"
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