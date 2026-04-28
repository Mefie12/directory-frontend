"use client";

import { ReactNode, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ScrollableCategoryTabs from "@/components/scrollable-category-tabs";
import SearchHeader from "@/components/search-header";
import { Country } from "@/components/ui/country-dropdown";
import { ApiListing } from "@/lib/directory/types";

export interface DirectoryPageShellProps<T> {
  /** Slug passed to `<ScrollableCategoryTabs mainCategorySlug=...>`. */
  mainCategorySlug: string;
  /** Context passed to `<SearchHeader>` and `<ScrollableCategoryTabs>`. */
  context: "businesses" | "events" | "communities";
  /** Mapped items produced by `useDirectoryListings`. */
  items: T[];
  isLoading: boolean;
  detectedCountry: string | null;
  /**
   * Map a raw API listing to the page item type.
   * Required for category-pill fetches from the geolocation endpoints.
   */
  mapItem?: (item: ApiListing) => T | null;

  /** Returns the group-by key for an item (category / tag name). */
  groupBy: (item: T) => string;
  /** Returns true if an item belongs to the selected category slug. */
  matchesCategory: (item: T, slug: string) => boolean;

  /** How many items to pass to the hero carousel. */
  heroSize: number;
  /** How many groups to render (all visible, no toggle). */
  visibleGroups: number;
  /** Message shown when `items` is empty. */
  emptyMessage: string;

  /** Initial number of cards to show in the paginated grid. */
  initialGridCount?: number;
  /** How many extra cards to reveal per "Show more" click. */
  gridLoadMoreStep?: number;
  /** Title displayed above the paginated grid. */
  gridTitle?: string;

  /** Render the hero carousel at the top of the "all" tab. */
  renderHero: (items: T[]) => ReactNode;
  /** Render a single category group section. */
  renderGroup: (title: string, items: T[]) => ReactNode;
  /** Render the single-category view (when a tab other than "all" is active). */
  renderFiltered: (items: T[]) => ReactNode;
  /** Render a single card in the paginated grid. Required for the grid. */
  renderCard?: (item: T) => ReactNode;
  /** Optional banner rendered between the grid and the footer. */
  renderMidBanner?: () => ReactNode;
  /** Optional footer CTA (e.g. "Ready to grow your business?"). */
  renderFooterCta?: () => ReactNode;
}

export function DirectoryPageShell<T>({
  mainCategorySlug,
  context,
  items,
  isLoading,
  detectedCountry,
  mapItem,
  groupBy,
  matchesCategory,
  heroSize,
  visibleGroups,
  emptyMessage,
  initialGridCount = 12,
  gridLoadMoreStep = 8,
  gridTitle = "All listings",
  renderHero,
  renderGroup,
  renderFiltered,
  renderCard,
  renderMidBanner,
  renderFooterCta,
}: DirectoryPageShellProps<T>) {
  const searchParams = useSearchParams();
  const filterCountry = searchParams.get("country");
  // Store both id and slug in the URL so the backend can use whichever it supports.
  const categoryIdParam = searchParams.get("category_id");
  const categorySlugParam = searchParams.get("category_slug");
  // Prefer slug for tab-pill active-state matching; fall back to id string.
  const selectedCategory = categorySlugParam || categoryIdParam || "all";
  const isCategorySelected = selectedCategory !== "all";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>(
    () => filterCountry?.toLowerCase() || "",
  );

  // Sync selectedCountry state with URL when it changes (e.g., browser back/forward)
  useEffect(() => {
    setSelectedCountry(filterCountry?.toLowerCase() || "");
  }, [filterCountry]);

  // Items fetched when a category pill (non-"all") is selected
  const [topCategoryItems, setTopCategoryItems] = useState<T[]>([]);
  const [allCategoryItems, setAllCategoryItems] = useState<T[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);

  useEffect(() => {
    if (!isCategorySelected || !mapItem) {
      setTopCategoryItems([]);
      setAllCategoryItems([]);
      return;
    }

    let cancelled = false;
    setIsCategoryLoading(true);

    // Send both params — backend uses whichever it supports.
    const params = new URLSearchParams();
    if (categoryIdParam) params.set("category_id", categoryIdParam);
    if (categorySlugParam) params.set("category_slug", categorySlugParam);
    const hasCountry = !!selectedCountry;
    if (hasCountry) params.set("country", selectedCountry);

    Promise.all([
      fetch(
        hasCountry
          ? `/api/top_listings_by_country_and_category?${params}`
          : `/api/top_listings_by_category_and_geolocation?${params}`,
        {
        headers: { Accept: "application/json" },
      },
      ).then((r) => {
        if (!r.ok) throw new Error(`Top request failed (${r.status})`);
        return r.json();
      }),
      fetch(
        hasCountry
          ? `/api/all_listings_by_country_and_category?${params}`
          : `/api/all_listings_by_category_and_geolocation?${params}`,
        {
        headers: { Accept: "application/json" },
      },
      ).then((r) => {
        if (!r.ok) throw new Error(`All request failed (${r.status})`);
        return r.json();
      }),
    ])
      .then(([topJson, allJson]) => {
        if (cancelled) return;
        const mapper = mapItem;
        const topRaw: ApiListing[] = Array.isArray(topJson.data)
          ? topJson.data
          : Array.isArray(topJson.listings)
            ? topJson.listings
            : [];
        const allRaw: ApiListing[] = Array.isArray(allJson.data)
          ? allJson.data
          : Array.isArray(allJson.listings)
            ? allJson.listings
            : [];
        setTopCategoryItems(
          topRaw.flatMap((item) => { const r = mapper(item); return r !== null ? [r] : []; }),
        );
        setAllCategoryItems(
          allRaw.flatMap((item) => { const r = mapper(item); return r !== null ? [r] : []; }),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setTopCategoryItems([]);
          setAllCategoryItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsCategoryLoading(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCategorySelected, categoryIdParam, categorySlugParam, selectedCountry, mapItem]);

  const handleCategoryTabChange = useCallback(
    (slug: string, id: number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug === "all") {
        params.delete("category_id");
        params.delete("category_slug");
      } else {
        // Write both so the backend can use whichever it supports.
        if (id !== null) params.set("category_id", String(id));
        params.set("category_slug", slug);
      }
      const qs = params.toString();
      const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
      window.history.replaceState(null, "", url);
    },
    [searchParams],
  );

  const handleCountryChange = useCallback((country: Country | null) => {
    const countryName = country?.name || "";
    setSelectedCountry(countryName.toLowerCase());
    
    // Update URL params so useDirectoryListings re-fetches with the new country filter
    const params = new URLSearchParams(searchParams.toString());
    if (countryName) {
      params.set("country", countryName);
    } else {
      params.delete("country");
    }
    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [searchParams]);

  const headerFilteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const targetCountry = selectedCountry.trim().toLowerCase();

    return items.filter((item) => {
      const record = item as Record<string, unknown>;
      const textFields = [
        record.name,
        record.title,
        record.description,
        record.category,
        record.tag,
        record.location,
      ];

      const passesSearch =
        !q ||
        textFields.some((value) =>
          value?.toString().toLowerCase().includes(q),
        );
      if (!passesSearch) return false;

      if (!targetCountry) return true;

      const itemCountry = record.country?.toString().toLowerCase();
      const itemLocation = record.location?.toString().toLowerCase();
      return itemCountry === targetCountry || !!itemLocation?.includes(targetCountry);
    });
  }, [items, searchQuery, selectedCountry]);

  const grouped = useMemo(() => {
    return headerFilteredItems.reduce<Record<string, T[]>>((acc, item) => {
      const key = groupBy(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [headerFilteredItems, groupBy]);

  const groupNames = useMemo(() => Object.keys(grouped), [grouped]);

  const filtered = useMemo(() => {
    if (selectedCategory === "all") return headerFilteredItems;
    return headerFilteredItems.filter((item) =>
      matchesCategory(item, selectedCategory),
    );
  }, [headerFilteredItems, selectedCategory, matchesCategory]);

  const usingCategoryFetch = isCategorySelected && !!mapItem;

  if (isLoading) return <DirectoryPageSkeleton />;

  return (
    <div className="bg-gray-50 min-h-screen">
      <ScrollableCategoryTabs
        mainCategorySlug={mainCategorySlug}
        context={context}
        defaultValue="all"
        value={selectedCategory}
        onCategoryChange={handleCategoryTabChange}
        containerClassName="pt-4 pb-1"
      />

      <Suspense fallback={<div className="h-20" />}>
        <SearchHeader
          context={context}
          detectedCountry={detectedCountry}
          onCountryChange={handleCountryChange}
          onSearchChange={setSearchQuery}
        />
      </Suspense>

      <div className="pb-8">
        {isCategoryLoading ? (
          <div className="space-y-8 px-4 lg:px-16 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        ) : usingCategoryFetch && topCategoryItems.length === 0 && allCategoryItems.length === 0 ? (
          <div className="py-16 text-center text-gray-500 font-medium">
            {emptyMessage}
          </div>
        ) : !usingCategoryFetch && filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500 font-medium">
            {emptyMessage}
          </div>
        ) : selectedCategory === "all" ? (
          <>
            {renderHero(filtered.slice(0, heroSize))}

            {groupNames.slice(0, visibleGroups).map((name) => (
              <div key={name}>{renderGroup(name, grouped[name])}</div>
            ))}

            {renderCard && (
              <PaginatedGrid<T>
                key={`all-${filtered.length}`}
                items={filtered}
                initialCount={initialGridCount}
                loadMoreStep={gridLoadMoreStep}
                title={gridTitle}
                renderCard={renderCard}
              />
            )}

            {renderMidBanner?.()}
            {renderFooterCta?.()}
          </>
        ) : usingCategoryFetch ? (
          <>
            {topCategoryItems.length > 0 && renderHero(topCategoryItems.slice(0, heroSize))}

            {renderCard ? (
              <PaginatedGrid<T>
                key={`cat-${categoryIdParam ?? categorySlugParam}-${allCategoryItems.length}`}
                items={allCategoryItems}
                initialCount={initialGridCount}
                loadMoreStep={gridLoadMoreStep}
                title={gridTitle}
                renderCard={renderCard}
              />
            ) : (
              renderFiltered(allCategoryItems)
            )}

            {renderMidBanner?.()}
            {renderFooterCta?.()}
          </>
        ) : renderCard ? (
          <PaginatedGrid<T>
            key={`${selectedCategory}-${filtered.length}`}
            items={filtered}
            initialCount={initialGridCount}
            loadMoreStep={gridLoadMoreStep}
            title={gridTitle}
            renderCard={renderCard}
          />
        ) : (
          renderFiltered(filtered)
        )}
      </div>
    </div>
  );
}

interface PaginatedGridProps<T> {
  items: T[];
  initialCount: number;
  loadMoreStep: number;
  title?: string;
  renderCard: (item: T) => ReactNode;
}

function PaginatedGrid<T>({
  items,
  initialCount,
  loadMoreStep,
  title,
  renderCard,
}: PaginatedGridProps<T>) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const visible = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;
  const remaining = items.length - visibleCount;

  return (
    <section className="py-10 px-4 lg:px-16">
      {title && (
        <h2 className="font-semibold text-2xl md:text-3xl mb-6">{title}</h2>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {visible.map((item, i) => (
          <div key={i}>{renderCard(item)}</div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-10">
          <Button
            onClick={() =>
              setVisibleCount((v) =>
                Math.min(v + loadMoreStep, items.length),
              )
            }
            variant="outline"
            className="border-[#9ACC23] text-[#9ACC23] hover:bg-[#9ACC23] hover:text-white"
          >
            Show more ({Math.min(loadMoreStep, remaining)} more)
          </Button>
        </div>
      )}
    </section>
  );
}

function DirectoryPageSkeleton() {
  return (
    <div className="space-y-8 px-4 lg:px-16 pt-8">
      <div className="flex gap-4 overflow-hidden">
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-80 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
