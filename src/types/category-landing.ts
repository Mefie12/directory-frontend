import type { ApiCategory, ApiListing } from "@/lib/directory/types";

export type CategoryLandingListingType = "business" | "community" | "event";

export interface CategoryLandingSection {
  title: string;
  type: CategoryLandingListingType;
  items: ApiListing[];
  total: number;
  has_more: boolean;
}

export interface CategoryLandingTypeView {
  title: string;
  type: CategoryLandingListingType;
  items: ApiListing[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
}

export interface CategoryLandingResponse {
  success: boolean;
  mode: "grouped" | "type";
  category: ApiCategory;
  subcategories: ApiCategory[];
  active_subcategory: ApiCategory | null;
  available_countries: string[];
  sections?: Record<CategoryLandingListingType, CategoryLandingSection>;
  type_view?: CategoryLandingTypeView;
  meta?: {
    detected_country?: string | null;
    detected_country_code?: string | null;
    from_geo?: boolean;
    fallback_country?: string | null;
    country_source?: "explicit" | "geo" | "fallback";
  };
}
