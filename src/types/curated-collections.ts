export interface CuratedCollectionImage {
  original: string;
  thumb: string;
  webp: string;
  card?: string;
}

export interface CuratedCollectionListing {
  id: number;
  name: string;
  slug: string;
  type: 'business' | 'event' | 'community';
  city: string | null;
  country: string | null;
  rating: number;
  ratings_count: number;
  listing_verified: boolean;
  categories: { name: string }[];
  bio?: string | null;
  description?: string | null;
  event_start_date: string | null;
  event_venue: string | null;
  event_city: string | null;
  images: CuratedCollectionImage[];
}

export interface CuratedCollectionItem {
  id: number;
  sort_order: number;
  listing: CuratedCollectionListing;
}

export interface CuratedCollection {
  id: number;
  title: string;
  subtitle: string | null;
  country: string | null;
  sort_order: number;
  is_published: boolean;
  expires_at: string | null;
  items_count: number;
  items: CuratedCollectionItem[];
  created_at: string;
  updated_at: string;
}

export interface ListingSearchResult {
  id: number;
  name: string;
  slug: string;
  type: 'business' | 'event' | 'community';
  city: string | null;
  country: string | null;
  category: string | null;
  thumb: string | null;
}
