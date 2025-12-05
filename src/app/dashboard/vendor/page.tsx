"use client"

import { Button } from "@/components/ui/button";
import {
  Plus,
  Bookmark,
  TrendingDown,
  Eye,
  TrendingUp,
  Mail,
  ChevronRight,
} from "lucide-react";
import StatCard from "@/components/dashboard/stat-cards";
import RecentActivityCard from "@/components/dashboard/recent-activity";
import { Chart } from "@/components/dashboard/bar-chart";
import { ListingsTable } from "@/components/dashboard/listing-table";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  // const recentActivity = [
  //   {
  //     id: "1",
  //     initials: "AK",
  //     color: "bg-blue-500",
  //     title: "New Review Received",
  //     description:
  //       "@Ama K. left a review on Jollof Palace Restaurant: ‘Best Ghanaian food in Accra!’",
  //     timestamp: "Yesterday at 5:30 PM",
  //   },
  //   {
  //     id: "2",
  //     initials: "KW",
  //     color: "bg-orange-400",
  //     title: "New Inquiry Received",
  //     description:
  //       "@Kwame Mensah sent you a message about Event Catering Services",
  //     timestamp: "September 4, 2025 at 5:30 PM",
  //   },
  //   {
  //     id: "3",
  //     initials: "TF",
  //     color: "bg-purple-500",
  //     title: "Listing Published",
  //     description:
  //       "Your new listing Afro Hair Studio has been approved and is now live.",
  //     timestamp: "Today at 5:30 PM",
  //   },
  // ];

const listings = [
    {
      id: "1",
      name: "Greenbowl Restaurant",
      slug: "greenbowl-restaurant", // Added
      image: "/images/image-1.jpg",
      allImages: ["/images/image-1.jpg"], // Added
      category: "Restaurant",
      type: "Venue", // Added
      location: "Accra, Ghana",
      status: "published" as const,
      views: 1234,
      comments: 32,
      bookmarks: 18,
      rating: 4.7,
    },
    {
      id: "2",
      name: "Ghana Cultural Festival",
      slug: "ghana-cultural-festival", // Added
      image: "/images/image-2.jpg",
      allImages: ["/images/image-2.jpg"], // Added
      category: "Festival",
      type: "Event", // Added
      location: "Accra, Ghana",
      status: "pending" as const,
      views: 1234,
      comments: 32,
      bookmarks: 18,
      rating: 4.7,
    },
    {
      id: "3",
      name: "Greenbowl Restaurant",
      slug: "greenbowl-restaurant-2", // Added
      image: "/images/image-1.jpg",
      allImages: ["/images/image-1.jpg"], // Added
      category: "Beauty",
      type: "Service", // Added
      location: "Accra, Ghana",
      status: "drafted" as const,
      views: 1234,
      comments: 32,
      bookmarks: 18,
      rating: 4.7,
    },
  ];
  return (
    <div className="px-1 lg:px-8 py-3 space-y-6">
      {/* Header Intro */}
      <div className="flex flex-col md:flex-row lg:items-center justify-between">
        <div className="mb-4">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <RecentActivityCard items={[]} />
        {/* Chart */}
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

      {/* My listing */}
      <div>
        <div className="w-full rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-xs">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold text-[#0F1A2A] mb-10">
              My Listings
            </h2>
            <div className="text-sm pr-3 cursor-pointer">
              <Button
                variant="link"
                onClick={()=>(router.push("/dashboard/my-listing"))}
                className="text-[#93C01F] cursor-pointer hover:no-underline"
              >
                View all{" "}
                <span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </Button>
            </div>
          </div>

          {/* Table */}
          <ListingsTable listings={listings} showPagination={false} itemsPerPage={4}/>
        </div>
      </div>
    </div>
  );
}
