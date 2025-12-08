// API utility functions for fetching data

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Listing {
  id: string;
  name: string;
  description: string;
  category: string;
  country: string;
  price?: number;
  image?: string[];
  createdAt: string;
  slug?: string;
}

export interface Business extends Listing {
  type: "business"; // This line is already present and correct
  address?: string;
  phone?: string;
  website?: string;
  rating: number;
  reviewCount: string;
  location: string;
  slug: string;
  category: string;
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
  imageUrl: string;
  tag: string;
  verified: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
}

export interface OpeningHours {
  id: string;
  day: string;
  openTime: string;
  closeTime: string;
  isClosed?: boolean;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price?: number;
}

export interface Social {
  id: string;
  platform: string;
  url: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface ApiResponse<T> {
  data: T[];
  pagination?: {
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
  [key: string]: string | number | boolean | null | undefined;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends AuthCredentials {
  name: string;
  confirmPassword?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build query string from search parameters
 */
function buildQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

/**
 * Get authorization header from token
 */
function getAuthHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// ============================================================================
// AUTHENTICATION APIs
// ============================================================================

/**
 * Login user
 */
export async function login(credentials: AuthCredentials): Promise<unknown> {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to login' }));
    throw new Error(error.error || 'Failed to login');
  }

  return response.json();
}

/**
 * Register new user
 */
export async function register(data: RegisterData): Promise<unknown> {
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to register' }));
    throw new Error(error.error || 'Failed to register');
  }

  return response.json();
}

/**
 * Logout user
 */
export async function logout(token?: string): Promise<unknown> {
  const response = await fetch('/api/logout', {
    method: 'POST',
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to logout' }));
    throw new Error(error.error || 'Failed to logout');
  }

  return response.json();
}

// ============================================================================
// USER APIs
// ============================================================================

/**
 * Get current user
 */
export async function getCurrentUser(token?: string): Promise<User> {
  const response = await fetch('/api/user', {
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  return response.json();
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(token?: string, params: SearchParams = {}): Promise<ApiResponse<User>> {
  const queryString = buildQueryString(params);
  const response = await fetch(`/api/all_users?${queryString}`, {
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  return response.json();
}

/**
 * Update user
 */
export async function updateUser(data: Partial<User>, token?: string): Promise<User> {
  const response = await fetch('/api/update_user', {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update user' }));
    throw new Error(error.error || 'Failed to update user');
  }

  return response.json();
}

// ============================================================================
// LISTING APIs
// ============================================================================

/**
 * Fetch all listings
 */
export async function fetchListings(params: SearchParams = {}): Promise<ApiResponse<Listing>> {
  const queryString = buildQueryString(params);
  const response = await fetch(`/api/listings?${queryString}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch listings');
  }

  return response.json();
}

/**
 * Get user's listings
 */
export async function getMyListings(token?: string, params: SearchParams = {}): Promise<ApiResponse<Listing>> {
  const queryString = buildQueryString(params);
  const response = await fetch(`/api/listing/my_listings?${queryString}`, {
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch my listings');
  }

  return response.json();
}

/**
 * Get single listing by slug
 */
export async function getListing(slug: string, token?: string): Promise<Listing> {
  const response = await fetch(`/api/listing/${slug}/show`, {
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch listing');
  }

  return response.json();
}

/**
 * Create listing profile
 */
export async function createListingProfile(data: Partial<Listing>, token?: string): Promise<Listing> {
  const response = await fetch('/api/listing/profile', {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create listing' }));
    throw new Error(error.error || 'Failed to create listing');
  }

  return response.json();
}

/**
 * Update listing
 */
export async function updateListing(slug: string, data: Partial<Listing>, token?: string): Promise<Listing> {
  const response = await fetch(`/api/listing/${slug}/update`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update listing' }));
    throw new Error(error.error || 'Failed to update listing');
  }

  return response.json();
}

/**
 * Update listing status
 */
export async function updateListingStatus(slug: string, status: string, token?: string): Promise<Listing> {
  const response = await fetch(`/api/listing/${slug}/update_status`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update listing status' }));
    throw new Error(error.error || 'Failed to update listing status');
  }

  return response.json();
}

/**
 * Update listing address
 */
export async function updateListingAddress(slug: string, address: Address, token?: string): Promise<Address> {
  const response = await fetch(`/api/listing/${slug}/address`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(address),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update address' }));
    throw new Error(error.error || 'Failed to update address');
  }

  return response.json();
}

/**
 * Delete listing
 */
export async function deleteListing(slug: string, token?: string): Promise<void> {
  const response = await fetch(`/api/listing/${slug}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete listing' }));
    throw new Error(error.error || 'Failed to delete listing');
  }
}

// ============================================================================
// BUSINESS APIs
// ============================================================================

/**
 * Fetch businesses
 */
export async function fetchBusinesses(params: SearchParams = {}): Promise<ApiResponse<Business>> {
  const queryString = buildQueryString(params);
  const response = await fetch(`/api/businesses?${queryString}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch businesses');
  }

  return response.json();
}

// ============================================================================
// EVENT APIs
// ============================================================================

/**
 * Fetch events
 */
export async function fetchEvents(params: SearchParams = {}): Promise<ApiResponse<Event>> {
  const queryString = buildQueryString(params);
  const response = await fetch(`/api/events?${queryString}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }

  return response.json();
}

// ============================================================================
// COMMUNITY APIs
// ============================================================================

/**
 * Fetch communities
 */
export async function fetchCommunities(params: SearchParams = {}): Promise<ApiResponse<Community>> {
  const queryString = buildQueryString(params);
  const response = await fetch(`/api/communities?${queryString}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch communities');
  }

  return response.json();
}

// ============================================================================
// CATEGORY APIs
// ============================================================================

/**
 * Get all categories
 */
export async function getCategories(token?: string, params: SearchParams = {}): Promise<ApiResponse<Category>> {
  const queryString = buildQueryString(params);
  const response = await fetch(`/api/categories?${queryString}`, {
    headers: getAuthHeaders(token),
    cache: 'force-cache',
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  return response.json();
}

/**
 * Create category
 */
export async function createCategory(data: Partial<Category>, token?: string): Promise<Category> {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create category' }));
    throw new Error(error.error || 'Failed to create category');
  }

  return response.json();
}

/**
 * Update category
 */
export async function updateCategory(id: string, data: Partial<Category>, token?: string): Promise<Category> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update category' }));
    throw new Error(error.error || 'Failed to update category');
  }

  return response.json();
}

/**
 * Delete category
 */
export async function deleteCategory(id: string, token?: string): Promise<void> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete category' }));
    throw new Error(error.error || 'Failed to delete category');
  }
}

// ============================================================================
// OPENING HOURS APIs
// ============================================================================

/**
 * Get opening hours for a listing
 */
export async function getOpeningHours(listingId: string, token?: string): Promise<OpeningHours[]> {
  const response = await fetch(`/api/listing/${listingId}/opening_hours`, {
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch opening hours');
  }

  return response.json();
}

/**
 * Create opening hours
 */
export async function createOpeningHours(listingId: string, data: Partial<OpeningHours>, token?: string): Promise<OpeningHours> {
  const response = await fetch(`/api/listing/${listingId}/opening_hours`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create opening hours' }));
    throw new Error(error.error || 'Failed to create opening hours');
  }

  return response.json();
}

/**
 * Update opening hours
 */
export async function updateOpeningHours(id: string, data: Partial<OpeningHours>, token?: string): Promise<OpeningHours> {
  const response = await fetch(`/api/opening_hours/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update opening hours' }));
    throw new Error(error.error || 'Failed to update opening hours');
  }

  return response.json();
}

/**
 * Delete opening hours
 */
export async function deleteOpeningHours(id: string, token?: string): Promise<void> {
  const response = await fetch(`/api/opening_hours/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete opening hours' }));
    throw new Error(error.error || 'Failed to delete opening hours');
  }
}

// ============================================================================
// SERVICE APIs
// ============================================================================

/**
 * Get services for a listing
 */
export async function getServices(listingId: string, token?: string): Promise<Service[]> {
  const response = await fetch(`/api/listing/${listingId}/services`, {
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch services');
  }

  return response.json();
}

/**
 * Create service
 */
export async function createService(listingId: string, data: Partial<Service>, token?: string): Promise<Service> {
  const response = await fetch(`/api/listing/${listingId}/services`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create service' }));
    throw new Error(error.error || 'Failed to create service');
  }

  return response.json();
}

/**
 * Update service
 */
export async function updateService(id: string, data: Partial<Service>, token?: string): Promise<Service> {
  const response = await fetch(`/api/service/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update service' }));
    throw new Error(error.error || 'Failed to update service');
  }

  return response.json();
}

/**
 * Delete service
 */
export async function deleteService(id: string, token?: string): Promise<void> {
  const response = await fetch(`/api/service/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete service' }));
    throw new Error(error.error || 'Failed to delete service');
  }
}

// ============================================================================
// SOCIAL APIs
// ============================================================================

/**
 * Get social links for a listing
 */
export async function getSocials(listingId: string, token?: string): Promise<Social[]> {
  const response = await fetch(`/api/listing/${listingId}/socials`, {
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch socials');
  }

  return response.json();
}

/**
 * Create social link
 */
export async function createSocial(listingId: string, data: Partial<Social>, token?: string): Promise<Social> {
  const response = await fetch(`/api/listing/${listingId}/socials`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create social' }));
    throw new Error(error.error || 'Failed to create social');
  }

  return response.json();
}

/**
 * Update social link
 */
export async function updateSocial(id: string, data: Partial<Social>, token?: string): Promise<Social> {
  const response = await fetch(`/api/listing/socials/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update social' }));
    throw new Error(error.error || 'Failed to update social');
  }

  return response.json();
}

/**
 * Delete social link
 */
export async function deleteSocial(id: string, token?: string): Promise<void> {
  const response = await fetch(`/api/listing/socials/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete social' }));
    throw new Error(error.error || 'Failed to delete social');
  }
}

// ============================================================================
// SEARCH API
// ============================================================================

/**
 * Global search across all content types
 */
export async function search(params: SearchParams = {}, token?: string): Promise<unknown> {
  const queryString = buildQueryString(params);
  const response = await fetch(`/api/search?${queryString}`, {
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to search');
  }

  return response.json();
}
