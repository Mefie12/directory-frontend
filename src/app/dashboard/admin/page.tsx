"use client";

import { useState } from "react";
import {
  Users,
  Tag,
  Mail,
  CreditCard,
  AlertTriangle,
  Flag,
  Banknote,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  MoreHorizontal,
  Activity,
  BarChart3,
  Eye,
  MessageSquare,
  Bookmark,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/dashboard/stat-cards";
import RecentActivityCard from "@/components/dashboard/recent-activity";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

// --- INTERFACES ---
interface RecentActivityItem {
  id: string;
  initials: string;
  color: string;
  title: string;
  description: string;
  timestamp: string;
}

interface PendingListingItem {
  id: number;
  name: string;
  action: string;
  time: string;
  initials: string;
  color: string;
}

interface FlaggedContentItem {
  id: number;
  title: string;
  reason: string;
  time: string;
}

interface PaymentIssueItem {
  id: number;
  title: string;
  desc: string;
}

interface ListingItem {
  id: number;
  name: string;
  image: string;
  category: string;
  location: string;
  status: "Published" | "Pending" | "Draft";
  views: number;
  comments: number;
  bookmarks: number;
  rating: number;
}

// --- MOCK DATA ---

const recentActivityData: RecentActivityItem[] = [
  {
    id: "1",
    initials: "UP",
    color: "bg-[#F2994A]",
    title: "Plan Upgrade",
    description: "Added new listing “Greenbowl Spintex Branch”",
    timestamp: "10th July 2025, 12:34 PM",
  },
  {
    id: "2",
    initials: "LA",
    color: "bg-[#93C01F]",
    title: "Listing Added",
    description: "Added new listing “Greenbowl Spintex Branch”",
    timestamp: "10th July 2025, 12:34 PM",
  },
];

const pendingListingsData: PendingListingItem[] = [
  {
    id: 1,
    name: "@Greenbowl restaurant",
    action: "submitted a business...",
    time: "5 mins ago",
    initials: "GR",
    color: "bg-[#93C01F]",
  },
  {
    id: 2,
    name: "@BPM",
    action: "submitted an event",
    time: "Yesterday",
    initials: "BP",
    color: "bg-[#5D5FEF]",
  },
  {
    id: 3,
    name: "@Kente & Crafts",
    action: "submitted a business...",
    time: "Sept 8",
    initials: "KC",
    color: "bg-[#5ea0d6]",
  },
];

const flaggedContentData: FlaggedContentItem[] = [
  {
    id: 1,
    title: "Review on @Ama's Boutique",
    reason: "flagged for offensive text",
    time: "5 mins ago",
  },
  {
    id: 2,
    title: "@Quick Loans Ghana",
    reason: "vendor flagged for misleading info",
    time: "5 mins ago",
  },
];

const paymentIssuesData: PaymentIssueItem[] = [
  {
    id: 1,
    title: "Payment Failed",
    desc: "@Kwame's Catering - GHS 450 payment failed",
  },
  {
    id: 2,
    title: "Refund Requested",
    desc: "@EventHub Africa - GHS 1,200 refund requested",
  },
];

const listingsData: ListingItem[] = [
  {
    id: 1,
    name: "Greenbowl Restaurant",
    image: "/images/image-1.jpg",
    category: "Restaurant",
    location: "Accra, Ghana",
    status: "Published",
    views: 1234,
    comments: 32,
    bookmarks: 18,
    rating: 4.7,
  },
  {
    id: 2,
    name: "Accra Music Festival",
    image: "/images/image-2.jpg",
    category: "Event",
    location: "Accra, Ghana",
    status: "Pending",
    views: 850,
    comments: 12,
    bookmarks: 45,
    rating: 0,
  },
];

// --- CHART DATA ---
const revenuePieData = [
  { name: "Community", value: 400, color: "#9CA3AF" }, // Gray
  { name: "Pro", value: 300, color: "#5D5FEF" }, // Purple
  { name: "Premium", value: 300, color: "#93C01F" }, // Green
];

const vendorGrowthData = [
  { name: "Jan", value: 100 },
  { name: "Feb", value: 400 },
  { name: "Mar", value: 300 },
  { name: "Apr", value: 800 },
  { name: "May", value: 500 },
  { name: "Jun", value: 900 },
  { name: "Jul", value: 1200 },
];

const listingCreationData = [
  { name: "Jan", business: 400, event: 240 },
  { name: "Feb", business: 300, event: 139 },
  { name: "Mar", business: 200, event: 980 },
  { name: "Apr", business: 278, event: 390 },
  { name: "May", business: 189, event: 480 },
  { name: "Jun", business: 239, event: 380 },
  { name: "Jul", business: 349, event: 430 },
];

// Set to true to see the "populated" lines
const hasChartData = true;

export default function Dashboard() {
  const router = useRouter();

  // --- Dynamic State for Dropdowns ---
  const [vendorGrowthFilter, setVendorGrowthFilter] = useState("This year");
  const [listingActivityFilter, setListingActivityFilter] =
    useState("This year");

  // Helper for Status Badge
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Published":
        return "bg-green-100 text-green-700 hover:bg-green-100";
      case "Pending":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100";
    }
  };

  return (
    <div className="px-1 lg:px-8 py-6 space-y-6 min-h-screen bg-white">
      {/* --- Header Intro --- */}
      <div className="flex flex-col md:flex-row lg:items-center justify-between">
        <div className="mb-4">
          <h4 className="text-2xl font-semibold text-gray-900">
            Welcome back, George
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            Here is what&apos;s happening with your listings
          </p>
        </div>
      </div>

      {/* --- Row 1: Quick Stat Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Vendors"
          icon={Users}
          statValue={null}
          trend={8}
          trendIconUp={TrendingUp}
          trendIconDown={TrendingDown}
        />
        <StatCard
          title="Active Listings"
          icon={Tag}
          statValue={null}
          trend={-2}
          trendIconUp={TrendingUp}
          trendIconDown={TrendingDown}
        />
        <StatCard
          title="Inquiries"
          icon={Mail}
          statValue={null}
          trend={12}
          trendIconUp={TrendingUp}
          trendIconDown={TrendingDown}
        />
        <StatCard
          title="Revenue"
          icon={CreditCard}
          statValue={null}
          trend={-5}
          trendIconUp={TrendingUp}
          trendIconDown={TrendingDown}
        />
      </div>

      {/* --- Row 2: Status Cards (Pending, Flagged, Payment) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Pending Listings */}
        <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm flex flex-col h-auto min-h-[250px]">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            Pending Listings
          </h3>

          {pendingListingsData.length > 0 ? (
            // DATA STATE
            <div className="space-y-4">
              {pendingListingsData.map((item) => (
                <div key={item.id} className="flex gap-3 items-start group">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-medium shrink-0 ${item.color}`}
                  >
                    {item.initials}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-900">
                      <span className="font-semibold text-[#93C01F]">
                        {item.name}
                      </span>{" "}
                      {item.action}
                    </p>
                    <span className="text-[10px] text-gray-400">
                      {item.time}
                    </span>
                  </div>
                  {/* FUNCTIONAL ELLIPSIS */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-100  transition-opacity -mt-1"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Review</DropdownMenuItem>
                      <DropdownMenuItem>Approve</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Reject
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          ) : (
            // EMPTY STATE
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-[#E9F5D6] rounded-full flex items-center justify-center mb-3 border border-[#E9F5D6]">
                <AlertTriangle className="w-6 h-6 text-[#93C01F]" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                No Pending Listings
              </p>
            </div>
          )}
        </div>

        {/* 2. Flagged Content */}
        <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm flex flex-col h-auto min-h-[250px]">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            Flagged Content
          </h3>

          {flaggedContentData.length > 0 ? (
            // DATA STATE
            <div className="space-y-4">
              {flaggedContentData.map((item) => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center shrink-0">
                    <Flag className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-900">
                      {item.title}{" "}
                      <span className="text-gray-500">{item.reason}</span>
                    </p>
                    <span className="text-[10px] text-gray-400">
                      {item.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // EMPTY STATE
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-[#F9F5E6] rounded-full flex items-center justify-center mb-3 border border-[#F9F5E6]">
                <Flag className="w-6 h-6 text-[#93C01F]" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                No Flagged Content
              </p>
            </div>
          )}
        </div>

        {/* 3. Payment Issues */}
        <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm flex flex-col h-auto min-h-[250px]">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            Payment Issues
          </h3>

          {paymentIssuesData.length > 0 ? (
            // DATA STATE
            <div className="space-y-4">
              {paymentIssuesData.map((item) => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#93C01F] flex items-center justify-center text-xs text-white font-medium shrink-0">
                    AM
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // EMPTY STATE
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-[#E9F5D6] rounded-full flex items-center justify-center mb-3 border border-[#E9F5D6]">
                <Banknote className="w-6 h-6 text-[#93C01F]" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                No Payment Issues
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- Row 3: Activity & Revenue --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="h-full">
          {recentActivityData.length > 0 ? (
            <RecentActivityCard items={recentActivityData} />
          ) : (
            <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm h-full min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-semibold text-gray-900">
                  Recent Activity
                </h3>
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex flex-col items-center justify-center h-[300px]">
                <div className="w-12 h-12 bg-white border border-gray-100 shadow-none rounded-full flex items-center justify-center mb-4">
                  <Activity className="w-5 h-5 text-[#93C01F]" />
                </div>
                <p className="text-xs text-gray-900 font-medium">
                  No Recent yet
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Revenue Breakdown */}
        <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm h-full min-h-[400px]">
          <h3 className="text-base font-semibold text-gray-900 mb-6">
            Revenue Breakdown
          </h3>

          {hasChartData ? (
            <div className="flex flex-col items-center justify-center h-[300px]">
              {/* RECHARTS PIE CHART */}
              <div className="h-[200px] w-full flex justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenuePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {revenuePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <p className="text-xs text-gray-500">Total Revenue</p>
                  <h4 className="text-2xl font-bold text-gray-900">138</h4>
                </div>
              </div>

              {/* Legend */}
              <div className="flex gap-6 mt-4">
                {revenuePieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Empty State
            <div className="flex flex-col items-center justify-center h-[300px]">
              <div className="w-12 h-12 bg-white border border-gray-100 shadow-none rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5 text-[#93C01F]" />
              </div>
              <p className="text-xs text-gray-900 font-medium">
                No Revenue yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- Row 4: Charts with Real Dropdowns --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Vendor Growth (LINE/AREA CHART) */}
        <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold text-gray-900">
              Vendor Growth Trend
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-gray-500 h-8 gap-1 font-normal"
                >
                  {vendorGrowthFilter} <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setVendorGrowthFilter("This week")}
                >
                  This week
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setVendorGrowthFilter("This month")}
                >
                  This month
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setVendorGrowthFilter("This year")}
                >
                  This year
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="h-64 w-full">
            {hasChartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={vendorGrowthData}
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#93C01F" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#93C01F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "none" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#93C01F"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border-t border-dashed relative">
                <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-300">
                  {/* Fake Grid lines for empty state */}
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-full h-px bg-gray-100" />
                  ))}
                </div>
                <span className="text-xs text-gray-500 bg-white px-2 z-10">
                  No data showing
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Listings Creation (BAR CHART) */}
        <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold text-gray-900">
              Listings Creation Activity
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-gray-500 h-8 gap-1 font-normal"
                >
                  {listingActivityFilter} <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setListingActivityFilter("This week")}
                >
                  This week
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setListingActivityFilter("This month")}
                >
                  This month
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setListingActivityFilter("This year")}
                >
                  This year
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="h-64 w-full">
            {hasChartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={listingCreationData}
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                  barSize={20}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f3f4f6" }}
                    contentStyle={{ borderRadius: "8px", border: "none" }}
                  />
                  <Bar
                    dataKey="business"
                    stackId="a"
                    fill="#5D5FEF"
                    radius={[0, 0, 4, 4]}
                  />
                  <Bar
                    dataKey="event"
                    stackId="a"
                    fill="#4FD1C5"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border-t border-dashed relative">
                <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-300">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-full h-px bg-gray-100" />
                  ))}
                </div>
                <span className="text-xs text-gray-500 bg-white px-2 z-10">
                  No data showing
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-4 pl-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-2 bg-[#5D5FEF] rounded-sm"></div>
              <span className="text-xs text-gray-600">Business</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-2 bg-[#4FD1C5] rounded-sm"></div>
              <span className="text-xs text-gray-600">Event</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Row 5: Listings Table --- */}
      <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base font-semibold text-gray-900">Listings</h2>
          <Button
            variant="link"
            onClick={() => router.push("/dashboard/listings")}
            className="text-[#93C01F] cursor-pointer hover:no-underline text-xs"
          >
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {listingsData.length > 0 ? (
          // DATA STATE (Shadcn Table)
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[300px]">Listing Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stats Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listingsData.map((listing) => (
                  <TableRow key={listing.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 relative rounded-full overflow-hidden bg-gray-100">
                          {/* Fallback image logic handled by Next/Image usually, simplified here */}
                          <Image
                            src={listing.image}
                            alt={listing.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="font-medium text-sm text-gray-900">
                          {listing.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {listing.category}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {listing.location}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={getStatusStyles(listing.status)}
                      >
                        {listing.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {listing.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />{" "}
                          {listing.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bookmark className="w-3 h-3" /> {listing.bookmarks}
                        </span>
                        <span className="flex items-center gap-1 text-gray-900 font-medium">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{" "}
                          {listing.rating > 0 ? listing.rating : "N/A"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          // EMPTY STATE
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-12 h-12 bg-white border border-gray-100 shadow-none rounded-full flex items-center justify-center mb-4">
              <Tag className="w-5 h-5 text-[#93C01F]" />
            </div>
            <h3 className="text-xs font-bold text-gray-900">
              No Listings yet.
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Listings by vendors will show here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
