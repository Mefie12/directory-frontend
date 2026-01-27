"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useCallback, useRef, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export type CategoryTabItem = {
  label: string;
  value: string;
  count?: number;
};

interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  children?: ApiCategory[];
  parent_id?: number | null;
}

export interface ScrollableCategoryTabsProps {
  categories?: CategoryTabItem[];
  mainCategorySlug?: string;
  defaultValue?: string;
  className?: string;
  containerClassName?: string;
  onChange?: (value: string) => void;
}

export default function ScrollableCategoryTabs({
  categories = [],
  mainCategorySlug,
  defaultValue = "all",
  className,
  containerClassName,
  onChange,
}: ScrollableCategoryTabsProps) {
  // Reset ALL state when props change
  const [displayCategories, setDisplayCategories] = useState<CategoryTabItem[]>(
    [],
  );
  const [value, setValue] = useState<string>(defaultValue);
  const [isLoading, setIsLoading] = useState(false);

  // Track props to detect changes
  const prevMainCategorySlug = useRef<string | undefined>(undefined);
  const prevCategories = useRef<CategoryTabItem[]>([]);

  // Reset value when defaultValue changes
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  // Main effect: handle categories display
  useEffect(() => {
    // If categories prop is provided, use it directly
    if (categories && categories.length > 0) {
      // Check if categories actually changed
      const categoriesChanged =
        JSON.stringify(categories) !== JSON.stringify(prevCategories.current);

      if (categoriesChanged) {
        setDisplayCategories(categories);
        prevCategories.current = categories;
        // Reset to default value when categories change
        setValue(defaultValue);
      }
      return;
    }

    // If mainCategorySlug is provided, fetch from API
    if (mainCategorySlug && mainCategorySlug !== prevMainCategorySlug.current) {
      const fetchSubCategories = async () => {
        setIsLoading(true);
        try {
          const API_URL =
            process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
          const response = await fetch(`${API_URL}/api/categories`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          });

          if (!response.ok)
            throw new Error(`Server returned ${response.status}`);

          const json = await response.json();
          const data: ApiCategory[] = Array.isArray(json)
            ? json
            : json.data || [];

          // Find the specific parent category
          const mainCat = data.find((cat) => cat.slug === mainCategorySlug);

          // Determine the "All" label based on context
          const contextLabel =
            mainCategorySlug.charAt(0).toUpperCase() +
            mainCategorySlug.slice(1);

          if (mainCat && mainCat.children && mainCat.children.length > 0) {
            const tabs: CategoryTabItem[] = [
              { label: `All ${contextLabel}`, value: "all" },
              ...mainCat.children.map((child) => ({
                label: child.name,
                value: child.slug,
              })),
            ];
            setDisplayCategories(tabs);
          } else {
            // Fallback: Show siblings or top-level if no children found
            const filtered = data
              .filter((cat) => !cat.parent_id)
              .map((cat) => ({
                label: cat.name,
                value: cat.slug,
              }));
            setDisplayCategories([
              { label: `All ${contextLabel}`, value: "all" },
              ...filtered,
            ]);
          }

          prevMainCategorySlug.current = mainCategorySlug;
        } catch (error) {
          console.error("Fetch Failure:", error);
          setDisplayCategories([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchSubCategories();
    }
  }, [mainCategorySlug, categories, defaultValue]);

  const select = useCallback(
    (next: string) => {
      setValue(next);
      if (onChange) onChange(next);
    },
    [onChange],
  );

  if (isLoading && displayCategories.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <div
          className={cn(
            "relative mt-1 pt-4 mx-auto px-6 lg:px-16",
            containerClassName,
          )}
        >
          <div className="flex w-full gap-2 overflow-x-auto h-12">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative mt-1 pt-4 mx-auto px-6 lg:px-16",
          containerClassName,
        )}
      >
        <div
          className="flex w-full gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide items-center h-12 no-scrollbar"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {displayCategories.map((cat) => {
            const isSelected = value === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => select(cat.value)}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-medium border transition-all shrink-0",
                  isSelected
                    ? "bg-[#9ACC23] text-white border-[#9ACC23] shadow-sm"
                    : "bg-white text-gray-700 border-gray-100 hover:bg-gray-50",
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
