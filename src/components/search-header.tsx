"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Calendar, ChevronDown } from "lucide-react";
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
import { countries as allCountries } from "country-data-list";

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

interface ApiCategory {
  slug: string;
  name: string;
  type?: string;
}

export default function SearchHeader({
  context = "discover",
  detectedCountry,
  onCountryChange,
}: SearchHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [countryOptions, setCountryOptions] = useState<Country[] | undefined>(
    undefined,
  );

  useEffect(() => {
    fetch("/api/categories_with_listings")
      .then((r) => r.json())
      .then((json) => {
        setCategories(json.data as ApiCategory[] || []);
      })
      .catch(() => {});
  }, []);

  // Fetch countries that have listings from backend
  useEffect(() => {
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

    fetch(`${API_URL}/api/countries_dropdown`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then((r) => r.json())
      .then((json) => {
        const list: unknown[] = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [];

        // Normalize backend entries (could be strings or objects) and
        // map each to the Country shape using country-data-list so flags work.
        const mapped: Country[] = list
          .map((entry): Country | null => {
            let name: string | undefined;
            let alpha2: string | undefined;
            let alpha3: string | undefined;

            if (typeof entry === "string") {
              name = entry;
            } else if (entry && typeof entry === "object") {
              const e = entry as Record<string, unknown>;
              name =
                (e.name as string) ||
                (e.country as string) ||
                (e.label as string);
              alpha2 =
                (e.alpha2 as string) ||
                (e.code as string) ||
                (e.iso2 as string) ||
                (e.country_code as string);
              alpha3 = (e.alpha3 as string) || (e.iso3 as string);
            }

            const match = (allCountries.all as Country[]).find(
              (c) =>
                (alpha2 && c.alpha2?.toLowerCase() === alpha2.toLowerCase()) ||
                (alpha3 && c.alpha3?.toLowerCase() === alpha3.toLowerCase()) ||
                (name && c.name?.toLowerCase() === name.toLowerCase()),
            );

            if (match) return match;
            if (name && alpha2) {
              return {
                alpha2,
                alpha3: alpha3 || "",
                countryCallingCodes: [],
                currencies: [],
                ioc: "",
                languages: [],
                name,
                status: "assigned",
              };
            }
            return null;
          })
          .filter((c): c is Country => c !== null);

        if (mapped.length > 0) setCountryOptions(mapped);
      })
      .catch(() => {
        // Fallback: leave options undefined so CountryDropdown uses its default full list
      });
  }, []);

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

  // Debounce URL update so typing doesn't cause a navigation on every keystroke
  const handleSearchChange = (value: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      updateSearchParams("q", value);
    }, 500);
  };

  const handleCountrySelect = (country: Country | null) => {
    onCountryChange?.(country);
    updateSearchParams("country", country?.name || "");
  };

  const handleCategoryChange = (value: string) => {
    updateSearchParams("category_id", value === "all" ? "" : value);
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    const start = range?.from ? format(range.from, "yyyy-MM-dd") : "";
    const end = range?.to ? format(range.to, "yyyy-MM-dd") : "";
    updateSearchParamsBatch({
      event_start_date: start,
      event_end_date: end,
    });
  };

  const showCountry = true;
  const showCategories = true;
  const showDate = context === "discover" || context === "events";

  const currentStart = searchParams.get("event_start_date");
  const currentEnd = searchParams.get("event_end_date");
  const currentRange: DateRange | undefined =
    currentStart || currentEnd
      ? {
          from: currentStart ? new Date(currentStart) : undefined,
          to: currentEnd ? new Date(currentEnd) : undefined,
        }
      : undefined;

  const currentCategory = searchParams.get("category_id") || "all";

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
                options={countryOptions}
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
                        ? `${format(currentRange.from, "MMM dd, yyyy")} - ${format(currentRange.to, "MMM dd, yyyy")}`
                        : `${format(currentRange.from, "MMM dd, yyyy")} - End date`
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
                      {categories.find((c) => c.slug === currentCategory)
                        ?.name || "All categories"}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.slug} value={category.slug}>
                      {category.name}
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
