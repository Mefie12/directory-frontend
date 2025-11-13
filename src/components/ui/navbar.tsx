"use client";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
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
            {/* Search Icon
            <button
              className="p-2 rounded-full bg-[#F8FAFC80] hover:bg-white/20 transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-white" />
            </button> */}

            {/* Auth Buttons */}
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
          <div className="w-full bg-[#14202b] py-4 flex justify-center">
            <div className="flex items-center space-x-12">
              <Link
                href="#"
                className="text-white hover:text-gray-300 transition-colors"
              >
                Login
              </Link>
              <Link
                href="#"
                className="text-white hover:text-gray-300 transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>

          <div className="px-6 space-y-5 py-6 flex flex-col items-start">
            <Link
              href="/discover"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-normal text-white hover:text-[#A9CD4C] transition-colors"
            >
              Discover
            </Link>
            <Link
              href="/businesses"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-normal text-white hover:text-[#A9CD4C] transition-colors"
            >
              Businesses
            </Link>
            <Link
              href="/events"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-normal text-white hover:text-[#A9CD4C] transition-colors"
            >
              Events
            </Link>
            <Link
              href="/communities"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-normal text-white hover:text-[#A9CD4C] transition-colors"
            >
              Communities
            </Link>
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-normal text-white hover:text-[#A9CD4C] transition-colors"
            >
              About Us
            </Link>

            {/* Contact button */}
            <Link
              href="/become-vendor"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-center px-4 py-3 text-base font-normal text-white bg-(--accent-primary) hover:bg-[#98BC3B] rounded-xl transition-colors mt-20"
            >
              Become a vendor
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
