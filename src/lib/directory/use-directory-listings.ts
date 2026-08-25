"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ApiListing,
  ApiListingsResponse,
  DirectoryEndpoint,
} from "./types";
import { COUNTRY_CHANGE_EVENT } from "@/context/country-context";

export interface UseDirectoryListingsOptions<T> {
  /** Proxy endpoint to hit (e.g. "/api/businesses"). */
  endpoint: DirectoryEndpoint;
  /** Convert a raw API item into the display shape. Return `null` to skip. */
  mapItem: (item: ApiListing) => T | null;
  /**
   * Names of URL search params to forward to the backend. Defaults to
   * ["q", "country", "category_id"]. Unknown/missing params are ignored.
   */
  forwardParams?: string[];
  /** Items per page to request. Defaults to 100 (matches existing pages). */
  perPage?: number;
  /** Additional static query params to always send. */
  extraParams?: Record<string, string | undefined>;
}

export interface UseDirectoryListingsResult<T> {
  items: T[];
  isLoading: boolean;
  error: string | null;
  detectedCountry: string | null;
  showingGlobalFallback: boolean;
  refetch: () => void;
}

const DEFAULT_FORWARD_PARAMS = ["q", "country", "category_id"];

/**
 * Generic data hook for a directory page (businesses / events / communities).
 *
 * Reads filter values from URL search params, calls the given proxy endpoint,
 * maps each raw item through `mapItem`, and returns the result plus loading
 * state. Re-fetches whenever the forwarded search params change.
 */
export function useDirectoryListings<T>({
  endpoint,
  mapItem,
  forwardParams = DEFAULT_FORWARD_PARAMS,
  perPage = 100,
  extraParams,
}: UseDirectoryListingsOptions<T>): UseDirectoryListingsResult<T> {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [showingGlobalFallback, setShowingGlobalFallback] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const reload = () => setReloadKey((key) => key + 1);
    window.addEventListener(COUNTRY_CHANGE_EVENT, reload);
    return () => window.removeEventListener(COUNTRY_CHANGE_EVENT, reload);
  }, []);

  // Keep mapItem latest without re-running the effect on every render.
  const mapItemRef = useRef(mapItem);
  mapItemRef.current = mapItem;

  // Build a stable dependency string from the forwarded params so the
  // effect only fires when the values actually change.
  const forwardedValues = forwardParams
    .map((key) => `${key}=${searchParams.get(key) ?? ""}`)
    .join("&");

  const extraKey = extraParams
    ? Object.entries(extraParams)
        .map(([k, v]) => `${k}=${v ?? ""}`)
        .join("&")
    : "";

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function run() {
      try {
        setIsLoading(true);
        setError(null);
        setShowingGlobalFallback(false);

        const params = new URLSearchParams({ per_page: String(perPage) });
        const categoryId = searchParams.get("category_id");
        const categorySlug = searchParams.get("category_slug");
        const country = searchParams.get("country");

        for (const key of forwardParams) {
          const v = searchParams.get(key);
          if (!v) continue;
          if (key === "category_id" && v === "all") continue;
          params.set(key, v);
        }

        if (extraParams) {
          for (const [k, v] of Object.entries(extraParams)) {
            if (v) params.set(k, v);
          }
        }

        const hasCategoryFilter = !!(
          (categoryId && categoryId !== "all") ||
          (categorySlug && categorySlug !== "all")
        );
        const targetEndpoint = hasCategoryFilter
          ? country
            ? "/api/all_listings_by_country_and_category"
            : "/api/all_listings_by_category_and_geolocation"
          : endpoint;

        const res = await fetch(`${targetEndpoint}?${params.toString()}`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }

        const json = (await res.json()) as ApiListingsResponse & {
          listings?: ApiListing[];
        };

        if (cancelled) return;

        const geoDetectedCountry = json.meta?.detected_country ?? null;
        const raw = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.listings)
            ? json.listings
            : [];

        // Master/Geo contexts with no matches fall back to UK. Explicit URL
        // filters remain authoritative and retain a genuine empty state.
        const hasExplicitCountry = !!country;
        if (
          !hasExplicitCountry &&
          geoDetectedCountry &&
          geoDetectedCountry.toLowerCase() !== "united kingdom" &&
          raw.length === 0
        ) {
          const fallbackParams = new URLSearchParams(params);
          fallbackParams.set("country", "United Kingdom");

          const fallbackEndpoint = hasCategoryFilter
            ? "/api/all_listings_by_country_and_category"
            : endpoint;

          const fallbackRes = await fetch(`${fallbackEndpoint}?${fallbackParams.toString()}`, {
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            signal: controller.signal,
          });

          if (fallbackRes.ok) {
            const fallbackJson = (await fallbackRes.json()) as ApiListingsResponse & {
              listings?: ApiListing[];
            };
            if (cancelled) return;
            const fallbackRaw = Array.isArray(fallbackJson.data)
              ? fallbackJson.data
              : Array.isArray(fallbackJson.listings)
                ? fallbackJson.listings
                : [];
            const fallbackMapped: T[] = [];
            for (const item of fallbackRaw) {
              const out = mapItemRef.current(item);
              if (out !== null && out !== undefined) fallbackMapped.push(out);
            }
            setItems(fallbackMapped);
            setShowingGlobalFallback(true);
          } else {
            setItems([]);
          }

          setDetectedCountry(geoDetectedCountry);
          return;
        }

        if (geoDetectedCountry) {
          setDetectedCountry(geoDetectedCountry);
        }

        const mapped: T[] = [];
        for (const item of raw) {
          const out = mapItemRef.current(item);
          if (out !== null && out !== undefined) mapped.push(out);
        }
        setItems(mapped);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(`[useDirectoryListings ${endpoint}]`, err);
        setError(err instanceof Error ? err.message : "Request failed");
        setItems([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, perPage, forwardedValues, extraKey, reloadKey]);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  return { items, isLoading, error, detectedCountry, showingGlobalFallback, refetch };
}
