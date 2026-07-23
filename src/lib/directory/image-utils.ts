import { ApiImage } from "./types";
import { parseLocalDate } from "./event-formatting";

const FALLBACK_IMAGE = "/images/no-image.jpg";

/**
 * Resolve a possibly-relative media URL to an absolute URL against
 * NEXT_PUBLIC_API_URL, or return the fallback placeholder.
 */
export function getImageUrl(url: string | undefined | null): string {
  if (!url) return FALLBACK_IMAGE;
  if (url.startsWith("http")) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
  return `${API_URL}/${url.replace(/^\//, "")}`;
}

/**
 * Normalise a listing's images array into a non-empty list of absolute URLs.
 * Prefers `img.webp` (smaller file, ~50% of JPEG original) when available,
 * falling back to `img.original`. Falls back further to the item's
 * `image` / `cover_image` field, and finally to the generic placeholder.
 */
export function processImages(
  images: (ApiImage | string)[] | undefined,
  fallbacks: (string | undefined | null)[] = [],
): string[] {
  const raw = Array.isArray(images) ? images : [];

  const valid = raw
    .filter((img): img is string | ApiImage => {
      if (typeof img === "string") return !!img;
      return !!(img && typeof img === "object" && img.original);
    })
    .map((img) =>
      getImageUrl(typeof img === "string" ? img : (img.card || img.webp || img.original)),
    );

  if (valid.length > 0) return valid;

  for (const fb of fallbacks) {
    if (fb) return [getImageUrl(fb)];
  }

  return [FALLBACK_IMAGE];
}

/**
 * Format an ISO date string as e.g. "Apr 20, 2026". Returns "TBA" for
 * invalid / missing inputs.
 */
export function formatDateTime(dateString?: string | null): string {
  // Parsed via parseLocalDate rather than `new Date(dateString)` directly —
  // a date-only string ("2026-09-20") is otherwise interpreted as UTC
  // midnight, shifting the displayed date back a day for viewers west of UTC.
  const date = parseLocalDate(dateString);
  if (!date) return "TBA";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
