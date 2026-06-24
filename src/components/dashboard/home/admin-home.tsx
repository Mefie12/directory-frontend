"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Users,
  Tag,
  Mail,
  Banknote,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface ChartDataPoint {
  name: string;
  value?: number;
  business?: number;
  event?: number;
}

// --- API RESPONSE INTERFACES ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

interface ApiUserStats extends AnyRecord {
  total_users?: number;
  total?: number;
  vendors?: number;
  vendors_count?: number;
  customers?: number;
  customers_count?: number;
  admins?: number;
}

interface ApiListingStats extends AnyRecord {
  total?: number;
  total_listings?: number;
  business?: number;
  businesses?: number;
  event?: number;
  events?: number;
  community?: number;
  communities?: number;
  pending?: number;
  pending_count?: number;
  published?: number;
  published_count?: number;
}

interface ApiActivityItem extends AnyRecord {
  type?: string;   // e.g. "listing_created", "user_signup"
  message?: string;
  timestamp?: string;
  icon?: string;   // e.g. "store", "user-plus"
}

export default function AdminHome() {
  const { user: authUser, loading: authLoading } = useAuth();

  // --- State ---
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [listingTypePieData, setListingTypePieData] = useState<any[]>([]);
  const [vendorGrowthData, setVendorGrowthData] = useState<ChartDataPoint[]>([]);
  const [listingCreationData, setListingCreationData] = useState<ChartDataPoint[]>([]);
  const [vendorGrowthFilter, setVendorGrowthFilter] = useState("This year");
  const [listingActivityFilter, setListingActivityFilter] = useState("This year");
  const [isLoading, setIsLoading] = useState(true);

  // Maps UI label → backend period param (valid values confirmed: this_week, this_month, this_year)
  const toPeriod = (filter: string) =>
    filter.toLowerCase().replace(" ", "_");

  // --- Helper: Auth Token ---
  const getAuthToken = useCallback(() => {
    if (typeof window !== "undefined") return localStorage.getItem("authToken");
    return null;
  }, []);

  // --- Helper: normalise a time-series array to { name, value } for recharts ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normaliseTimeSeries = (raw: any[]): ChartDataPoint[] =>
    raw.map((item) => ({
      name: item.month || item.label || item.name || item.period || "",
      value: item.count ?? item.value ?? item.total ?? 0,
      business: item.business ?? item.businesses ?? undefined,
      event: item.event ?? item.events ?? undefined,
    }));

  // --- API Fetch: All Dashboard Data (parallel) ---
  useEffect(() => {
    if (authLoading || !authUser) return;

    const fetchAll = async () => {
      setIsLoading(true);
      const token = getAuthToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      };

      try {
        const [
          userStatsRes,
          listingStatsRes,
          activityRes,
          vendorGrowthRes,
          listingGrowthRes,
        ] = await Promise.all([
          fetch("/api/admin/user_stats", { headers }),
          fetch("/api/admin/listing_stats", { headers }),
          fetch("/api/admin/recent_activity", { headers }),
          fetch(`/api/admin/vendor_growth?period=${toPeriod(vendorGrowthFilter)}`, { headers }),
          fetch(`/api/admin/listing_growth?period=${toPeriod(listingActivityFilter)}`, { headers }),
        ]);

        const [
          userStatsJson,
          listingStatsJson,
          activityJson,
          vendorGrowthJson,
          listingGrowthJson,
        ]: AnyRecord[] = await Promise.all([
          userStatsRes.ok ? userStatsRes.json() : ({} as AnyRecord),
          listingStatsRes.ok ? listingStatsRes.json() : ({} as AnyRecord),
          activityRes.ok ? activityRes.json() : ({} as AnyRecord),
          vendorGrowthRes.ok ? vendorGrowthRes.json() : ({} as AnyRecord),
          listingGrowthRes.ok ? listingGrowthRes.json() : ({} as AnyRecord),
        ]);

        // user_stats → stat cards
        const us: ApiUserStats = userStatsJson?.data ?? userStatsJson ?? {};
        const ls: ApiListingStats = listingStatsJson?.data ?? listingStatsJson ?? {};

        setStats({
          totalVendors: us.vendors ?? us.vendors_count ?? us.total_vendors ?? 0,
          activeListings:
            ls.total ?? ls.total_listings ?? ls.published ?? ls.published_count ?? 0,
          inquiries: us.customers ?? us.customers_count ?? 0,
          revenue: 0,
          trends: { vendors: 0, listings: 0, inquiries: 0, revenue: 0 },
        });

        // listing_stats → pie chart (business / event / community breakdown)
        const pieSlices = [
          { name: "Business", value: ls.business ?? ls.businesses ?? 0, color: "#93C01F" },
          { name: "Event", value: ls.event ?? ls.events ?? 0, color: "#5D5FEF" },
          { name: "Community", value: ls.community ?? ls.communities ?? 0, color: "#4FD1C5" },
        ].filter((s) => s.value > 0);
        setListingTypePieData(pieSlices);

        // recent_activity → activity feed
        const rawActivity: ApiActivityItem[] = Array.isArray(activityJson)
          ? activityJson
          : (activityJson?.data ?? activityJson?.activities ?? []);

        const typeInitials: Record<string, string> = {
          listing_created: "LS",
          user_signup: "US",
          vendor_signup: "VS",
          listing_updated: "LU",
        };
        const typeColor: Record<string, string> = {
          listing_created: "bg-[#E9F5D6]",
          user_signup: "bg-[#DBEAFE]",
          vendor_signup: "bg-[#FEF9C3]",
          listing_updated: "bg-[#E9F5D6]",
        };

        setRecentActivity(
          rawActivity.map((item, index) => ({
            id: String(index),
            initials: typeInitials[item.type ?? ""] ?? (item.type ?? "AC").slice(0, 2).toUpperCase(),
            color: typeColor[item.type ?? ""] ?? "bg-[#F3F4F6]",
            title: item.message || "Activity",
            description: "",
            timestamp: item.timestamp
              ? new Date(item.timestamp).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Just now",
          })),
        );

        // vendor_growth → area chart
        const vgRaw: AnyRecord[] = Array.isArray(vendorGrowthJson)
          ? vendorGrowthJson
          : (vendorGrowthJson?.data ?? []);
        setVendorGrowthData(normaliseTimeSeries(vgRaw));

        // listing_growth → stacked bar chart
        const lgRaw: AnyRecord[] = Array.isArray(listingGrowthJson)
          ? listingGrowthJson
          : (listingGrowthJson?.data ?? []);
        setListingCreationData(normaliseTimeSeries(lgRaw));
      } catch (error) {
        console.error(error);
        toast.error("Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, authLoading]);

  // Re-fetch vendor growth when period filter changes
  useEffect(() => {
    if (!authUser || isLoading) return;
    const token = getAuthToken();
    fetch(`/api/admin/vendor_growth?period=${toPeriod(vendorGrowthFilter)}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : ({} as AnyRecord)))
      .then((json: AnyRecord) => {
        const raw: AnyRecord[] = Array.isArray(json) ? json : (json?.data ?? []);
        setVendorGrowthData(normaliseTimeSeries(raw));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorGrowthFilter]);

  // Re-fetch listing growth when period filter changes
  useEffect(() => {
    if (!authUser || isLoading) return;
    const token = getAuthToken();
    fetch(`/api/admin/listing_growth?period=${toPeriod(listingActivityFilter)}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : ({} as AnyRecord)))
      .then((json: AnyRecord) => {
        const raw: AnyRecord[] = Array.isArray(json) ? json : (json?.data ?? []);
        setListingCreationData(normaliseTimeSeries(raw));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingActivityFilter]);

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
            Welcome back,{" "}
            {authUser?.first_name || authUser?.name?.split(" ")[0] || "User"}
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
          title="Customers"
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

      {/* --- Row 2: Activity & Listing Type Breakdown --- */}
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
              </div>
              <div className="flex flex-col items-center justify-center h-[300px]">
                <div className="w-12 h-12 bg-white border border-gray-100 shadow-none rounded-full flex items-center justify-center mb-4">
                  <Activity className="w-5 h-5 text-[#93C01F]" />
                </div>
                <p className="text-xs text-gray-900 font-medium">
                  No Recent Activity yet
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Listing Type Breakdown */}
        <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm h-full min-h-[400px]">
          <h3 className="text-base font-semibold text-gray-900 mb-6">
            Listing Type Breakdown
          </h3>
          {listingTypePieData.length > 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px]">
              <div className="h-[200px] w-full flex justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={listingTypePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {listingTypePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <p className="text-xs text-gray-500">Total</p>
                  <h4 className="text-2xl font-bold text-gray-900">
                    {listingTypePieData.reduce((sum, d) => sum + d.value, 0)}
                  </h4>
                </div>
              </div>
              <div className="flex gap-6 mt-4">
                {listingTypePieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: item.color }}
                    />
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
                No listing data yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- Row 3: Growth Charts --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor Growth */}
        <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold text-gray-900">
              Vendor Growth Trend
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs text-gray-500 h-8 gap-1 font-normal">
                  {vendorGrowthFilter} <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setVendorGrowthFilter("This week")}>This week</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setVendorGrowthFilter("This month")}>This month</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setVendorGrowthFilter("This year")}>This year</DropdownMenuItem>
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
                    <linearGradient id="colorVendor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#93C01F" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#93C01F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
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
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#93C01F"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVendor)"
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

        {/* Listings Creation Activity */}
        <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold text-gray-900">
              Listings Creation Activity
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs text-gray-500 h-8 gap-1 font-normal">
                  {listingActivityFilter} <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setListingActivityFilter("This week")}>This week</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setListingActivityFilter("This month")}>This month</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setListingActivityFilter("This year")}>This year</DropdownMenuItem>
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
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
    </div>
  );
}
