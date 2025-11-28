"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  Tag,
  Mail,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StatCard from "@/components/dashboard/stat-cards";
import RecentActivityCard from "@/components/dashboard/recent-activity";
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
import { useAuth } from "@/context/auth-context";

// --- FRONTEND INTERFACES ---

interface DashboardStats {
  totalVendors: number;
  activeListings: number;
  inquiries: number;
  revenue: number;
  trends: {
    vendors: number;
    listings: number;
    inquiries: number;
    revenue: number;
  };
}

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

interface ChartDataPoint {
  name: string;
  value?: number;
  business?: number;
  event?: number;
}

// --- API RESPONSE INTERFACES (Raw Data) ---

interface ApiStats {
  vendors_count: number;
  listings_count: number;
  inquiries_count: number;
  total_revenue: number;
  trends?: {
    vendors: number;
    listings: number;
    inquiries: number;
    revenue: number;
  };
}

interface ApiRecentActivity {
  id: number | string;
  user?: { initials?: string };
  color?: string;
  title: string;
  description: string;
  created_at_human?: string;
}

interface ApiPendingListing {
  id: number;
  vendor_name: string;
  created_at_human: string;
  vendor_initials?: string;
}

interface ApiFlaggedContent {
  id: number;
  subject: string;
  reason: string;
  created_at_human: string;
}

interface ApiPaymentIssue {
  id: number;
  type: string;
  description: string;
}

interface ApiListing {
  id: number;
  name: string;
  image?: string;
  category: string;
  location: string;
  status: "Published" | "Pending" | "Draft";
  rating?: number;
  stats?: {
    views?: number;
    comments?: number;
    bookmarks?: number;
  };
}

interface ApiRevenueBreakdown {
  label: string;
  amount: number;
  color?: string;
}

interface RawDashboardData {
  stats: ApiStats;
  recent_activity: ApiRecentActivity[];
  pending_listings: ApiPendingListing[];
  flagged_content: ApiFlaggedContent[];
  payment_issues: ApiPaymentIssue[];
  listings: ApiListing[];
  revenue_breakdown: ApiRevenueBreakdown[];
}

interface ApiChartResponse {
  data: ChartDataPoint[];
}

export default function Dashboard() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();

  // --- State ---
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>(
    []
  );
  const [pendingListings, setPendingListings] = useState<PendingListingItem[]>(
    []
  );
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContentItem[]>(
    []
  );
  const [paymentIssues, setPaymentIssues] = useState<PaymentIssueItem[]>([]);
  const [listings, setListings] = useState<ListingItem[]>([]);

  // Charts State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [revenuePieData, setRevenuePieData] = useState<any[]>([]);
  const [vendorGrowthData, setVendorGrowthData] = useState<ChartDataPoint[]>(
    []
  );
  const [listingCreationData, setListingCreationData] = useState<
    ChartDataPoint[]
  >([]);

  // Filter State
  const [vendorGrowthFilter, setVendorGrowthFilter] = useState("This year");
  const [listingActivityFilter, setListingActivityFilter] =
    useState("This year");

  const [isLoading, setIsLoading] = useState(true);

  // --- Helper: Auth Token ---
  const getAuthToken = useCallback(() => {
    if (typeof window !== "undefined") return localStorage.getItem("authToken");
    return null;
  }, []);

  // --- Helper: Mappers ---
  const mapData = (data: RawDashboardData) => {
    // Stats
    setStats({
      totalVendors: data.stats?.vendors_count || 0,
      activeListings: data.stats?.listings_count || 0,
      inquiries: data.stats?.inquiries_count || 0,
      revenue: data.stats?.total_revenue || 0,
      trends: {
        vendors: data.stats?.trends?.vendors || 0,
        listings: data.stats?.trends?.listings || 0,
        inquiries: data.stats?.trends?.inquiries || 0,
        revenue: data.stats?.trends?.revenue || 0,
      },
    });

    // Recent Activity
    setRecentActivity(
      (data.recent_activity || []).map((item) => ({
        id: item.id.toString(),
        initials: item.user?.initials || "NA",
        color: item.color || "bg-gray-500",
        title: item.title,
        description: item.description,
        timestamp: item.created_at_human || "Just now",
      }))
    );

    // Pending Listings
    setPendingListings(
      (data.pending_listings || []).map((item) => ({
        id: item.id,
        name: item.vendor_name,
        action: "submitted a listing",
        time: item.created_at_human,
        initials: item.vendor_initials || "VN",
        color: "bg-[#93C01F]",
      }))
    );

    // Flagged Content
    setFlaggedContent(
      (data.flagged_content || []).map((item) => ({
        id: item.id,
        title: item.subject,
        reason: item.reason,
        time: item.created_at_human,
      }))
    );

    // Payment Issues
    setPaymentIssues(
      (data.payment_issues || []).map((item) => ({
        id: item.id,
        title: item.type,
        desc: item.description,
      }))
    );

    // Listings Table
    setListings(
      (data.listings || []).map((item) => ({
        id: item.id,
        name: item.name,
        image: item.image || "/images/placeholder.png",
        category: item.category,
        location: item.location,
        status: item.status,
        views: item.stats?.views || 0,
        comments: item.stats?.comments || 0,
        bookmarks: item.stats?.bookmarks || 0,
        rating: item.rating || 0,
      }))
    );

    // Revenue Pie Chart
    setRevenuePieData(
      (data.revenue_breakdown || []).map((item) => ({
        name: item.label,
        value: item.amount,
        color: item.color || "#9CA3AF",
      }))
    );
  };

  // --- API Fetch: Main Dashboard Data ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (authLoading) return;
      if (!authUser) return;

      setIsLoading(true);
      try {
        const token = getAuthToken();
        const API_URL =
          process.env.API_URL || "https://me-fie.co.uk";

        const response = await fetch(`${API_URL}/api/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch dashboard data");

        const json = await response.json();
        // Handle potential wrapper
        const apiData = (json.data || json) as RawDashboardData;
        mapData(apiData);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [authUser, authLoading, getAuthToken]);

  // --- API Fetch: Dynamic Charts ---
  const fetchChartData = useCallback(
    async (type: "growth" | "creation", period: string) => {
      try {
        const token = getAuthToken();
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

        const timeParam = period.toLowerCase().replace("this ", "");

        const endpoint =
          type === "growth"
            ? `${API_URL}/api/admin/charts/vendor-growth?period=${timeParam}`
            : `${API_URL}/api/admin/charts/listing-creation?period=${timeParam}`;

        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return [];

        const json = await response.json();
        const chartResponse = json as ApiChartResponse;
        return chartResponse.data || [];
      } catch (error) {
        console.error(`Error fetching ${type} chart:`, error);
        return [];
      }
    },
    [getAuthToken]
  );

  // Vendor Growth Chart Effect
  useEffect(() => {
    if (!authUser) return;
    fetchChartData("growth", vendorGrowthFilter).then(setVendorGrowthData);
  }, [vendorGrowthFilter, fetchChartData, authUser]);

  // Listing Creation Chart Effect
  useEffect(() => {
    if (!authUser) return;
    fetchChartData("creation", listingActivityFilter).then(
      setListingCreationData
    );
  }, [listingActivityFilter, fetchChartData, authUser]);

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

  if (authLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="px-1 lg:px-8 py-6 space-y-6 min-h-screen">
      {/* --- Header Intro --- */}
      <div className="flex flex-col md:flex-row lg:items-center justify-between">
        <div className="mb-4">
          <h4 className="text-2xl font-semibold text-gray-900">
            Welcome back, {authUser?.name || "User"}
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
          statValue={stats?.totalVendors ?? null}
          trend={stats?.trends.vendors || 0}
          trendIconUp={TrendingUp}
          trendIconDown={TrendingDown}
        />
        <StatCard
          title="Active Listings"
          icon={Tag}
          statValue={stats?.activeListings ?? null}
          trend={stats?.trends.listings || 0}
          trendIconUp={TrendingUp}
          trendIconDown={TrendingDown}
        />
        <StatCard
          title="Inquiries"
          icon={Mail}
          statValue={stats?.inquiries ?? null}
          trend={stats?.trends.inquiries || 0}
          trendIconUp={TrendingUp}
          trendIconDown={TrendingDown}
        />
        <StatCard
          title="Revenue"
          icon={Banknote}
          statValue={stats?.revenue ?? null}
          trend={stats?.trends.revenue || 0}
          trendIconUp={TrendingUp}
          trendIconDown={TrendingDown}
        />
      </div>

      {/* --- Row 2: Status Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Pending Listings */}
        <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm flex flex-col h-auto min-h-[250px]">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            Pending Listings
          </h3>
          {pendingListings.length > 0 ? (
            <div className="space-y-4">
              {pendingListings.map((item) => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-medium ${item.color}`}
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
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          ) : (
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
          {flaggedContent.length > 0 ? (
            <div className="space-y-4">
              {flaggedContent.map((item) => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center">
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
          {paymentIssues.length > 0 ? (
            <div className="space-y-4">
              {paymentIssues.map((item) => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#93C01F] flex items-center justify-center text-xs text-white font-medium">
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
          {recentActivity.length > 0 ? (
            <RecentActivityCard items={recentActivity} />
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
          {revenuePieData.length > 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px]">
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
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <p className="text-xs text-gray-500">Total Revenue</p>
                  <h4 className="text-2xl font-bold text-gray-900">
                    {stats?.revenue || 0}
                  </h4>
                </div>
              </div>
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

      {/* --- Row 4: Charts --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor Growth */}
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
            {vendorGrowthData.length > 0 ? (
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
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border-t border-dashed relative">
                <span className="text-xs text-gray-500 bg-white px-2 z-10">
                  No data showing
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Listings Creation */}
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
            {listingCreationData.length > 0 ? (
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
                    animationDuration={800}
                  />
                  <Bar
                    dataKey="event"
                    stackId="a"
                    fill="#4FD1C5"
                    radius={[4, 4, 0, 0]}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border-t border-dashed relative">
                <span className="text-xs text-gray-500 bg-white px-2 z-10">
                  No data showing
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Row 5: Listings Table --- */}
      <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base font-semibold text-gray-900">Listings</h2>
          <Button
            variant="link"
            onClick={() => router.push("/dashboard/admin/listings")}
            className="text-[#93C01F] cursor-pointer hover:no-underline text-xs"
          >
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        {listings.length > 0 ? (
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
                {listings.slice(0, 5).map((listing) => (
                  <TableRow key={listing.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 relative rounded-full overflow-hidden bg-gray-100">
                          <Avatar>
                            <AvatarImage
                              src={listing.image}
                              className="object-cover"
                            />
                            <AvatarFallback>
                              {listing.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
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
                          {listing.rating}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
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
