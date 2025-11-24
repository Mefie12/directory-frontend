"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  ChevronDown,
//   FileText,
  MessageSquare,
  MoreVertical,
  Star,
  Tag,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";

interface ActivityItem {
  id: string;
  type: "listing" | "review" | "upgrade";
  title: string;
  description: string;
  timestamp: string;
  icon: "listing" | "review" | "upgrade";
}

interface UserDetails {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  avatar: string;
  listingsCount: number;
  plan: "Basic" | "Premium" | "Pro";
  status: "Active" | "Pending" | "Suspended";
  businessDescription: string;
  recentActivity: ActivityItem[];
}

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUserDetails() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/users/${params.id}`);
        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.error("Failed to load user details:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadUserDetails();
  }, [params.id]);

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "Basic":
        return "bg-green-500 hover:bg-green-600";
      case "Premium":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "Pro":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-600 hover:bg-green-700";
      case "Pending":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "Suspended":
        return "bg-red-600 hover:bg-red-700";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "listing":
        return (
          <div className="w-12 h-12 rounded-full bg-[#93C01F] flex items-center justify-center">
            <Tag className="w-6 h-6 text-white" />
          </div>
        );
      case "review":
        return (
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
        );
      case "upgrade":
        return (
          <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
            <Star className="w-6 h-6 text-white" />
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#93C01F] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">User not found</p>
          <Button
            onClick={() => router.back()}
            className="mt-4 bg-[#93C01F] hover:bg-[#7ea919]"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-4">
                <Image
                  src={user.avatar}
                  width={56}
                  height={56}
                  alt={user.name}
                  className="h-14 w-14 rounded-full object-cover"
                />
                <div>
                  <h1 className="text-2xl font-semibold">{user.name}</h1>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <span>
                      Email: <span className="text-[#93C01F]">{user.email}</span>
                    </span>
                    <span>•</span>
                    <span>Phone number: {user.phoneNumber}</span>
                    <span>•</span>
                    <span>Listings: {user.listingsCount}</span>
                    <span>•</span>
                    <Badge
                      className={`${getPlanBadgeColor(user.plan)} text-white`}
                    >
                      {user.plan}
                    </Badge>
                    <span>•</span>
                    <Badge
                      className={`${getStatusBadgeColor(user.status)} text-white`}
                    >
                      {user.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  More Actions
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Suspend User</DropdownMenuItem>
                <DropdownMenuItem>Send Message</DropdownMenuItem>
                <DropdownMenuItem>Verify Account</DropdownMenuItem>
                <DropdownMenuItem>View Listings</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  Delete Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 mt-6 border-b -mb-1px">
            {["overview", "listings", "reviews", "billing"].map((tab) => (
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
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Business Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Business Description
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {user.businessDescription}
                </p>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Recent Activity</h2>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {user.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {activity.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "listings" && (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Listings content will go here</p>
            </CardContent>
          </Card>
        )}

        {activeTab === "reviews" && (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Reviews content will go here</p>
            </CardContent>
          </Card>
        )}

        {activeTab === "billing" && (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Billing content will go here</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}