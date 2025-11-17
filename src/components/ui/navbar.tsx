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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type User = {
  name: string;
  role: string;
  image?: string;
};

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const API_URL = process.env.API_URL || "https://me-fie.co.uk";
        const res = await fetch(`${API_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const raw = data?.user ?? data?.data ?? data;
          const mappedUser: User = {
            name:
              raw?.name ||
              `${raw?.first_name ?? ""} ${raw?.last_name ?? ""}`.trim() ||
              "User",
             role: raw?.role || "User",
 image: raw?.image || raw?.avatar || undefined,
          };
          setUser(mappedUser);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

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
            {loading ? null : (
              <>
                {!user ? (
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
                ) : (
                  <div className="flex items-center gap-6">
                    <button className="relative p-3 rounded-full bg-white/10 hover:bg-white/20 transition">
                      <Bell className="w-5 h-5 text-white" />
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.image} />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <p className="text-sm font-medium">{user.name}</p>
                            <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full">
                              {user.role}
                            </span>
                          </div>
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align="end"
                        className="w-60 bg-white text-gray-800 p-4 rounded-xl shadow-xl"
                      >
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard" className="flex gap-2 py-2">
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/bookmarks" className="flex gap-2 py-2">
                            Bookmarks
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/help" className="flex gap-2 py-2">
                            Help / Support
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            localStorage.removeItem("authToken");
                            setUser(null);
                          }}
                          className="text-red-600 py-2"
                        >
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
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
            {!user ? (
              <div className="flex flex-row items-center justify-center space-x-12 bg-[#14202b] py-5">
                <Link href="/auth/login">Login</Link>
                <Link href="/auth/signup">Sign Up</Link>
              </div>
            ) : (
              <div className="space-y-4 px-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.image} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {user.role}
                    </span>
                  </div>
                </div>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/bookmarks">Bookmarks</Link>
                <Link href="/help">Help/Support</Link>
                <button
                  onClick={() => {
                    localStorage.removeItem("authToken");
                    setUser(null);
                  }}
                  className="text-red-500"
                >
                  Logout
                </button>
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
