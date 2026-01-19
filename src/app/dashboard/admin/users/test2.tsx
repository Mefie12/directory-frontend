/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare,
  MoreHorizontal,
  Pause,
  Loader2,
  Play,
  Search,
  User as UserIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar: string;
  phone?: string;
  listings_count: string;
  role: "vendor" | "customer" | "user" | "admin";
  plan?: "Basic" | "Premium" | "Pro" | "Enterprise";
  last_active: string;
  status: "Active" | "Pending" | "Suspended" | "Inactive";
  is_suspended?: boolean;
}

type TabType = "all" | "vendors" | "customers" | "admins";

export default function Users() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [allData, setAllData] = useState<User[]>([]);
  const [displayData, setDisplayData] = useState<User[]>([]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [suspendForm, setSuspendForm] = useState({
    reason: "",
    duration: "1_day",
    custom_date: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

  const getAuthToken = useCallback((): string | null => {
    return typeof window !== "undefined"
      ? localStorage.getItem("authToken")
      : null;
  }, []);

  const extractUsersFromResponse = useCallback((data: any): User[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.items || data.users || data.data || data.results || [];
  }, []);

  const loadAllData = useCallback(async () => {
    if (authLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/all_users`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setAllData(extractUsersFromResponse(data));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load users";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, API_URL, getAuthToken, extractUsersFromResponse]);

  useEffect(() => {
    if (!authLoading && authUser) loadAllData();
  }, [authUser, authLoading, loadAllData]);

  const handleSuspendSubmit = async () => {
    if (!selectedUser || !suspendForm.reason)
      return toast.error("Reason required");
    setIsActionLoading(true);
    try {
      const token = getAuthToken();
      const payload = {
        reason: suspendForm.reason,
        duration:
          suspendForm.duration === "custom" ? null : suspendForm.duration,
        custom_date:
          suspendForm.duration === "custom" ? suspendForm.custom_date : null,
      };

      const res = await fetch(
        `${API_URL}/api/users/${selectedUser.id}/suspend`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) throw new Error("Suspension failed");
      toast.success("User suspended");
      setIsSuspendModalOpen(false);
      await loadAllData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnsuspend = async (user: User) => {
    setIsActionLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/api/users/${user.id}/unsuspend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Unsuspension failed");
      toast.success("User unsuspended");
      await loadAllData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  useEffect(() => {
    const filtered = allData.filter((u) => {
      const status = (u.status || "").toLowerCase().trim();
      const filter = statusFilter.toLowerCase().trim();
      const role = (u.role || "").toLowerCase();

      if (activeTab === "vendors" && role !== "vendor") return false;
      if (activeTab === "customers" && !["customer", "user"].includes(role))
        return false;
      if (activeTab === "admins" && role !== "admin") return false;

      if (filter !== "all" && status !== filter) return false;
      if (planFilter !== "all" && (u.plan || "").toLowerCase() !== planFilter)
        return false;

      if (search) {
        const s = search.toLowerCase();
        return (
          `${u.first_name} ${u.last_name}`.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s) ||
          (u.phone && u.phone.includes(s))
        );
      }
      return true;
    });

    const total = Math.ceil(filtered.length / itemsPerPage);
    setTotalPages(total || 1);
    const start = (currentPage - 1) * itemsPerPage;
    setDisplayData(filtered.slice(start, start + itemsPerPage));
  }, [allData, statusFilter, planFilter, search, currentPage, activeTab]);

  useEffect(
    () => setCurrentPage(1),
    [statusFilter, planFilter, search, activeTab],
  );

  return (
    <div className="p-2 lg:p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Users</h1>

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
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            {activeTab === "vendors" && (
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-200">
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                {activeTab === "vendors" && <TableHead>Plan</TableHead>}
                <TableHead>Last Active</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : displayData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((u) => {
                  const isSuspended =
                    (u.status || "").toLowerCase().trim() === "suspended" ||
                    u.is_suspended;
                  return (
                    <TableRow key={u.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <Image
                              src={u.avatar}
                              width={40}
                              height={40}
                              alt="Avatar"
                              className="rounded-full h-10 w-10 object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="h-5" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">
                              {u.first_name} {u.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{u.phone || "N/A"}</TableCell>
                      {activeTab === "vendors" && (
                        <TableCell>
                          <Badge className="bg-[#548235]">
                            {u.plan || "Free"}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell>
                        {u.last_active
                          ? formatDistanceToNow(new Date(u.last_active), {
                              addSuffix: true,
                            })
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-500 text-white">
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/dashboard/admin/users/${u.id}`)
                              }
                            >
                              <Eye className="mr-2 h-4" /> View Profile
                            </DropdownMenuItem>
                            {isSuspended ? (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => handleUnsuspend(u)}
                              >
                                <Play className="mr-2 h-4" /> Unsuspend
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-yellow-600"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setIsSuspendModalOpen(true);
                                }}
                              >
                                <Pause className="mr-2 h-4" /> Suspend
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <MessageSquare className="mr-2 h-4" /> Message
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isSuspendModalOpen} onOpenChange={setIsSuspendModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Provide a reason and duration for this account suspension.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={suspendForm.reason}
                onChange={(e) =>
                  setSuspendForm({ ...suspendForm, reason: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSuspendModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSuspendSubmit}
              disabled={isActionLoading}
              className="bg-red-600"
            >
              {isActionLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Confirm Suspension"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
