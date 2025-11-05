"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { MapPin, Calendar, ChevronDown } from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

type SearchContext = "discover" | "businesses" | "events" | "communities";

interface SearchHeaderProps {
  context?: SearchContext;
}

const searchPlaceholders: Record<SearchContext, string> = {
  discover: "Search by listing name or keyword...",
  businesses: "Search by listing name or keyword...",
  events: "Search by listing name or keyword...",
  communities: "Search by listing name or keyword...",
};

const countries = [
  "All countries",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Japan",
  "South Korea",
  "Singapore",
  "India",
  "Brazil",
  "Mexico",
  "Ghana",
];

const priceRanges = [
  { label: "Price", value: "all" },
  { label: "Free", value: "free" },
  { label: "$0 - $50", value: "0-50" },
  { label: "$50 - $100", value: "50-100" },
  { label: "$100 - $200", value: "100-200" },
  { label: "$200 - $500", value: "200-500" },
  { label: "$500+", value: "500+" },
];

export default function SearchHeader({
  context = "discover",
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

  const handleSearchChange = (value: string) => {
    updateSearchParams("q", value);
  };

  const handleCountryChange = (value: string) => {
    updateSearchParams("country", value === "All countries" ? "" : value);
  };

  const handleDateSelect = (date: Date | undefined) => {
    updateSearchParams("date", date ? format(date, "yyyy-MM-dd") : "");
  };

  const handlePriceChange = (value: string) => {
    updateSearchParams("price", value === "all" ? "" : value);
  };

  const showCountry = true;
  const showDate = context === "discover" || context === "events";
  const showPrice = context === "discover" || context === "businesses";

  const currentCountry = searchParams.get("country") || "All countries";
  const currentDate = searchParams.get("date");
  const currentPrice = searchParams.get("price") || "all";

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
            <div className="md:w-auto min-w-[140px]">
              <Select
                value={currentCountry}
                onValueChange={handleCountryChange}
              >
                <SelectTrigger className="h-10 rounded-full border-[#E2E8F0] px-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <SelectValue className="text-gray-600" />
                    {/* <ChevronDown className="h-4 w-4 text-gray-600 ml-auto" /> */}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Picker */}
          {showDate && (
            <div className="md:w-auto min-w-[140px]">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 w-full rounded-full border-[#E2E8F0] px-4 justify-start text-gray-600 font-normal hover:bg-gray-50"
                  >
                    <Calendar className="h-5 w-5 mr-2 text-gray-600" />
                    {currentDate
                      ? format(new Date(currentDate), "MMM dd, yyyy")
                      : "Date"}
                    <ChevronDown className="h-4 w-4 text-gray-600 ml-auto" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={currentDate ? new Date(currentDate) : undefined}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Price Select */}
          {showPrice && (
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
                    {/* <ChevronDown className="h-4 w-4 text-gray-600 ml-auto" /> */}
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
          )}
        </div>
      </div>
    </div>
  );
}
