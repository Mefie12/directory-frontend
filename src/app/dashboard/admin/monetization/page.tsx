"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Filter,
  Search,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Inbox,
  Bookmark,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit2,
  PauseCircle,
  Trash2,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import StatCards from "@/components/dashboard/stat-cards";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


// --- Interfaces ---
interface SubscriptionSummary {
  plan: string;
  vendors: number;
  revenue: number;
  color: string;
}

interface VendorPayment {
  id: string;
  vendor: {
    name: string;
    email: string;
    avatar: string;
  };
  phone: string;
  plan: "Basic" | "Premium" | "Pro";
  amount: number;
  date: string;
  status: "Paid" | "Pending" | "Failed";
}

interface Slot {
  id: string;
  type: string;
  location: string;
  price: string;
  activeSlots: string;
}

interface FeaturedListing {
  id: string;
  vendor: {
    name: string;
    email: string;
    avatar: string;
  };
  listingName: string;
  slotType: string;
  duration: string;
  amount: number;
  status: "Active" | "Pending";
}

// --- Mock Data ---

const MOCK_SUBSCRIPTION_SUMMARY: SubscriptionSummary[] = [
  { plan: "Basic", vendors: 100, revenue: 600, color: "bg-[#548235]" },
  { plan: "Premium", vendors: 30, revenue: 5400, color: "bg-[#F2C94C]" },
  { plan: "Pro", vendors: 1, revenue: 1600, color: "bg-[#5ea0d6]" },
];

const MOCK_PAYMENTS: VendorPayment[] = [
  {
    id: "1",
    vendor: {
      name: "Enock Hanson",
      email: "enockhanson@gmail.com",
      avatar: "",
    },
    phone: "+233 245 678 892",
    plan: "Basic",
    amount: 600,
    date: "Apr 14, 2024",
    status: "Paid",
  },
  {
    id: "2",
    vendor: { name: "Kwame Mensah", email: "kwame@catering.com", avatar: "" },
    phone: "+44 2454 678892",
    plan: "Premium",
    amount: 1200,
    date: "Mar 19, 2024",
    status: "Pending",
  },
  {
    id: "3",
    vendor: { name: "Parry Bernard", email: "parry@music.com", avatar: "" },
    phone: "+1(666) 245-0892",
    plan: "Pro",
    amount: 1600,
    date: "Jun 14, 2024",
    status: "Failed",
  },
];

const MOCK_SLOTS: Slot[] = [
  {
    id: "1",
    type: "Homepage Slot",
    location: "Homepage",
    price: "$100/week",
    activeSlots: "2/5",
  },
  {
    id: "2",
    type: "Event Highlight",
    location: "Events",
    price: "$50/week",
    activeSlots: "1/5",
  },
  {
    id: "3",
    type: "Community Top",
    location: "Community",
    price: "$20/3 days",
    activeSlots: "5/5",
  },
];

const MOCK_FEATURED_LISTINGS: FeaturedListing[] = [
  {
    id: "1",
    vendor: {
      name: "Enock Hanson",
      email: "enockhanson@gmail.com",
      avatar: "",
    },
    listingName: "Greenbowl Catering",
    slotType: "Homepage Slot",
    duration: "Apr 15 - Apr 30",
    amount: 600,
    status: "Active",
  },
  {
    id: "2",
    vendor: { name: "Kwame Mensah", email: "kwame@catering.com", avatar: "" },
    listingName: "Accra Music Festival",
    slotType: "Event Highlight",
    duration: "Mar 20 - Sep 27",
    amount: 1200,
    status: "Active",
  },
  {
    id: "3",
    vendor: { name: "Parry Bernard", email: "parry@music.com", avatar: "" },
    listingName: "Ama's Boutique",
    slotType: "Homepage Slot",
    duration: "Jun 28 - Jul 13",
    amount: 1600,
    status: "Pending",
  },
];

// --- Helper Components ---

const StatusBadge = ({
  status,
  planColor,
}: {
  status?: string;
  planColor?: string;
}) => {
  if (planColor) {
    return (
      <span
        className={`${planColor} text-white px-3 py-1 rounded-full text-xs font-medium`}
      >
        {status}
      </span>
    );
  }

  const styles = {
    Active: "bg-[#548235] text-white",
    Paid: "bg-[#548235] text-white",
    Pending: "bg-[#F2C94C] text-white",
    Failed: "bg-[#EB5757] text-white",
  };

  const icons = {
    Active: <CheckCircle className="w-3 h-3 mr-1" />,
    Paid: <CheckCircle className="w-3 h-3 mr-1" />,
    Pending: <Clock className="w-3 h-3 mr-1" />,
    Failed: <AlertCircle className="w-3 h-3 mr-1" />,
  };

  const key = (status || "Pending") as keyof typeof styles;

  return (
    <span
      className={`flex items-center w-fit px-2.5 py-1 rounded-md text-xs font-medium ${styles[key]}`}
    >
      {icons[key]}
      {status}
    </span>
  );
};

// --- Main Component ---

export default function Monetization() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "subscription" | "featuredListings"
  >("subscription");

  // --- Dialog State (Fixed: Added Missing State) ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // --- Data State ---
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [featuredListings, setFeaturedListings] = useState<FeaturedListing[]>(
    []
  );

  // --- Filter State (Payments) ---
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("All");
  const [paymentPlanFilter, setPaymentPlanFilter] = useState("All");

  // --- Filter State (Featured Listings) ---
  const [listingSearch, setListingSearch] = useState("");
  const [listingStatusFilter, setListingStatusFilter] = useState("All");

  // 1. API Fetch Placeholder
  useEffect(() => {
    const fetchData = async () => {
      // In a real scenario, fetch calls go here.
      setPayments(MOCK_PAYMENTS);
      setSlots(MOCK_SLOTS);
      setFeaturedListings(MOCK_FEATURED_LISTINGS);
    };

    if (authUser) {
      fetchData();
    }
  }, [authUser]);

  // 2. Derived State for Payments (Filtered)
  const filteredPayments = useMemo(() => {
    let result = payments;

    // Search
    if (paymentSearch) {
      const lowerSearch = paymentSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.vendor.name.toLowerCase().includes(lowerSearch) ||
          p.vendor.email.toLowerCase().includes(lowerSearch)
      );
    }

    // Status
    if (paymentStatusFilter !== "All") {
      result = result.filter((p) => p.status === paymentStatusFilter);
    }

    // Plan
    if (paymentPlanFilter !== "All") {
      result = result.filter((p) => p.plan === paymentPlanFilter);
    }

    return result;
  }, [payments, paymentSearch, paymentStatusFilter, paymentPlanFilter]);

  // 3. Derived State for Featured Listings (Filtered)
  const filteredListings = useMemo(() => {
    let result = featuredListings;

    // Search
    if (listingSearch) {
      const lowerSearch = listingSearch.toLowerCase();
      result = result.filter(
        (l) =>
          l.vendor.name.toLowerCase().includes(lowerSearch) ||
          l.listingName.toLowerCase().includes(lowerSearch)
      );
    }

    // Status
    if (listingStatusFilter !== "All") {
      result = result.filter((l) => l.status === listingStatusFilter);
    }

    return result;
  }, [featuredListings, listingSearch, listingStatusFilter]);

  // Handlers for Slot Actions
  const handleEditClick = (slot: Slot) => {
    setSelectedSlot(slot);
    setIsEditOpen(true);
  };

  const handlePauseClick = (slot: Slot) => {
    setSelectedSlot(slot);
    setIsPauseOpen(true);
  };

  // Loading/Auth checks
  if (authLoading)
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!authUser)
    return <div className="p-8 text-red-500">Please login to continue.</div>;

  return (
    <div className="p-2 lg:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Monetization</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage platform revenue streams, vendor subscriptions, and
          transactions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("subscription")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "subscription"
              ? "text-[#93C01F]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Subscription
          {activeTab === "subscription" && (
            <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-[#93C01F]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("featuredListings")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "featuredListings"
              ? "text-[#93C01F]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Featured Listings
          {activeTab === "featuredListings" && (
            <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-[#93C01F]" />
          )}
        </button>
      </div>

      {/* === TAB: SUBSCRIPTION === */}
      {activeTab === "subscription" && (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Quick Stats
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCards
                title="Total Revenue"
                icon={DollarSign}
                statValue={25000}
                trend={8}
                trendIconUp={TrendingUp}
                trendIconDown={TrendingDown}
              />
              <StatCards
                title="Revenue This Month"
                icon={Inbox}
                statValue={2300}
                trend={18}
                trendIconUp={TrendingUp}
                trendIconDown={TrendingDown}
              />
              <StatCards
                title="Active Subscriptions"
                icon={Bookmark}
                statValue={45}
                trend={-5}
                trendIconUp={TrendingUp}
                trendIconDown={TrendingDown}
              />
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Subscriptions</h3>
            <div className="bg-white rounded-xl border border-gray-200 shadow-none overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-200">
                  <TableRow>
                    <TableHead className="py-4">Plan</TableHead>
                    <TableHead>Vendors</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_SUBSCRIPTION_SUMMARY.map((sub) => (
                    <TableRow key={sub.plan}>
                      <TableCell className="py-5">
                        <StatusBadge status={sub.plan} planColor={sub.color} />
                      </TableCell>
                      <TableCell className="py-5">{sub.vendors}</TableCell>
                      <TableCell className="py-5">${sub.revenue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Vendor Payments */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Vendor Payments</h3>

            {/* Filter Bar */}
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search"
                  className="pl-9 bg-white"
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-white min-w-[100px] justify-between"
                  >
                    {paymentStatusFilter === "All"
                      ? "Status"
                      : paymentStatusFilter}{" "}
                    <Filter className="w-4 h-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setPaymentStatusFilter("All")}
                  >
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPaymentStatusFilter("Paid")}
                  >
                    Paid
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPaymentStatusFilter("Pending")}
                  >
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPaymentStatusFilter("Failed")}
                  >
                    Failed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Plan Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-white min-w-[100px] justify-between"
                  >
                    {paymentPlanFilter === "All" ? "Plan" : paymentPlanFilter}{" "}
                    <Filter className="w-4 h-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setPaymentPlanFilter("All")}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPaymentPlanFilter("Basic")}
                  >
                    Basic
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPaymentPlanFilter("Premium")}
                  >
                    Premium
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPaymentPlanFilter("Pro")}>
                    Pro
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-none overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-200">
                  <TableRow>
                    <TableHead className="py-4">Vendor Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((pay) => (
                      <TableRow key={pay.id}>
                        <TableCell className="py-5">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={pay.vendor.avatar} />
                              <AvatarFallback>
                                {pay.vendor.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {pay.vendor.name}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {pay.vendor.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 py-5">
                          {pay.phone}
                        </TableCell>
                        <TableCell className="py-5">
                          <StatusBadge
                            status={pay.plan}
                            planColor={
                              pay.plan === "Basic"
                                ? "bg-[#548235]"
                                : pay.plan === "Premium"
                                ? "bg-[#F2C94C]"
                                : "bg-[#5ea0d6]"
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 py-5">
                          ${pay.amount}
                        </TableCell>
                        <TableCell className="text-gray-600 py-5">
                          {pay.date}
                        </TableCell>
                        <TableCell className="py-5">
                          <StatusBadge status={pay.status} />
                        </TableCell>
                        <TableCell className="py-5">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-gray-600"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>
                                Download Invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-gray-500"
                      >
                        No payments found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* === TAB: FEATURED LISTINGS === */}
      {activeTab === "featuredListings" && (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Quick Stats
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCards
                title="Total Revenue"
                icon={DollarSign}
                statValue={25000}
                trend={8}
                trendIconUp={TrendingUp}
                trendIconDown={TrendingDown}
              />
              <StatCards
                title="Revenue This Month"
                icon={Inbox}
                statValue={2300}
                trend={18}
                trendIconUp={TrendingUp}
                trendIconDown={TrendingDown}
              />
              <StatCards
                title="Active Subscriptions"
                icon={Bookmark}
                statValue={45}
                trend={-5}
                trendIconUp={TrendingUp}
                trendIconDown={TrendingDown}
              />
            </div>
          </div>
          {/* Slot Management Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Slot Management
              </h3>
              <Button
                className="bg-[#93C01F] hover:bg-[#7da815]"
                onClick={() => setIsCreateOpen(true)}
              >
                Create slot rule
              </Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-none overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-200">
                  <TableRow>
                    <TableHead className="py-4">Slot Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Active Slots</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slots.map((slot) => (
                    <TableRow key={slot.id}>
                      <TableCell className="py-5 font-medium text-gray-700 bg-gray-50/30">
                        {slot.type}
                      </TableCell>
                      <TableCell className="py-5 text-gray-600">
                        {slot.location}
                      </TableCell>
                      <TableCell className="py-5 font-medium text-gray-900">
                        {slot.price}
                      </TableCell>
                      <TableCell className="py-5 text-gray-600">
                        {slot.activeSlots}
                      </TableCell>
                      <TableCell className="py-5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-gray-600"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => handleEditClick(slot)}
                            >
                              <Edit2 className="w-4 h-4 mr-2" /> Edit slot
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => handlePauseClick(slot)}
                            >
                              <PauseCircle className="w-4 h-4 mr-2" /> Pause
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Featured Listings Table */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">
              Featured Listings
            </h3>

            {/* Filter Bar */}
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search"
                  className="pl-9 bg-white"
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-white min-w-[100px] justify-between"
                  >
                    {listingStatusFilter === "All"
                      ? "Status"
                      : listingStatusFilter}{" "}
                    <ChevronLeft className="w-3 h-3 text-gray-400 -rotate-90" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setListingStatusFilter("All")}
                  >
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setListingStatusFilter("Active")}
                  >
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setListingStatusFilter("Pending")}
                  >
                    Pending
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-none overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-200">
                  <TableRow>
                    <TableHead className="py-4">Vendor Name</TableHead>
                    <TableHead>Listing Name</TableHead>
                    <TableHead>Slot Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredListings.length > 0 ? (
                    filteredListings.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell className="py-5">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={listing.vendor.avatar} />
                              <AvatarFallback>
                                {listing.vendor.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {listing.vendor.name}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {listing.vendor.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-5 text-gray-600">
                          {listing.listingName}
                        </TableCell>
                        <TableCell className="py-5 text-gray-600">
                          {listing.slotType}
                        </TableCell>
                        <TableCell className="py-5 text-gray-600">
                          {listing.duration}
                        </TableCell>
                        <TableCell className="py-5 font-medium text-gray-900">
                          ${listing.amount}
                        </TableCell>
                        <TableCell className="py-5">
                          <StatusBadge status={listing.status} />
                        </TableCell>
                        <TableCell className="py-5">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-gray-600"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit Listing</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-gray-500"
                      >
                        No listings found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* === DIALOGS === */}
      {/* 1. Create Slot Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Creating a slot
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">
                Slot name
              </label>
              <Input id="name" placeholder="Slot name" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">
                Placement location
              </label>
              <Select>
                <SelectTrigger className="w-full text-gray-400">
                  <SelectValue placeholder="Select placement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Homepage</SelectItem>
                  <SelectItem value="events">Events Page</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Pricing
                </label>
                <Input placeholder="Price" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Billing Model
                </label>
                <Select>
                  <SelectTrigger className="w-full text-gray-400">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">
                Duration
              </label>
              <Select>
                <SelectTrigger className="w-full text-gray-400">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1week">1 Week</SelectItem>
                  <SelectItem value="2weeks">2 Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">
                Slot name
              </label>
              <Input id="slot_name_confirm" placeholder="Slot name" />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="border-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setIsCreateOpen(false)}
              className="bg-[#93C01F] hover:bg-[#7da815]"
            >
              Create Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Edit Slot Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Slot</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">
                Slot name
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue
                    placeholder={selectedSlot?.type || "Slot name"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Option 1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">
                Placement location
              </label>
              <Select>
                <SelectTrigger className="w-full text-gray-400">
                  <SelectValue placeholder="Select placement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Homepage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Pricing
                </label>
                <Input placeholder="Price" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Billing Model
                </label>
                <Select>
                  <SelectTrigger className="w-full text-gray-400">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">
                Duration
              </label>
              <Select>
                <SelectTrigger className="w-full text-gray-400">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1week">1 Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">
                Slot name
              </label>
              <Input placeholder="Slot name" />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="border-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setIsEditOpen(false)}
              className="bg-[#93C01F] hover:bg-[#7da815]"
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Pause Slot Dialog */}
      <Dialog open={isPauseOpen} onOpenChange={setIsPauseOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Pause Slot</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-500 text-sm leading-relaxed">
              Pausing this slot will prevent new purchases. Existing ads will
              continue to run until they expire. Do you want to continue?
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsPauseOpen(false)}
              className="border-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setIsPauseOpen(false)}
              className="bg-[#93C01F] hover:bg-[#7da815]"
            >
              Confirm pause
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}