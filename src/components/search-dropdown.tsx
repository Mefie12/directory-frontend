/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "./ui/input";

// Define the shape of the search result
interface SearchResult {
  id: string;
  name: string;
  category: string;
  image: string;
  location: string;
  price?: string;
  slug: string;
}

interface SearchDropdownProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  context?: "discover" | "businesses" | "events" | "communities";
}

// --- Helper: Robust Image URL Generator ---
const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/placeholders/generic.jpg";
  if (url.startsWith("http")) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
  return `${API_URL}/${url.replace(/^\//, "")}`;
};

export default function SearchDropdown({
  onSearch,
  placeholder = "Search by listing name or keyword...",
  context = "discover",
}: SearchDropdownProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 0) {
        setIsLoading(true);
        setShowDropdown(true);

        try {
          const API_URL = process.env.API_URL || "https://me-fie.co.uk";

          // 1. Using the provided Search Endpoint
          const response = await fetch(
            `${API_URL}/api/search?q=${encodeURIComponent(query)}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            }
          );

          if (response.ok) {
            const json = await response.json();
            // Handle different response structures (data wrapper or direct array)
            const rawData = Array.isArray(json)
              ? json
              : json.data || json.results || [];

            // 2. Robust Data Mapping
            const mappedResults: SearchResult[] = rawData.map((item: any) => {
              // Image Logic
              const rawImages = Array.isArray(item.images) ? item.images : [];
              const validImages = rawImages
                .filter((img: any) => {
                  if (typeof img === "string") return true;
                  if (img && typeof img === "object" && img.media) {
                    return !["processing", "failed"].includes(img.media);
                  }
                  return false;
                })
                .map((img: any) => {
                  const mediaPath = typeof img === "string" ? img : img.media;
                  return getImageUrl(mediaPath);
                });

              let finalImage = "/images/placeholders/generic.jpg";
              if (validImages.length > 0) finalImage = validImages[0];
              else if (item.image) finalImage = getImageUrl(item.image);
              else if (item.cover_image)
                finalImage = getImageUrl(item.cover_image);

              // Category Logic
              let categoryName = "General";
              if (
                Array.isArray(item.categories) &&
                item.categories.length > 0
              ) {
                categoryName = item.categories[0].name;
              } else if (
                item.category &&
                typeof item.category === "object" &&
                item.category.name
              ) {
                categoryName = item.category.name;
              } else if (typeof item.category === "string") {
                categoryName = item.category;
              }

              return {
                id: item.id.toString(),
                name: item.name || item.title || "Untitled",
                slug: item.slug || item.id.toString(),
                category: categoryName,
                image: finalImage,
                location: item.location || "Online",
                price: item.price ? item.price : undefined, // Optional
              };
            });

            setResults(mappedResults);
          } else {
            setResults([]);
          }
        } catch (error) {
          console.error("Search error:", error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleResultClick = () => {
    setShowDropdown(false);
    setQuery("");
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => query.length > 0 && setShowDropdown(true)}
          className="w-full h-10 pl-12 pr-4 rounded-full border border-[#E2E8F0] text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9ACC23] focus:border-transparent"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[400px] overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <Link
                  key={result.id}
                  // Dynamic routing based on the item type if available, otherwise context
                  href={`/${context}/${result.slug}`}
                  onClick={handleResultClick}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                    <Image
                      src={result.image}
                      alt={result.name}
                      fill
                      className="object-cover"
                      unoptimized={true}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900 truncate">
                      {result.name}
                    </h4>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                      <span>{result.category}</span>
                      {result.location && (
                        <>
                          <span>•</span>
                          <span>{result.location}</span>
                        </>
                      )}
                    </p>
                  </div>
                  {result.price && (
                    <span className="text-sm font-semibold text-[#9ACC23]">
                      {result.price}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : query.length > 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">
                No results found
              </h3>
              <p className="text-sm text-gray-500">
                We couldn&apos;t find anything matching &quot;{query}&quot;
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
