"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Calendar, ChevronDown } from "lucide-react";
// import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import SearchDropdown from "@/components/search-dropdown";
import type { DateRange } from "react-day-picker";
import { CountryDropdown, Country } from "@/components/ui/country-dropdown";

type SearchContext = "discover" | "businesses" | "events" | "communities";

interface SearchHeaderProps {
  context?: SearchContext;
  detectedCountry?: string | null;
  onCountryChange?: (country: Country | null) => void;
}

const searchPlaceholders: Record<SearchContext, string> = {
  discover: "Search by listing name or keyword...",
  businesses: "Search by listing name or keyword...",
  events: "Search by listing name or keyword...",
  communities: "Search by listing name or keyword...",
};

// const priceRanges = [
//   { label: "Price", value: "all" },
//   { label: "Free", value: "free" },
//   { label: "$0 - $50", value: "0-50" },
//   { label: "$50 - $100", value: "50-100" },
//   { label: "$100 - $200", value: "100-200" },
//   { label: "$200 - $500", value: "200-500" },
//   { label: "$500+", value: "500+" },
// ];

const categories = [
  { label: "All categories", value: "all" },
  { label: "Cultural Services", value: "cultural-services" },
  { label: "Education & Learning", value: "education-learning" },
  { label: "Food & Hospitality", value: "food-hospitality" },
  { label: "Health & Wellness", value: "health-wellness" },
  { label: "Events", value: "events" },
  { label: "Financial Services", value: "financial-services" },
  { label: "Shipping & Logistics", value: "shipping-logistics" },
  { label: "Property Relocation", value: "property-relocation" },
];

export default function SearchHeader({
  context = "discover",
  detectedCountry,
  onCountryChange,
}: SearchHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const updateSearchParamsBatch = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    updateSearchParams("q", value);
  };

  const handleCountrySelect = (country: Country | null) => {
    onCountryChange?.(country);
    updateSearchParams("country", country?.alpha3 || "");
  };

  const handleCategoryChange = (value: string) => {
    updateSearchParams("category", value === "all" ? "" : value);
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    const start = range?.from ? format(range.from, "yyyy-MM-dd") : "";
    const end = range?.to ? format(range.to, "yyyy-MM-dd") : "";
    updateSearchParamsBatch({
      startDate: start,
      endDate: end,
    });
  };

  // const handlePriceChange = (value: string) => {
  //   updateSearchParams("price", value === "all" ? "" : value);
  // };

  const showCountry = true;
  const showCategories = true;
  const showDate = context === "discover" || context === "events";
  // const showPrice = context === "discover" || context === "businesses";

  const currentStart = searchParams.get("startDate");
  const currentEnd = searchParams.get("endDate");
  const currentRange: DateRange | undefined =
    currentStart || currentEnd
      ? {
          from: currentStart ? new Date(currentStart) : undefined,
          to: currentEnd ? new Date(currentEnd) : undefined,
        }
      : undefined;
  // const currentPrice = searchParams.get("price") || "all";
  // Determine current category from URL param
  const currentCategory = searchParams.get("category") || "all";

  return (
    <div className="w-full bg-transparent">
      <div className="mx-auto px-6 lg:px-16 py-6">
        <div className="flex flex-row flex-wrap lg:flex-nowrap gap-3 items-center md:items-center">
          {/* Search Input with Dropdown */}
          <div className="w-full md:w-auto md:min-w-[300px]">
            <SearchDropdown
              onSearch={handleSearchChange}
              placeholder={searchPlaceholders[context]}
              context={context}
            />
          </div>

          {/* Country Select */}
          {showCountry && (
            <div className="md:w-auto min-w-[180px]">
              <CountryDropdown
                defaultValue={detectedCountry || undefined}
                onChange={handleCountrySelect}
                placeholder="Select country"
                slim={false}
              />
            </div>
          )}

          {/* Date Range Picker */}
          {showDate && (
            <div className="md:w-auto min-w-[140px]">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 w-full rounded-full border-[#E2E8F0] px-4 justify-start text-gray-600 font-normal hover:bg-gray-50"
                  >
                    <Calendar className="h-5 w-5 mr-2 text-gray-600" />
                    {currentRange?.from
                      ? currentRange.to
                        ? `${format(
                            currentRange.from,
                            "MMM dd, yyyy"
                          )} - ${format(currentRange.to, "MMM dd, yyyy")}`
                        : `${format(
                            currentRange.from,
                            "MMM dd, yyyy"
                          )} - End date`
                      : "Dates"}
                    <ChevronDown className="h-4 w-4 text-gray-600 ml-auto" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="range"
                    numberOfMonths={2}
                    selected={currentRange}
                    onSelect={handleDateRangeSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Price Select */}
          {/* {showPrice && (
            <div className="md:w-auto min-w-[140px]">
              <Select value={currentPrice} onValueChange={handlePriceChange}>
                <SelectTrigger className="h-10 rounded-full border-[#E2E8F0] px-4">
                  <div className="flex items-center gap-2">
                    <Image
                      src="/images/icons/price.svg"
                      alt="Price"
                      width={20}
                      height={20}
                      className="text-gray-600"
                    />
                    <span className="text-gray-600">
                      {priceRanges.find((p) => p.value === currentPrice)
                        ?.label || "Price"}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {priceRanges.map((price) => (
                    <SelectItem key={price.value} value={price.value}>
                      {price.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )} */}

          {/* Category Select */}
          {showCategories && (
            <div className="md:w-auto min-w-[140px]">
              <Select
                value={currentCategory}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="h-10 rounded-full border-[#E2E8F0] px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">
                      {categories.find((c) => c.value === currentCategory)
                        ?.label || "All categories"}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}