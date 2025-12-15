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
  User as UserIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { formatDistanceToNow } from "date-fns";

// --- Types ---
interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar: string;
  phone?: string;
  listings_count: string;
  // Role determines the Tab (Vendor, Customer, Admin)
  role: "vendor" | "customer" | "user" | "admin";
  plan?: "Basic" | "Premium" | "Pro" | "Enterprise";
  last_active: string;
  // Status determines filter (Active, Suspended)
  status: "Active" | "Pending" | "Suspended" | "Inactive";
}

// Added 'all' to the TabType
type TabType = "all" | "vendors" | "customers" | "admins";

export default function Users() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();

  // State - Default to 'all'
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [allData, setAllData] = useState<User[]>([]);
  const [displayData, setDisplayData] = useState<User[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Loading/Error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Helpers ---
  const getAuthToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  };

  const extractUsersFromResponse = (data: unknown): User[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data as User[];

    const payload = data as {
      items?: User[];
      users?: User[];
      data?: User[];
      results?: User[];
    };

    if (payload.items && Array.isArray(payload.items)) return payload.items;
    if (payload.users && Array.isArray(payload.users)) return payload.users;
    if (payload.data && Array.isArray(payload.data)) return payload.data;
    if (payload.results && Array.isArray(payload.results))
      return payload.results;

    return [];
  };

  // --- Fetch Data ---
  useEffect(() => {
    async function loadAllData() {
      if (authLoading) return;
      if (!authUser) {
        setError("Authentication required to view users");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        const API_URL = process.env.API_URL || "https://me-fie.co.uk";

        const response = await fetch(`${API_URL}/api/all_users`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) throw new Error("Authentication failed");
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const users = extractUsersFromResponse(data);
        setAllData(users);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load users"
        );
        setAllData([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadAllData();
  }, [authUser, authLoading]);

  // --- Filtering Logic ---
  useEffect(() => {
    const safeAllData = Array.isArray(allData) ? allData : [];

    const filteredData = safeAllData.filter((user) => {
      // 1. Tab Logic (Role Based)
      const userRole = (user.role || "").toLowerCase();

      // If activeTab is 'all', we skip this check and include everyone
      if (activeTab === "vendors") {
        if (userRole !== "vendor") return false;
      } else if (activeTab === "customers") {
        if (userRole !== "customer" && userRole !== "user") return false;
      } else if (activeTab === "admins") {
        if (userRole !== "admin") return false;
      }

      // 2. Status Filter
      if (
        statusFilter !== "all" &&
        user.status?.toLowerCase() !== statusFilter
      ) {
        return false;
      }

      // 3. Plan Filter (Only relevant for Vendors usually)
      if (planFilter !== "all" && user.plan?.toLowerCase() !== planFilter) {
        return false;
      }

      // 4. Search Filter
      if (search) {
        const searchLower = search.toLowerCase();
        const nameMatch = `${user.first_name || ""} ${
          user.last_name || ""
        }`
          .toLowerCase()
          .includes(searchLower);
        const emailMatch = (user.email || "")
          .toLowerCase()
          .includes(searchLower);
        const phoneMatch = (user.phone || "").includes(searchLower);
        return nameMatch || emailMatch || phoneMatch;
      }

      return true;
    });

    // Pagination Calculation
    const totalItems = filteredData.length;
    const computedTotalPages = Math.ceil(totalItems / itemsPerPage);
    setTotalPages(computedTotalPages || 1);

    if (currentPage > computedTotalPages && computedTotalPages > 0) {
      setCurrentPage(1);
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayData(filteredData.slice(startIndex, endIndex));
  }, [allData, statusFilter, planFilter, search, currentPage, activeTab]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, planFilter, search, activeTab]);

  // --- Badge Helpers ---
  const getRoleBadgeColor = (role: string) => {
    const r = (role || "").toLowerCase();
    switch (r) {
      case "vendor":
        return "bg-orange-500 hover:bg-orange-600";
      case "customer":
      case "user":
        return "bg-blue-500 hover:bg-blue-600";
      case "admin":
        return "bg-purple-600 hover:bg-purple-700";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    const p = (plan || "").toLowerCase();
    switch (p) {
      case "basic":
        return "bg-[#548235] hover:bg-[#548235]/90"; // Green
      case "premium":
        return "bg-[#6f42c1] hover:bg-[#6f42c1]/90"; // Purple
      case "pro":
        return "bg-[#0366d6] hover:bg-[#0366d6]/90"; // Blue
      case "enterprise":
        return "bg-zinc-800 hover:bg-zinc-900"; // Black
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  // --- Pagination Helpers ---
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxPagesToShow = 4;
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) pages.push(1, 2, 3, 4);
      else if (currentPage >= totalPages - 2)
        pages.push(
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      else
        pages.push(
          currentPage - 1,
          currentPage,
          currentPage + 1,
          currentPage + 2
        );
    }
    return pages;
  };

  const { startItem, endItem } = (() => {
    const s = (currentPage - 1) * itemsPerPage + 1;
    const e = s + displayData.length - 1;
    return { startItem: s, endItem: e > 0 ? e : 0 };
  })();

  // --- Actions ---
  const handleViewProfile = (userId: string) => {
    router.push(`/dashboard/admin/users/${userId}`);
  };

  if (authLoading)
    return <div className="p-6 text-gray-500">Loading authentication...</div>;
  if (!authUser)
    return <div className="p-6 text-red-700">Authentication Required</div>;

  return (
    <div className="p-2 lg:p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Users</h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b">
        {(["all", "vendors", "customers", "admins"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative capitalize ${
              activeTab === tab
                ? "text-[#93C01F]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#93C01F]" />
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <strong>Error: </strong> {error}
        </div>
      )}

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or phone"
              className="rounded-lg pl-9 shadow-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
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

            {/* Plan Filter - ONLY visible when specific to Vendors tab */}
            {activeTab === "vendors" && (
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
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-200">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Phone Number</TableHead>

                {/* Plan Column - Vendors Only */}
                {activeTab === "vendors" && (
                  <TableHead className="font-semibold">Plan</TableHead>
                )}

                {/* Listings Column - Vendors Only */}
                {activeTab === "vendors" && (
                  <TableHead className="font-semibold">Listings</TableHead>
                )}

                <TableHead className="font-semibold">Last Active</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
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
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : displayData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500"
                  >
                    {allData.length === 0
                      ? "No users available"
                      : "No users match your filters"}
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <Image
                            src={user.avatar}
                            width={40}
                            height={40}
                            alt={user.first_name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{`${user.first_name} ${user.last_name}`}</div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>{user.phone || "N/A"}</TableCell>

                    {/* Plan Badge - Vendors Only */}
                    {activeTab === "vendors" && (
                      <TableCell>
                        <Badge
                          className={`${getPlanBadgeVariant(
                            user.plan || ""
                          )} text-white`}
                        >
                          {user.plan || "Free"}
                        </Badge>
                      </TableCell>
                    )}

                    {/* Listings Count - Vendors Only */}
                    {activeTab === "vendors" && (
                      <TableCell>{user.listings_count || "0"}</TableCell>
                    )}

                    <TableCell>
                      {user.last_active
                        ? formatDistanceToNow(new Date(user.last_active), {
                            addSuffix: true,
                          })
                        : "Never"}
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={`${getRoleBadgeColor(
                          user.role
                        )} text-white capitalize`}
                      >
                        {user.role || "Unknown"}
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
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewProfile(user.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-yellow-600">
                            <Pause className="mr-2 h-4 w-4" /> Suspend
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="mr-2 h-4 w-4" /> Message
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
              </span>
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-9 w-9 rounded-full border"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex gap-1">
                {getPageNumbers().map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setCurrentPage(page)}
                    className={`h-9 w-9 rounded-full ${
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="h-9 w-9 rounded-full border"
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