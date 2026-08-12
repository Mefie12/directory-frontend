// Shared API types for the business / events / communities directory pages.
// These describe the raw shape returned by the backend; page-specific
// "Processed*" types live next to each page's mapper.

export interface ApiImage {
  id?: number;
  /** Spatie V2: full-size S3 URL */
  original: string;
  /** Spatie V2: 200×200 thumbnail URL (falls back to original while conversion is pending) */
  thumb: string;
  /** Spatie V2: WebP version URL (falls back to original while conversion is pending) */
  webp: string;
  /** Uncropped, bounded WebP intended for listing cards. */
  card?: string;
  mime_type?: string;
  file_size?: number;
  size?: string;
}

export interface ApiCategory {
  id?: number;
  name: string;
  slug?: string;
  /** Null for top-level categories; the parent's slug for subcategories. */
  parent_slug?: string | null;
  type?: string;
}

/**
 * Returns the most specific category for display on a listing card.
 * Prefers a subcategory (parent_slug is set) over a top-level category,
 * falling back to the first category when no subcategory is present.
 */
export function pickDisplayCategory(categories: ApiCategory[]): ApiCategory | undefined {
  if (!categories || categories.length === 0) return undefined;
  return categories.find((c) => !!c.parent_slug) ?? categories[0];
}

export interface ApiListing {
  id: number;
  name: string;
  slug: string;
  type?: string;
  listing_type?: string;
  rating: string | number;
  ratings_count: string | number;
  address?: string;
  city?: string;
  country?: string;
  status?: string;
  claim_status?: "unclaimed" | "appealed" | "claimed" | string;
  images: (ApiImage | string)[];
  /** Explicit cover image, when the vendor has set one — authoritative over `images[0]`. */
  cover?: ApiImage | null;
  cover_is_explicit?: boolean;
  cover_image?: string;
  image?: string;
  primary_image?: string;
  categories: ApiCategory[];
  bio?: string;
  description?: string;
  created_at?: string;
  listing_verified?: boolean;
  is_verified?: boolean;
  verified?: boolean;
  isVerified?: boolean;
  badge?: string;
  reach_badge?: string | null;
  // Event-only fields (flat — populated by ListingResource when events relation is loaded)
  event_start_date?: string;
  event_end_date?: string;
  event_start_time?: string;
  event_end_time?: string;
  event_venue?: string;
  event_venue_address?: string | null;
  event_city?: string;
  event_country?: string;
  event_price?: string | null;
  event_currency?: string | null;
  event_location_type?: string | null;
  /**
   * Flat event_* fields are only populated by some endpoints. List endpoints
   * that load the events relation return the same data under a nested `event`
   * object instead (see `event` below), so event readers must check both.
   */
  event_ticket_url?: string | null;
  event_online_url?: string | null;
  event_timezone?: string | null;
  event_timezone_label?: string | null;
  /**
   * Nested event payload. Endpoints that eager-load the events relation
   * (`/api/events`, `/api/all_listings_by_country_and_category`,
   * `/api/listing/{slug}/show`) return event details here rather than as flat
   * `event_*` fields — notably this is the only place the ticket URL appears.
   */
  event?: ApiEventDetails | null;
}

export interface ApiEventDetails {
  event_ticket_url?: string | null;
  event_online_url?: string | null;
  event_start_date?: string | null;
  event_end_date?: string | null;
  event_start_time?: string | null;
  event_end_time?: string | null;
  event_venue?: string | null;
  event_city?: string | null;
  event_country?: string | null;
  event_price?: string | null;
  event_currency?: string | null;
  event_location_type?: string | null;
}

/**
 * Resolves an event's ticket URL from either shape the API may return it in
 * — nested under `event` (list endpoints that load the relation) or flat on
 * the listing (documented but not currently emitted by any endpoint).
 */
export function resolveTicketUrl(
  item: Pick<ApiListing, "event" | "event_ticket_url">,
): string | undefined {
  return item.event?.event_ticket_url || item.event_ticket_url || undefined;
}

export interface ApiListingsResponse<T = ApiListing> {
  data: T[];
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    detected_country?: string;
  };
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
}

export type DirectoryEndpoint =
  | "/api/businesses"
  | "/api/events"
  | "/api/communities";
