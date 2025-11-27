"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StatCard from "@/components/dashboard/stat-cards";
import RecentActivityCard from "@/components/dashboard/recent-activity";
import { useRouter } from "next/navigation";

// Mock Data for Recent Activity
const recentActivityData = [
  {
    id: "1",
    initials: "GR",
    color: "bg-[#93C01F]",
    title: "New Vendor Registration",
    description: "@Greenbowl restaurant submitted a business registration.",
    timestamp: "5 mins ago",
  },
  {
    id: "2",
    initials: "BP",
    color: "bg-blue-600",
    title: "Event Created",
    description: "@BPM submitted an event 'Accra Music Festival'",
    timestamp: "Yesterday",
  },
  {
    id: "3",
    initials: "KC",
    color: "bg-blue-400",
    title: "Business Updated",
    description: "@Kente & Crafts Hub submitted a business update.",
    timestamp: "Sept 8",
  },
];

export default function Dashboard() {
  const router = useRouter();

  // --- Dynamic State for Dropdowns ---
  const [vendorGrowthFilter, setVendorGrowthFilter] = useState("This year");
  const [listingActivityFilter, setListingActivityFilter] = useState("This year");

  return (
    <div className="px-1 lg:px-8 py-6 space-y-6 min-h-screen">
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

      {/* --- Row 2: Status Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Listings */}
        <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm flex flex-col h-64">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            Pending Listings
          </h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-[#E9F5D6] rounded-full flex items-center justify-center mb-3 border border-[#E9F5D6]">
              <AlertTriangle className="w-6 h-6 text-[#93C01F]" />
            </div>
            <p className="text-sm font-medium text-gray-900">
              No Pending Listings
            </p>
          </div>
        </div>

        {/* Flagged Content */}
        <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm flex flex-col h-64">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            Flagged Content
          </h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-[#F9F5E6] rounded-full flex items-center justify-center mb-3 border border-[#F9F5E6]">
              <Flag className="w-6 h-6 text-[#93C01F]" />
            </div>
            <p className="text-sm font-medium text-gray-900">
              No Flagged Content
            </p>
          </div>
        </div>

        {/* Payment Issues */}
        <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm flex flex-col h-64">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            Payment Issues
          </h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-[#E9F5D6] rounded-full flex items-center justify-center mb-3 border border-[#E9F5D6]">
              <Banknote className="w-6 h-6 text-[#93C01F]" />
            </div>
            <p className="text-sm font-medium text-gray-900">
              No Payment Issues
            </p>
          </div>
        </div>
      </div>

      {/* --- Row 3: Activity & Revenue --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <RecentActivityCard items={recentActivityData} />

        {/* Revenue Breakdown */}
        <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm h-full">
          <h3 className="text-base font-semibold text-gray-900 mb-6">
            Revenue Breakdown
          </h3>
          <div className="flex flex-col items-center justify-center h-[300px]">
            {/* CSS Donut Chart */}
            <div className="relative w-48 h-48 rounded-full border-16 border-slate-50 flex items-center justify-center">
              {/* Colored Segments */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "conic-gradient(#9CA3AF 0% 15%, #5D5FEF 15% 65%, #93C01F 65% 100%)",
                  maskImage: "radial-gradient(transparent 58%, black 59%)",
                  WebkitMaskImage: "radial-gradient(transparent 58%, black 59%)",
                }}
              />
              <div className="text-center z-10">
                <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                <h4 className="text-3xl font-bold text-gray-900">138</h4>
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-6 mt-8">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-400"></div>
                <span className="text-xs text-gray-600">Community</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#5D5FEF]"></div>
                <span className="text-xs text-gray-600">Pro</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#93C01F]"></div>
                <span className="text-xs text-gray-600">Premium</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Row 4: Charts with Real Dropdowns --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Vendor Growth */}
        <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold text-gray-900">
              Vendor Growth Trend
            </h3>
            
            {/* Functional Dropdown */}
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

          {/* Empty Chart UI */}
          <div className="relative h-64 w-full flex flex-col justify-between text-xs text-gray-400">
            {[2000, 1500, 1000, 500, 100, 50, 0].map((val, i) => (
              <div key={i} className="flex items-center w-full">
                <span className="w-8 text-right mr-4">
                  {val === 2000 ? "2k" : val === 1500 ? "1.5k" : val === 1000 ? "1k" : val}
                </span>
                <div className="h-px bg-gray-100 flex-1 w-full"></div>
              </div>
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-gray-500 bg-white px-2">No data showing</span>
            </div>
            <div className="flex justify-between pl-12 pr-4 mt-2">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 2: Listings Creation */}
        <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold text-gray-900">
              Listings Creation Activity
            </h3>

            {/* Functional Dropdown */}
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

          {/* Empty Chart UI */}
          <div className="relative h-64 w-full flex flex-col justify-between text-xs text-gray-400">
            {[2000, 1500, 1000, 500, 100, 50, 0].map((val, i) => (
              <div key={i} className="flex items-center w-full">
                <span className="w-8 text-right mr-4">
                  {val === 2000 ? "2k" : val === 1500 ? "1.5k" : val === 1000 ? "1k" : val}
                </span>
                <div className="h-px bg-gray-100 flex-1 w-full"></div>
              </div>
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-gray-500 bg-white px-2">No data showing</span>
            </div>
            <div className="flex justify-between pl-12 pr-4 mt-2">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4 mt-4 pl-12">
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

      {/* --- Row 5: Listings (Empty State) --- */}
      <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-sm">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-base font-semibold text-gray-900">Listings</h2>
          <Button
            variant="link"
            onClick={() => router.push("/dashboard/listings")}
            className="text-[#93C01F] cursor-pointer hover:no-underline text-xs"
          >
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-12 h-12 bg-white border border-gray-100 shadow-sm rounded-full flex items-center justify-center mb-4">
            <Tag className="w-5 h-5 text-[#93C01F]" />
          </div>
          <h3 className="text-xs font-bold text-gray-900">No Listings yet.</h3>
          <p className="text-xs text-gray-400 mt-1">
            Listings by vendors will show here
          </p>
        </div>
      </div>
    </div>
  );
}