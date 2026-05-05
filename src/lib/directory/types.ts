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
  mime_type?: string;
  file_size?: number;
  size?: string;
}

export interface ApiCategory {
  id?: number;
  name: string;
  slug?: string;
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
  images: (ApiImage | string)[];
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
  event_ticket_url?: string | null;
  event_online_url?: string | null;
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
