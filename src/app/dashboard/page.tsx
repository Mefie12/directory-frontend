import { Button } from "@/components/ui/button";
import { Plus, Bookmark, TrendingDown, Eye, TrendingUp, Mail } from "lucide-react";
import StatCard from "@/components/dashboard/stat-cards";

export default function Dashboard() {
  return (
    <div className="px-8 py-3 space-y-6">
      {/* Header Intro */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-2xl font-semibold">Welcome back, John Doe!</h4>
          <p className="text-base font-normal">
            Here is what&apos;s happening with your listings
          </p>
        </div>
        <Button className="bg-[#93C01F] py-3.5 px-4 hover:bg-[#93C01F]/80 cursor-pointer">
          <span>
            <Plus className="w-4 h-4" />
          </span>
          Add new listing
        </Button>
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-3 gap-3 mt-3">
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
          title="Inquiries Received"
          icon={Mail}
          statValue={null}
          trend={18} // positive = green TrendingUp
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

      {/* Recent Activity */}
      
    </div>
  );
}
