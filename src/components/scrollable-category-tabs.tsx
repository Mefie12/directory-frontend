/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useCallback, useRef, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton"; // Import Shadcn Skeleton

// --- Types ---
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
}

export interface ScrollableCategoryTabsProps {
  categories?: CategoryTabItem[];
  mainCategorySlug?: string;
  defaultValue?: string;
  className?: string;
  containerClassName?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  inactiveTabClassName?: string;
  onChange?: (value: string) => void;
}

export default function ScrollableCategoryTabs({
  categories = [],
  mainCategorySlug,
  defaultValue,
  className,
  containerClassName,
  tabClassName,
  activeTabClassName,
  inactiveTabClassName,
  onChange,
}: ScrollableCategoryTabsProps) {
  // --- State ---
  // If API mode, start empty. If static mode, use props.
  const [displayCategories, setDisplayCategories] = useState<CategoryTabItem[]>(
    mainCategorySlug ? [] : categories
  );

  const initial = defaultValue ?? "all";
  const [value, setValue] = useState<string>(initial);
  const [isLoading, setIsLoading] = useState(false);
  // Track if we have attempted a fetch to avoid hiding content prematurely
  const [hasFetched, setHasFetched] = useState(false);

  // --- Refs ---
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonsRef = useRef<Record<string, HTMLButtonElement | null>>({});

  // Stable ref for onChange to prevent loops
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const setButtonRef = useCallback(
    (key: string, el: HTMLButtonElement | null) => {
      buttonsRef.current[key] = el;
    },
    []
  );

  // --- API Integration ---
  useEffect(() => {
    // If NOT in API mode, just use static props and exit
    if (!mainCategorySlug) {
      if (categories.length > 0) setDisplayCategories(categories);
      return;
    }

    const fetchSubCategories = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/api/categories`, {
          headers,
        });

        if (!response.ok) throw new Error("Failed to fetch categories");

        const data: ApiCategory[] = await response.json();

        // Find the parent category by slug
        const parentCategory = data.find(
          (cat) => cat.slug === mainCategorySlug
        );

        // Check if there are valid children
        if (
          parentCategory &&
          parentCategory.children &&
          parentCategory.children.length > 0
        ) {
          const tabs: CategoryTabItem[] = [{ label: "All", value: "all" }];

          const childTabs = parentCategory.children.map((child) => ({
            label: child.name,
            value: child.slug,
          }));

          tabs.push(...childTabs);
          setDisplayCategories(tabs);

          // Only reset to 'all' if we actually found categories
          setValue("all");
          if (onChangeRef.current) onChangeRef.current("all");
        } else {
          // No children found - Set empty to trigger hide
          setDisplayCategories([]);
        }
      } catch (error) {
        console.error("Error loading subcategories:", error);
        setDisplayCategories([]);
      } finally {
        setIsLoading(false);
        setHasFetched(true);
      }
    };

    fetchSubCategories();
    // Dependency array MUST NOT include 'categories' or 'onChange' to prevent loops
  }, [mainCategorySlug]);

  // --- Selection Logic ---
  const select = useCallback(
    (next: string) => {
      setValue(next);
      onChange?.(next);
    },
    [onChange]
  );

  // Auto-scroll to selected
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = buttonsRef.current[value];
      if (el && containerRef.current) {
        el.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [value, displayCategories]);

  // --- Render Logic ---

  // 1. Loading State (Shadcn Skeletons)
  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        <div
          className={cn(
            "relative mt-1 rounded-full pt-6 mx-auto px-6 lg:px-16",
            containerClassName
          )}
        >
          <div className="flex w-full gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide items-center h-12">
            {/* Render a row of pill-shaped skeletons */}
            {[...Array(6)].map((_, i) => (
              <Skeleton
                key={i}
                className={cn(
                  "h-9 rounded-full shrink-0",
                  // Vary widths slightly for a natural look
                  i % 2 === 0 ? "w-24" : "w-32"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. Hide if API fetch finished but no categories found (or only 'All' which implies no subcategories)
  if (mainCategorySlug && hasFetched && displayCategories.length <= 1) {
    return null;
  }

  // 3. Hide if Static mode but empty
  if (!mainCategorySlug && displayCategories.length === 0) {
    return null;
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative mt-1 rounded-full pt-6 mx-auto px-6 lg:px-16",
          containerClassName
        )}
      >
        <div
          ref={containerRef}
          role="listbox"
          aria-label="Categories"
          tabIndex={0}
          className="flex w-full gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide items-center h-12"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {displayCategories.map((cat) => {
            const selected = value === cat.value;
            return (
              <button
                key={cat.value}
                ref={(el) => setButtonRef(cat.value, el)}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => select(cat.value)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium border transition-colors shrink-0",
                  tabClassName,
                  selected
                    ? cn(
                        "bg-[#9ACC23] text-white border-[#9ACC23]",
                        activeTabClassName
                      )
                    : cn(
                        "bg-white text-[#0F172A] hover:bg-[#F1F5F9]",
                        inactiveTabClassName
                      )
                )}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
