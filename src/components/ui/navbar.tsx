"use client";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, X, Bell } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  // DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { Separator } from "./separator";
import { Badge } from "./badge";
import { Button } from "./button";

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  // Debug: Check auth state
  // useEffect(() => {
  //   // console.log("Navbar Auth State:", { user, loading });
  // }, [user, loading]);

  // Get dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!user) return "/auth/login";
    
    switch (user.role?.toLowerCase()) {
      case "vendor":
        return "/dashboard/vendor";
      case "admin":
        return "/dashboard/admin";
      case "user":
        return "/dashboard/user";
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

          {/* Desktop Right Section - FIXED CONDITIONAL RENDERING */}
          <div className="hidden lg:flex lg:items-center lg:space-x-3">
            {user ? (
              // LOGGED IN STATE - Show user profile and bell icon
              <div className="flex items-center gap-4">
                <button className="relative p-3 rounded-full bg-white transition">
                  <Bell className="w-5 h-5 text-black" />
                </button>

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
              // LOGGED OUT STATE - Show login/signup buttons
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
              // MOBILE LOGGED IN STATE
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
                <Link
                  href="/bookmarks"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2"
                >
                  Bookmarks
                </Link>
                <Link
                  href="/help"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2"
                >
                  Help/Support
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
              // MOBILE LOGGED OUT STATE
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
