"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Menu, X, Bell } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { Separator } from "./separator";
import { Badge } from "./badge";
import { Button } from "./button";

// --- Interfaces ---
interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  link?: string;
}

interface RawNotification {
  id: string;
  data: {
    title: string;
    message: string;
    link?: string;
  };
  created_at: string;
  read_at: string | null;
}

// Helper type to handle potential missing properties on user
interface UserWithPlan {
  name?: string;
  email?: string;
  image?: string;
  role?: string;
  subscription_plan?: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Define currentUser properly for dependency arrays
  const currentUser = user as unknown as UserWithPlan;

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  // Get dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!user) return "/auth/login";

    switch (user.role?.toLowerCase()) {
      case "vendor":
        return "/dashboard/vendor";
      case "admin":
        return "/dashboard/admin";
      case "user":
        return "/dashboard/customer";
      default:
        return "/dashboard";
    }
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // --- Helpers ---

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  };

  // --- API Actions ---

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;

    try {
      const token = getAuthToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

      const response = await fetch(`${API_URL}/api/notifications`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to load notifications");

      const json = await response.json();
      const rawData: RawNotification[] = json.data || json;

      const mappedData: Notification[] = rawData.map((item) => ({
        id: item.id,
        title: item.data.title || "New Notification",
        message: item.data.message || "",
        time: formatNotificationTime(item.created_at),
        isRead: !!item.read_at,
        link: item.data.link || "",
      }));

      setNotifications(mappedData);
    } catch (error) {
      console.error("Notification Error:", error);
    }
  }, [currentUser]); // Dependency fixed

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      const token = getAuthToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

      await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
    } catch (error) {
      console.error("Failed to mark all as read", error);
      fetchNotifications();
    }
  };

  const handleViewInquiry = async (id: string, link?: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    try {
      const token = getAuthToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (link) {
        router.push(link);
      } else {
        router.push("/dashboard/inquiries");
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const handleViewAll = () => {
    router.push("/dashboard/notifications");
  };

  // Show loading state briefly
  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-(--background-secondary) text-white font-gilroy">
        <nav className="mx-auto px-4 py-2 sm:px-6 lg:px-16">
          <div className="flex items-center justify-between h-16">
            <div className="text-white">Loading...</div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-(--background-secondary) text-white font-gilroy">
      <nav className="mx-auto px-4 py-2 sm:px-6 lg:px-16">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-14">
            {/* Logo */}
            <div className="shrink-0">
              <Link href="/">
                <Image
                  src="/images/logos/mefie-logo.svg"
                  alt="MeFie Logo"
                  width={200}
                  height={100}
                  className="h-auto w-auto"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:space-x-8 flex-1 justify-center">
              <Link
                href="/discover"
                className={`relative text-base font-normal transition-colors ${
                  isActive("/discover")
                    ? "text-[#9ACC23] after:absolute after:-bottom-7 after:left-0 after:w-full after:h-0.5 after:bg-[#9ACC23]"
                    : "text-white/80 hover:text-white"
                }`}
              >
                Discover
              </Link>
              <Link
                href="/businesses"
                className={`relative text-base font-normal transition-colors ${
                  isActive("/businesses")
                    ? "text-[#9ACC23] after:absolute after:-bottom-7 after:left-0 after:w-full after:h-0.5 after:bg-[#9ACC23]"
                    : "text-white/80 hover:text-white"
                }`}
              >
                Businesses
              </Link>
              <Link
                href="/events"
                className={`relative text-base font-normal transition-colors ${
                  isActive("/events")
                    ? "text-[#9ACC23] after:absolute after:-bottom-7 after:left-0 after:w-full after:h-0.5 after:bg-[#9ACC23]"
                    : "text-white/80 hover:text-white"
                }`}
              >
                Events
              </Link>
              <Link
                href="/communities"
                className={`relative text-base font-normal transition-colors ${
                  isActive("/communities")
                    ? "text-[#9ACC23] after:absolute after:-bottom-7 after:left-0 after:w-full after:h-0.5 after:bg-[#9ACC23]"
                    : "text-white/80 hover:text-white"
                }`}
              >
                Communities
              </Link>
              <Link
                href="/about"
                className={`relative text-base font-normal transition-colors ${
                  isActive("/about")
                    ? "text-[#9ACC23] after:absolute after:-bottom-7 after:left-0 after:w-full after:h-0.5 after:bg-[#9ACC23]"
                    : "text-white/80 hover:text-white"
                }`}
              >
                About
              </Link>
            </div>
          </div>

          {/* Desktop Right Section */}
          <div className="hidden lg:flex lg:items-center lg:space-x-3">
            {user ? (
              // LOGGED IN STATE - Show user profile and bell icon
              <div className="flex items-center gap-4">
                {/* Notifications Dropdown */}
                <div className="flex items-center rounded-full bg-[#E9F0F6] p-2 cursor-pointer relative">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="relative">
                        <Bell className="h-5 w-5 text-gray-900" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="rounded-lg mt-2 w-80 p-0 shadow-lg border border-gray-100"
                      align="end"
                    >
                      <div className="flex flex-row items-center justify-between px-4 py-3 bg-white rounded-t-lg">
                        <DropdownMenuLabel className="text-lg font-semibold p-0 text-gray-900">
                          Notifications
                        </DropdownMenuLabel>
                        <Button
                          variant="link"
                          className="text-[#93C01F] text-xs p-0 h-auto font-normal hover:no-underline"
                          onClick={handleMarkAllRead}
                          disabled={unreadCount === 0}
                        >
                          Mark all as read
                        </Button>
                      </div>

                      <Separator />

                      <div className="max-h-80 overflow-y-auto bg-white">
                        {notifications.length > 0 ? (
                          notifications.map((item) => (
                            <DropdownMenuItem
                              key={item.id}
                              className={`flex items-start gap-3 px-4 py-3 cursor-default border-b border-gray-50 last:border-0 focus:bg-gray-50 ${
                                !item.isRead ? "bg-blue-50/50" : "bg-white"
                              }`}
                            >
                              <div className="w-10 h-10 rounded-lg bg-[#1e293b] flex items-center justify-center shrink-0 mt-1">
                                <Bell className="w-5 h-5 text-[#93C01F]" />
                              </div>

                              <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start">
                                  <p className="text-sm font-medium text-gray-900 leading-none">
                                    {item.title}
                                  </p>
                                  <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                    {item.time}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 leading-snug line-clamp-2">
                                  {item.message}
                                </p>
                                <button
                                  className="text-xs text-[#93C01F] hover:underline font-medium mt-1 cursor-pointer"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleViewInquiry(item.id, item.link);
                                  }}
                                >
                                  View Inquiry
                                </button>
                              </div>
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                              <Bell className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              No new notifications
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              You&apos;re all caught up! Check back later.
                            </p>
                          </div>
                        )}
                      </div>

                      <Separator className="bg-gray-100" />
                      <div className="bg-[#F8FAFC] text-center w-full py-2 rounded-b-lg">
                        <Button
                          variant="link"
                          className="text-gray-600 text-sm font-normal hover:no-underline h-auto p-0"
                          onClick={handleViewAll}
                        >
                          View all notifications
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 cursor-pointer">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.image} />
                        <AvatarFallback>
                          {user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="text-sm font-medium">{user.name}</p>
                        <span className="text-xs px-2 py-0.5 bg-[#FF8D2826] text-[#FF8D28] rounded-full">
                          {user.role}
                        </span>
                      </div>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    className="rounded-lg mt-2 w-60 space-y-4"
                    align="end"
                  >
                    <div className=" rounded-lg">
                      <DropdownMenuItem asChild>
                        <div className="flex items-center gap-3 cursor-pointer">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.image} />
                            <AvatarFallback>
                              {user.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex flex-col items-start">
                            <span className="text-sm font-semibold text-gray-900">
                              {user.name}
                            </span>
                            <Badge className="text-[10px] bg-[#FF8D2826] text-[#FF8D28] px-2 py-0 mt-1">
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                      </DropdownMenuItem>
                      <Separator className="my-2" />
                      <DropdownMenuItem asChild>
                        <Link
                          href={getDashboardUrl()}
                          className="flex items-center gap-2"
                        >
                          <Image
                            src="/images/icons/profile.svg"
                            alt=""
                            width={16}
                            height={16}
                          />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/billing"
                          className="flex items-center gap-2"
                        >
                          <Image
                            src="/images/icons/billing.svg"
                            alt="Billing"
                            width={16}
                            height={16}
                          />
                          Billing & Subscriptions
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link
                          href="/billing"
                          className="flex items-center gap-2"
                        >
                          <Image
                            src="/images/icons/help.svg"
                            alt="Help"
                            width={16}
                            height={16}
                          />
                          Help/Support
                        </Link>
                      </DropdownMenuItem>
                      <Separator className="my-2" />
                      <DropdownMenuItem asChild>
                        <Button
                          variant="link"
                          onClick={logout}
                          className="flex items-center gap-2 text-red-500 hover:bg-transparent hover:no-underline hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Image
                            src="/images/icons/logout.svg"
                            alt="Logout"
                            width={16}
                            height={16}
                          />
                          Logout
                        </Button>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              // LOGGED OUT STATE
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-base font-normal text-white hover:text-white/80 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-base font-normal text-gray-900 bg-white hover:bg-white/20 hover:text-gray-100 rounded-xl transition-colors"
                >
                  Sign Up
                </Link>
                <Link
                  href="/become-vendor"
                  className="px-4 py-2 text-base font-normal text-white bg-(--accent-primary) hover:bg-[#98BC3B] rounded-xl transition-colors"
                >
                  Become a vendor
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-white"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed left-0 right-0 z-50 bg-(--background-secondary) text-white animate-fadeIn">
          <div className="py-5 flex flex-col space-y-3">
            {user ? (
              <div className="space-y-4 px-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.image} />
                    <AvatarFallback>
                      {user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {user.role}
                    </span>
                  </div>
                </div>
                <Link
                  href={getDashboardUrl()}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-red-500 block py-2"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-row items-center justify-center space-x-12 bg-[#14202b] py-5">
                <Link
                  href="/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
            <div className="flex flex-col space-y-5 px-6">
              <Link href="/discover" onClick={() => setIsMobileMenuOpen(false)}>
                Discover
              </Link>
              <Link
                href="/businesses"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Businesses
              </Link>
              <Link href="/events" onClick={() => setIsMobileMenuOpen(false)}>
                Events
              </Link>
              <Link
                href="/communities"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Communities
              </Link>
              <Link href="/about" onClick={() => setIsMobileMenuOpen(false)}>
                About Us
              </Link>
              <Link
                href="/become-vendor"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-3 text-base font-normal text-white bg-(--accent-primary) hover:bg-[#98BC3B] rounded-xl transition-colors mt-10"
              >
                Become a vendor
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
