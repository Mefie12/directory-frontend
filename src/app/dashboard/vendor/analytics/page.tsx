"use client";

import { Button } from "@/components/ui/button";
import {
  Bookmark,
  TrendingDown,
  Eye,
  TrendingUp,
  Mail,
  Bell,
  Upload,
} from "lucide-react";
import StatCard from "@/components/dashboard/stat-cards";
import { Chart } from "@/components/dashboard/bar-chart";

export default function Analytics() {
  return (
    <div className="px-1 lg:px-8 py-3 space-y-6">
      {/* Header Intro */}
      <div className="flex flex-col md:flex-row lg:items-center justify-between">
        <div className="mb-4">
          <h4 className="text-2xl font-semibold">Analytics</h4>
          <p className="text-base font-normal">
            Track your business performance and customer engagement.
          </p>
        </div>
        <Button className="bg-[#93C01F] py-3.5 px-4 hover:bg-[#93C01F]/80 cursor-pointer">
          <span>
            <Upload className="w-4 h-4" />
          </span>
          Export
        </Button>
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
        {/* Stat cards */}
        <StatCard
          title="Views (This month)"
          icon={Eye}
          statValue={null} // backend value
          trend={-8} // negative = red TrendingDown
          trendIconUp={TrendingUp}
          trendIconDown={TrendingDown}
        />

        <StatCard
          title="Inquiries (This month)"
          icon={Mail}
          statValue={null}
          trend={18} // positive = green TrendingUp
          trendIconUp={TrendingUp}
          trendIconDown={TrendingDown}
        />

        <StatCard
          title="Average Rating"
          icon={Bell}
          statValue={null}
          trend={5} // positive = green
          trendIconUp={TrendingUp}
          trendIconDown={TrendingDown}
        />

        <StatCard
          title="Bookmarks"
          icon={Bookmark}
          statValue={null}
          trend={5} // positive = green
          trendIconUp={TrendingUp}
          trendIconDown={TrendingDown}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Line */}
        <div>
          <div className="w-full rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-xs">
            <h2 className="text-xl font-semibold text-[#0F1A2A] mb-10">
              Traffic Over Time
            </h2>
            <Chart
              type="line"
              data={null}
              xAxisKey="month"
              stacked
              dataKeys={[
                { key: "views", label: "Views", color: "#93C01F" },
                { key: "clicks", label: "Clicks", color: "#1F6FEB" },
              ]}
            />
          </div>
        </div>

        {/* bar Chart */}
        <div>
          <div className="w-full rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-xs">
            <h2 className="text-xl font-semibold text-[#0F1A2A] mb-10">
              Engagement breakdown
            </h2>
            <Chart
              type="bar"
              data={null}
              xAxisKey="month"
              stacked
              dataKeys={[
                { key: "views", label: "Views", color: "#93C01F" },
                { key: "clicks", label: "Clicks", color: "#1F6FEB" },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
