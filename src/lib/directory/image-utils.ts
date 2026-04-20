import { ApiImage } from "./types";

const FALLBACK_IMAGE = "/images/placeholders/generic.jpg";
const BAD_IMAGE_STATUSES = ["processing", "failed", "pending", "error"];

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
 * Skips images that are in a bad processing state. Falls back to the item's
 * `image` / `cover_image` field, and finally to the generic placeholder.
 */
export function processImages(
  images: (ApiImage | string)[] | undefined,
  fallbacks: (string | undefined | null)[] = [],
): string[] {
  const raw = Array.isArray(images) ? images : [];

  const valid = raw
    .filter((img): img is string | ApiImage => {
      if (typeof img === "string") return true;
      if (img && typeof img === "object" && "media" in img) {
        return !BAD_IMAGE_STATUSES.includes((img as ApiImage).media);
      }
      return false;
    })
    .map((img) =>
      getImageUrl(typeof img === "string" ? img : (img as ApiImage).media),
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
  if (!dateString) return "TBA";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "TBA";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
