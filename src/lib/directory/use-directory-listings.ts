"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ApiListing,
  ApiListingsResponse,
  DirectoryEndpoint,
} from "./types";

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
  const [reloadKey, setReloadKey] = useState(0);

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

        const params = new URLSearchParams({ per_page: String(perPage) });

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

        const res = await fetch(`${endpoint}?${params.toString()}`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }

        const json = (await res.json()) as ApiListingsResponse;

        if (cancelled) return;

        if (json.meta?.detected_country) {
          setDetectedCountry(json.meta.detected_country);
        }

        const raw = Array.isArray(json.data) ? json.data : [];
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

  return { items, isLoading, error, detectedCountry, refetch };
}
