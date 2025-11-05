// API utility functions for fetching data

export interface Listing {
  id: string;
  name: string;
  description: string;
  category: string;
  country: string;
  price?: number;
  image: string;
  createdAt: string;
  // Add more fields based on your API response
}

export interface Business extends Listing {
  type: "business";
  address?: string;
  phone?: string;
  website?: string;
  rating: number;
  reviewCount: string;
  location: string;
  slug: string;
  verified?: boolean;
  discount?: string;
}

export interface Event extends Listing {
  type: "event";
  date: string;
  location: string;
  ticketPrice?: number;
  slug: string;
  startDate: string;
  endDate: string;
  verified: boolean;
}

export interface Community extends Listing {
  type: "community";
  memberCount?: number;
  category: string;
}

export interface ApiResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchParams {
  q?: string;
  country?: string;
  date?: string;
  price?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch listings from the API
 */
export async function fetchListings(
  params: SearchParams = {}
): Promise<ApiResponse<Listing>> {
  const searchParams = new URLSearchParams();
  
  if (params.q) searchParams.append("q", params.q);
  if (params.country) searchParams.append("country", params.country);
  if (params.date) searchParams.append("date", params.date);
  if (params.price) searchParams.append("price", params.price);
  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());

  const response = await fetch(`/api/listings?${searchParams.toString()}`, {
    cache: "no-store", // For dynamic data, or use 'force-cache' for static
  });

  if (!response.ok) {
    throw new Error("Failed to fetch listings");
  }

  return response.json();
}

/**
 * Fetch businesses from the API
 */
export async function fetchBusinesses(
  params: SearchParams = {}
): Promise<ApiResponse<Business>> {
  const searchParams = new URLSearchParams();
  
  if (params.q) searchParams.append("q", params.q);
  if (params.country) searchParams.append("country", params.country);
  if (params.price) searchParams.append("price", params.price);
  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());

  const response = await fetch(`/api/businesses?${searchParams.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch businesses");
  }

  return response.json();
}

/**
 * Fetch events from the API
 */
export async function fetchEvents(
  params: SearchParams = {}
): Promise<ApiResponse<Event>> {
  const searchParams = new URLSearchParams();
  
  if (params.q) searchParams.append("q", params.q);
  if (params.country) searchParams.append("country", params.country);
  if (params.date) searchParams.append("date", params.date);
  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());

  const response = await fetch(`/api/events?${searchParams.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  return response.json();
}

/**
 * Fetch communities from the API
 */
export async function fetchCommunities(
  params: SearchParams = {}
): Promise<ApiResponse<Community>> {
  const searchParams = new URLSearchParams();
  
  if (params.q) searchParams.append("q", params.q);
  if (params.country) searchParams.append("country", params.country);
  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());

  const response = await fetch(`/api/communities?${searchParams.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch communities");
  }

  return response.json();
}
