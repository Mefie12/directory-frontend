"use client";

import { ReactNode, Suspense, useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ScrollableCategoryTabs from "@/components/scrollable-category-tabs";
import SearchHeader from "@/components/search-header";
import { Country } from "@/components/ui/country-dropdown";

export interface DirectoryPageShellProps<T> {
  /** Slug passed to `<ScrollableCategoryTabs mainCategorySlug=...>`. */
  mainCategorySlug: string;
  /** Context passed to `<SearchHeader>` for filter-bar behaviour. */
  context: "businesses" | "events" | "communities";
  /** Mapped items produced by `useDirectoryListings`. */
  items: T[];
  isLoading: boolean;
  detectedCountry: string | null;

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

/**
 * Shared page shell for directory listing pages (businesses, events,
 * communities). Owns tab state, category grouping, the expand/collapse
 * button, loading skeleton, and empty state. Carousel rendering is
 * delegated to the caller via render props.
 */
export function DirectoryPageShell<T>({
  mainCategorySlug,
  context,
  items,
  isLoading,
  detectedCountry,
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
  const [selectedCategory, setSelectedCategory] = useState("all");

  const grouped = useMemo(() => {
    return items.reduce<Record<string, T[]>>((acc, item) => {
      const key = groupBy(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [items, groupBy]);

  const groupNames = useMemo(() => Object.keys(grouped), [grouped]);

  const filtered = useMemo(() => {
    if (selectedCategory === "all") return items;
    return items.filter((item) => matchesCategory(item, selectedCategory));
  }, [items, selectedCategory, matchesCategory]);

  const handleCountryChange = useCallback((_country: Country | null) => {
    // Placeholder — SearchHeader currently owns country mutation via URL.
    void _country;
  }, []);

  if (isLoading) return <DirectoryPageSkeleton />;

  return (
    <div className="bg-gray-50 min-h-screen">
      <ScrollableCategoryTabs
        mainCategorySlug={mainCategorySlug}
        defaultValue="all"
        value={selectedCategory}
        onChange={setSelectedCategory}
        containerClassName="pt-4 pb-1"
      />

      <Suspense fallback={<div className="h-20" />}>
        <SearchHeader
          context={context}
          detectedCountry={detectedCountry}
          onCountryChange={handleCountryChange}
        />
      </Suspense>

      <div className="pb-8">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500 font-medium">
            {emptyMessage}
          </div>
        ) : selectedCategory === "all" ? (
          <>
            {renderHero(items.slice(0, heroSize))}

            {groupNames.slice(0, visibleGroups).map((name) => (
              <div key={name}>{renderGroup(name, grouped[name])}</div>
            ))}

            {renderCard && (
              <PaginatedGrid<T>
                key={`all-${items.length}`}
                items={items}
                initialCount={initialGridCount}
                loadMoreStep={gridLoadMoreStep}
                title={gridTitle}
                renderCard={renderCard}
              />
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
