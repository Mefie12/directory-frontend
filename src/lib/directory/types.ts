// Shared API types for the business / events / communities directory pages.
// These describe the raw shape returned by the backend; page-specific
// "Processed*" types live next to each page's mapper.

export interface ApiImage {
  id?: number;
  media: string;
  media_type?: string;
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
  categories: ApiCategory[];
  bio?: string;
  description?: string;
  created_at?: string;
  listing_verified?: boolean;
  is_verified?: boolean;
  verified?: boolean;
  isVerified?: boolean;
  badge?: string;
  // Event-only fields
  event_start_date?: string;
  event_end_date?: string;
  event_venue?: string;
  event_city?: string;
  event_country?: string;
  event_price?: string | null;
  event_currency?: string | null;
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
