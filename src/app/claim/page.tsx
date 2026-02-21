/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  ArrowLeft,
  Store,
  MapPin,
  Coffee,
  Search,
  Lock,
  Plus,
  ChefHat,
  BadgeCheck,
  Croissant,
  Building2,
  CalendarDays,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { toast } from "sonner";

// --- Types ---
interface ApiImage {
  id?: number;
  media: string;
  media_type?: string;
}

interface Business {
  id: string;
  name: string;
  address: string;
  distance?: string;
  type: string;
  status: "claimable" | "claimed" | "pending";
  images?: (ApiImage | string)[];
  slug?: string;
}

export default function ClaimPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Search State
  const [nameQuery, setNameQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [results, setResults] = useState<Business[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // --- Helper: Get Full Image URL ---
  const getImageUrl = (
    imageEntry: ApiImage | string | undefined | null,
  ): string => {
    if (!imageEntry) return "/images/placeholders/generic.jpg";
    let url = "";
    if (
      typeof imageEntry === "object" &&
      imageEntry !== null &&
      "media" in imageEntry
    ) {
      url = imageEntry.media;
    } else if (typeof imageEntry === "string") {
      url = imageEntry;
    }
    if (!url) return "/images/placeholders/generic.jpg";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
    return `${API_URL}/${url.replace(/^\//, "")}`;
  };

  // --- Auth Protection ---
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  // --- API search logic ---
  const searchBusinesses = useCallback(async () => {
    const nameTrimmed = nameQuery.trim();
    const locationTrimmed = locationQuery.trim();

    if (nameTrimmed.length < 4) {
      if (hasSearched) {
        setResults([]);
        setHasSearched(false);
      }
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
      const token = localStorage.getItem("authToken");
      const url = new URL(`${API_URL}/api/search`);
      url.searchParams.append("q", nameTrimmed);
      if (locationTrimmed) url.searchParams.append("location", locationTrimmed);

      const headers: HeadersInit = {
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(url.toString(), { method: "GET", headers });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to fetch");
      const businesses = Array.isArray(data) ? data : data.data || [];
      setResults(businesses);
    } catch (error: any) {
      console.error("Search error:", error);
      if (error.name !== "AbortError")
        toast.error("Failed to search businesses.");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [nameQuery, locationQuery, hasSearched]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchBusinesses();
    }, 500);
    return () => clearTimeout(timer);
  }, [nameQuery, locationQuery, searchBusinesses]);

  const getBusinessIcon = (type: string) => {
    switch (type) {
      case "coffee":
        return <Coffee className="w-6 h-6 text-slate-700" />;
      case "roastery":
        return <ChefHat className="w-6 h-6 text-slate-700" />;
      case "express":
        return <BadgeCheck className="w-6 h-6 text-gray-400" />;
      case "bakery":
        return <Croissant className="w-6 h-6 text-slate-700" />;
      default:
        return <Store className="w-6 h-6 text-slate-700" />;
    }
  };

  // --- Claim Logic (Modified: Routing only) ---
  const handleClaim = (business: Business) => {
    const identifier = business.slug || business.id;
    // Navigate directly to the verify page
    router.push(`/claim/${identifier}/verify`);
  };

  const handleManualAdd = (type: string) => {
    router.push(`/claim/manual?type=${type}`);
  };

  if (authLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 animate-pulse">
          Checking access permissions...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-6 bg-white">
        <div className="flex items-center gap-4 mb-8 mt-20">
          <button
            onClick={() => router.back()}
            className="p-1 bg-gray-100 hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[#93C01F]" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Find Your Business/ Events/ Communities Listing
          </h1>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Store className="w-5 h-5 text-gray-400" />
            </div>
            <Input
              placeholder="Business Name (e.g. The Coffee House)"
              className="pl-12 py-6 bg-gray-50 border-gray-300 rounded-xl text-base shadow-none focus-visible:ring-[#93C01F]"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
            />
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
            <Input
              placeholder="Location (e.g. Seattle, WA)"
              className="pl-12 py-6 bg-gray-50 border-gray-300 rounded-xl text-base shadow-none focus-visible:ring-[#93C01F]"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-100 min-h-screen border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="mt-1 mb-4 flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">
              Search Results
            </span>
            <Badge
              variant="secondary"
              className="bg-slate-200 text-slate-600 px-2.5 rounded-full text-xs font-semibold"
            >
              {results.length} found
            </Badge>
            <div className="h-px bg-gray-100 flex-1 ml-2"></div>
          </div>

          <div className="space-y-4">
            {isSearching ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 bg-white rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : results.length > 0 ? (
              results.map((business) => {
                const isClaimed = business.status === "claimed";
                const displayImage =
                  business.images && business.images.length > 0
                    ? getImageUrl(business.images[0])
                    : null;

                return (
                  <div
                    key={business.id}
                    className={`flex items-center justify-between px-4 py-4 rounded-2xl border transition-all ${
                      isClaimed
                        ? "bg-gray-50 border-gray-200 border-dashed opacity-75"
                        : "bg-white border-gray-200 shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border">
                        {displayImage ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={displayImage}
                              alt={business.name}
                              fill
                              className={`object-cover ${isClaimed ? "grayscale opacity-50" : ""}`}
                            />
                          </div>
                        ) : (
                          getBusinessIcon(business.type)
                        )}
                      </div>
                      <div>
                        <h3
                          className={`font-bold text-lg ${isClaimed ? "text-gray-500" : "text-slate-900"}`}
                        >
                          {business.name}
                        </h3>
                        <p className="text-gray-500 text-sm mt-0.5">
                          {business.address}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant="outline"
                            className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border-slate-200 text-slate-500 bg-slate-50"
                          >
                            {business.type}
                          </Badge>
                          {business.distance && (
                            <Badge
                              variant="secondary"
                              className="rounded-md font-semibold text-[10px] px-2 py-0.5"
                            >
                              {business.distance}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isClaimed ? (
                        <div className="px-4 py-2">
                          <Lock className="w-5 h-5 text-gray-300" />
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleClaim(business)}
                          className="bg-[#93C01F] hover:bg-[#7ea919] text-white px-6 py-2 h-auto rounded-lg font-medium min-w-[100px]"
                        >
                          Claim
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-none">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-semibold text-lg">
                  {hasSearched ? "No businesses found" : "Start your search"}
                </h3>
                <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
                  {hasSearched
                    ? "We couldn't find a match. Try adjusting your search terms or location."
                    : "Enter your business name or location above to find and claim your listing."}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 mb-10 text-center">
            <p className="text-gray-500 mb-4 text-sm">
              Don&apos;t see your listing in our directory?
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full max-w-sm h-12 rounded-lg border-2 border-[#93C01F] text-[#93C01F] font-medium gap-2 hover:bg-[#93C01F] hover:text-white transition-all"
                >
                  <Plus className="w-5 h-5" /> Add it manually
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white border-0 rounded-2xl shadow-xl">
                <DialogHeader>
                  <DialogTitle className="text-center text-xl font-bold text-[#1F3A4C]">
                    Select Listing Type
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-6 px-2">
                  {[
                    {
                      id: "business",
                      label: "Business Listing",
                      icon: Building2,
                      desc: "For companies, shops, and services.",
                    },
                    {
                      id: "event",
                      label: "Event Listing",
                      icon: CalendarDays,
                      desc: "For concerts, workshops, and gatherings.",
                    },
                    {
                      id: "community",
                      label: "Community Listing",
                      icon: Users,
                      desc: "For groups, clubs, and non-profits.",
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleManualAdd(item.id)}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-[#93C01F] hover:bg-[#93C01F]/5 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 group-hover:border-[#93C01F] transition-colors">
                        <item.icon className="w-5 h-5 text-gray-500 group-hover:text-[#93C01F]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-[#93C01F]">
                          {item.label}
                        </h4>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
