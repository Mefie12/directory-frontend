# API Integration Guide - Complete Reference

## Overview

This project uses Next.js App Router with API routes that act as a proxy to your backend API. The API utility file (`/src/lib/api.ts`) provides a comprehensive set of functions for all backend operations.

### Benefits

- **Security**: Backend API URL and keys are kept server-side
- **Caching**: Built-in caching with Next.js revalidation
- **SSR Support**: Server-side rendering for better SEO
- **Type Safety**: Complete TypeScript types for all API responses
- **Authentication**: Built-in token management for protected routes
- **Error Handling**: Consistent error handling across all endpoints

## Setup

### 1. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-api.com
# API_KEY=your-api-key-if-needed
```

### 2. Complete API Routes Structure

```
src/app/api/
├── Authentication
│   ├── login/route.ts                          # POST - User login
│   ├── register/route.ts                       # POST - User registration
│   └── logout/route.ts                         # POST - User logout
│
├── User Management
│   ├── user/route.ts                           # GET - Get current user
│   ├── all_users/route.ts                      # GET - Get all users (admin)
│   └── update_user/route.ts                    # PUT - Update user profile
│
├── Listings
│   ├── listings/route.ts                       # GET - Get all listings
│   ├── listing/
│   │   ├── my_listings/route.ts                # GET - Get user's listings
│   │   ├── profile/route.ts                    # POST - Create listing profile
│   │   ├── [listing_slug]/
│   │   │   ├── route.ts                        # DELETE - Delete listing
│   │   │   ├── show/route.ts                   # GET - Get single listing
│   │   │   ├── update/route.ts                 # PUT - Update listing
│   │   │   ├── update_status/route.ts          # PUT - Update listing status
│   │   │   └── address/route.ts                # PUT - Update listing address
│   │   ├── [listing]/
│   │   │   ├── opening_hours/route.ts          # GET, POST - Opening hours
│   │   │   ├── services/route.ts               # GET, POST - Services
│   │   │   └── socials/route.ts                # GET, POST - Social links
│   │   └── socials/[social_id]/route.ts        # PUT, DELETE - Update/delete social
│
├── Content Types
│   ├── businesses/route.ts                     # GET - Get all businesses
│   ├── events/route.ts                         # GET - Get all events
│   └── communities/route.ts                    # GET - Get all communities
│
├── Categories
│   ├── categories/route.ts                     # GET, POST - List/create categories
│   └── categories/[category_id]/route.ts       # PUT, DELETE - Update/delete category
│
├── Opening Hours
│   └── opening_hours/[opening_hour_id]/route.ts # PUT, DELETE - Update/delete hours
│
├── Services
│   └── service/[service_id]/route.ts           # PUT, DELETE - Update/delete service
│
└── Search
    └── search/route.ts                         # GET - Global search
```

### 3. Query Parameters

All endpoints support the following query parameters:

**Common Parameters:**

- `q` - Search query string
- `country` - Filter by country
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Endpoint-Specific:**

- `price` - Price range filter (businesses, listings)
- `date` - Date filter (events, listings)

### 4. Usage in Pages (Server Components)

```typescript
import { fetchBusinesses } from "@/lib/api";

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: { q?: string; country?: string; price?: string };
}) {
  // Fetch data on the server
  const data = await fetchBusinesses({
    q: searchParams.q,
    country: searchParams.country,
    price: searchParams.price,
  });

  return (
    <div>
      {data.data.map((business) => (
        <div key={business.id}>{business.name}</div>
      ))}
    </div>
  );
}
```

### 5. Usage in Client Components

```typescript
"use client";

import { useEffect, useState } from "react";
import { fetchBusinesses, type Business } from "@/lib/api";

export default function BusinessList() {
  const [businesses, setBusinesses] = useState<Business[]>([]);

  useEffect(() => {
    fetchBusinesses({ q: "restaurant" })
      .then((data) => setBusinesses(data.data))
      .catch(console.error);
  }, []);

  return (
    <div>
      {businesses.map((business) => (
        <div key={business.id}>{business.name}</div>
      ))}
    </div>
  );
}
```

## API Response Format

Expected response format from your backend:

```typescript
{
  "data": [
    {
      "id": "123",
      "name": "Business Name",
      "description": "Description",
      "category": "Restaurant",
      "country": "Ghana",
      "price": 50,
      "image": "https://...",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Customization

### Update API Types

Edit `/src/lib/api.ts` to match your backend response structure:

```typescript
export interface Listing {
  id: string;
  name: string;
  // Add your custom fields here
}
```

### Add Authentication

In `/src/app/api/*/route.ts`, add authentication headers:

```typescript
const response = await fetch(`${API_BASE_URL}/endpoint`, {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.API_KEY}`,
  },
});
```

### Adjust Caching

Modify the `revalidate` value in route handlers:

```typescript
next: {
  revalidate: 300;
} // Cache for 5 minutes
```

Or use `cache: "no-store"` for always-fresh data.

## Next Steps

1. Replace `NEXT_PUBLIC_API_URL` with your actual backend URL
2. Update TypeScript interfaces to match your API response
3. Add authentication if required
4. Test endpoints using the browser or tools like Postman
5. Implement the UI components to display the fetched data

## Testing

Test your API routes:

```bash
# Test listings endpoint
curl http://localhost:3000/api/listings?q=test&country=Ghana

# Test businesses endpoint
curl http://localhost:3000/api/businesses?q=restaurant&price=0-50

# Test events endpoint
curl http://localhost:3000/api/events?date=2024-12-25

# Test communities endpoint
curl http://localhost:3000/api/communities?q=tech
```

# Implementation Summary

## ✅ Completed Tasks

### 1. **Business Card Carousel - Mobile Swipe Support**

**File:** `/src/components/discover/business-card-carousel.tsx`

**Changes:**

- ✅ Carousel buttons hidden on mobile (`hidden md:flex`)
- ✅ Mobile swipe/scroll enabled with `overflow-x-auto` and `snap-x snap-mandatory`
- ✅ Smooth snap scrolling on mobile
- ✅ Grid layout on desktop, horizontal scroll on mobile
- ✅ Component now accepts `businesses` as props from API
- ✅ Shows "No businesses found" when empty
- ✅ Maintains existing UI design

**Mobile Behavior:**

- Users can swipe/slide through businesses
- Snap-to-card scrolling for better UX
- No visible carousel buttons

**Desktop Behavior:**

- Grid layout (4 columns)
- Carousel navigation buttons visible
- Click to navigate

---

### 2. **Search Dropdown with Autocomplete**

**File:** `/src/components/search-dropdown.tsx`

**Features:**

- ✅ Real-time search with 300ms debounce
- ✅ Dropdown shows search results as user types
- ✅ "No results found" message when no matches
- ✅ Loading spinner during search
- ✅ Click outside to close dropdown
- ✅ Fetches from appropriate API endpoint based on context
- ✅ Displays result image, name, category, country, and price
- ✅ Links to individual listing pages

**Integration:**

- Integrated into `SearchHeader` component
- Replaces plain input field
- Works with all contexts (discover, businesses, events, communities)

---

### 3. **API Integration with Server-Side Rendering**

#### **API Routes Created:**

- `/src/app/api/listings/route.ts` - All listings
- `/src/app/api/businesses/route.ts` - Businesses only
- `/src/app/api/events/route.ts` - Events only
- `/src/app/api/communities/route.ts` - Communities only

#### **Pages Updated to Use API:**

**1. Home Page (`/src/app/page.tsx`)**

- ✅ Converted to async server component
- ✅ Fetches featured businesses and upcoming events
- ✅ Passes data to client component (`HomeContent`)
- ✅ Uses `Promise.all` for parallel fetching

**2. Discover Page (`/src/app/discover/page.tsx`)**

- ✅ Fetches all listings from API
- ✅ Respects search params (q, country, date, price)
- ✅ Server-side rendering with SSR
- ✅ Displays results in `BusinessCardCarousel`

**3. Businesses Page (`/src/app/businesses/page.tsx`)**

- ✅ Fetches businesses from API
- ✅ Filters: search, country, price
- ✅ SSR enabled

**4. Events Page (`/src/app/events/page.tsx`)**

- ✅ Fetches events from API
- ✅ Filters: search, country, date
- ✅ SSR enabled

**5. Communities Page (`/src/app/communities/page.tsx`)**

- ✅ Fetches communities from API
- ✅ Filters: search, country
- ✅ SSR enabled

---

## 📁 File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── listings/route.ts       # All listings endpoint
│   │   ├── businesses/route.ts     # Businesses endpoint
│   │   ├── events/route.ts         # Events endpoint
│   │   └── communities/route.ts    # Communities endpoint
│   ├── discover/page.tsx           # Discover page (SSR)
│   ├── businesses/page.tsx         # Businesses page (SSR)
│   ├── events/page.tsx             # Events page (SSR)
│   ├── communities/page.tsx        # Communities page (SSR)
│   └── page.tsx                    # Home page (SSR)
├── components/
│   ├── discover/
│   │   └── business-card-carousel.tsx  # Carousel with swipe
│   ├── landing-page/
│   │   └── home-content.tsx        # Client component for home
│   ├── search-dropdown.tsx         # Search with autocomplete
│   └── search-header.tsx           # Search header with filters
└── lib/
    └── api.ts                      # API utility functions & types
```

---

## 🔄 Data Flow

### **Server-Side Rendering (SSR)**

```
User Request → Page Component (Server)
              ↓
         Fetch from API
              ↓
         Render with Data
              ↓
         Send HTML to Client
```

### **Search Flow**

```
User Types → SearchDropdown (Client)
           ↓
      Debounce 300ms
           ↓
    Fetch from /api/*
           ↓
    Display Results
           ↓
    User Clicks → Navigate
```

### **Filter Flow**

```
User Selects Filter → Update URL Params
                    ↓
              Page Reloads (SSR)
                    ↓
          Fetch with New Params
                    ↓
            Display New Results
```

---

## 🚀 How It Works

### **When You Receive the Backend API:**

1. **Update Environment Variable:**

   ```bash
   # In .env.local
   NEXT_PUBLIC_API_URL=https://your-backend-api.com
   ```

2. **Verify API Response Format:**

   - Check if response matches the expected format in `/src/lib/api.ts`
   - Update TypeScript interfaces if needed

3. **Test Endpoints:**

   ```bash
   # Test in browser or Postman
   http://localhost:3000/api/listings
   http://localhost:3000/api/businesses?q=restaurant
   http://localhost:3000/api/events?date=2024-12-25
   ```

4. **Everything Else Works Automatically:**
   - Pages fetch from API routes
   - Search dropdown queries API
   - Filters update URL and trigger new API calls
   - SSR renders with fresh data

---

## 🎨 UI/UX Features

### **Mobile Experience:**

- ✅ Swipe to navigate carousels
- ✅ Snap scrolling for smooth UX
- ✅ No carousel buttons (cleaner interface)
- ✅ Touch-friendly search dropdown

### **Desktop Experience:**

- ✅ Grid layouts for better content display
- ✅ Carousel navigation buttons
- ✅ Hover effects on cards
- ✅ Larger search dropdown

### **Search Experience:**

- ✅ Instant feedback while typing
- ✅ Visual loading indicators
- ✅ Clear "no results" messaging
- ✅ Click anywhere to close dropdown

---

## 🔧 Configuration

### **Caching Strategy:**

- API routes cache for 60 seconds (`revalidate: 60`)
- Browser cache: `s-maxage=60, stale-while-revalidate=120`
- Can be adjusted in `/src/app/api/*/route.ts`

### **Search Debounce:**

- 300ms delay (configurable in `search-dropdown.tsx`)

### **Items Per Page:**

- Home: 8 businesses, 6 events
- Other pages: 12 items (configurable via `limit` param)

---

## 📝 Next Steps

1. **When API is ready:**

   - Update `NEXT_PUBLIC_API_URL` in `.env.local`
   - Verify response format matches TypeScript interfaces
   - Add authentication headers if needed

2. **Optional Enhancements:**

   - Add pagination controls
   - Implement infinite scroll
   - Add loading skeletons
   - Add error retry mechanisms

3. **Testing:**
   - Test all search filters
   - Test mobile swipe functionality
   - Test search dropdown on all pages
   - Verify SSR is working (view page source)

---

## 🐛 Troubleshooting

**Search dropdown not showing:**

- Check browser console for API errors
- Verify API endpoint is accessible
- Check network tab for failed requests

**Carousel not scrolling on mobile:**

- Ensure `overflow-x-auto` class is present
- Check if `scrollbar-hide` utility is defined in Tailwind

**API not fetching:**

- Verify `NEXT_PUBLIC_API_URL` is set
- Check API route logs in terminal
- Ensure backend API is running

**SSR not working:**

- Check if page component is async
- Verify no client-side hooks in server components
- Look for "use client" directive placement

---

## ✨ Summary

All three requirements have been fully implemented:

1. ✅ **Carousel with mobile swipe** - Buttons hidden on mobile, swipe enabled
2. ✅ **Search dropdown with autocomplete** - Real-time results, "no results" message
3. ✅ **API integration** - All pages fetch from API, SSR enabled, search uses API

The application is now ready to connect to your backend API. Simply update the environment variable and everything will work seamlessly!

# Businesses Page Structure

## Layout Overview

The businesses page follows this vertical structure:

```
┌─────────────────────────────────────────┐
│  Navigation Tabs (All Listings, etc.)  │ ← NavigationTab component
├─────────────────────────────────────────┤
│  Scrollable Category Tabs               │ ← ScrollableCategoryTabs
│  (All businesses, Dancers, etc.)        │   (white bg, border-bottom)
├─────────────────────────────────────────┤
│  Search & Filter Bar                    │ ← SearchHeader component
│  (Search box, Country, Price filters)   │   (white bg, border-bottom)
├─────────────────────────────────────────┤
│                                         │
│  Business Content Area                  │ ← BusinessBestCarousel
│  (Today's best deals, etc.)             │   (gray-50 background)
│                                         │
│  [Business Cards Grid/Carousel]         │
│                                         │
└─────────────────────────────────────────┘
```

## Component Hierarchy

```
page.tsx (Server Component)
└── NavigationTab
└── BusinessesContent (Client Component)
    ├── ScrollableCategoryTabs
    ├── SearchHeader
    └── BusinessBestCarousel (filtered)
```

## File Structure

### 1. `/src/app/businesses/page.tsx` (Server Component)

- Fetches data from `data.ts`
- Renders NavigationTab
- Passes data to BusinessesContent

```tsx
export default async function Businesses() {
  const categories = businessCategories;
  const businesses = featuredBusinesses;

  return (
    <div className="overflow-x-hidden pt-20 bg-white min-h-screen">
      <div className="w-full">
        <NavigationTab />
        <BusinessesContent categories={categories} businesses={businesses} />
      </div>
    </div>
  );
}
```

### 2. `/src/app/businesses/businesses-content.tsx` (Client Component)

- Manages filtering state
- Renders category tabs, search bar, and filtered content
- Handles category selection and filtering logic

```tsx
export default function BusinessesContent({ categories, businesses }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const filteredBusinesses = useMemo(() => { /* filtering logic */ }, []);

  return (
    <>
      {/* Category Tabs Section */}
      <div className="bg-white border-b border-gray-200">
        <ScrollableCategoryTabs ... />
      </div>

      {/* Search Bar Section */}
      <div className="bg-white border-b border-gray-200">
        <SearchHeader context="businesses" />
      </div>

      {/* Content Section */}
      <div className="bg-gray-50 min-h-screen">
        <BusinessBestCarousel businesses={filteredBusinesses} />
      </div>
    </>
  );
}
```

## Styling Details

### Section Backgrounds

- **Navigation Tabs**: White background (from NavigationTab component)
- **Category Tabs**: White background with bottom border
- **Search Bar**: White background with bottom border
- **Content Area**: Gray-50 background (`bg-gray-50`)

### Spacing

- **Category Tabs Container**: `pt-4 pb-4` (padding top/bottom)
- **Horizontal Padding**: `px-6 lg:px-16` (responsive)
- **Page Top Padding**: `pt-20` (accounts for fixed header)

### Borders

- Bottom borders use `border-gray-200` for subtle separation
- Category tabs have `border-b` for visual separation

## Key Features

### 1. Category Filtering

- Clicking a category tab filters businesses in real-time
- "All businesses" shows all items
- Empty state when no businesses match

### 2. Dynamic Title

- Changes based on selected category
- "Today's best deals just for you!" for "All businesses"
- "{Category Name} Businesses" for specific categories

### 3. Responsive Design

- Horizontal scrolling on mobile for category tabs
- Responsive padding (px-6 on mobile, px-16 on desktop)
- Text sizes adjust (text-sm on mobile, text-base on desktop)

## Building Additional Sections

To add more sections below the carousel, add them inside the content area:

```tsx
{
  /* Business Content */
}
<div className="bg-gray-50 min-h-screen">
  {/* First Section: Best Deals */}
  <BusinessBestCarousel businesses={filteredBusinesses} />

  {/* Second Section: Featured Businesses */}
  <div className="py-8 px-4 lg:px-16">
    <h2 className="text-2xl font-semibold mb-6">Featured Businesses</h2>
    {/* Your content here */}
  </div>

  {/* Third Section: New Arrivals */}
  <div className="py-8 px-4 lg:px-16">
    <h2 className="text-2xl font-semibold mb-6">New Arrivals</h2>
    {/* Your content here */}
  </div>
</div>;
```

## Category Tab Customization

The ScrollableCategoryTabs component accepts these props for customization:

```tsx
<ScrollableCategoryTabs
  categories={categories}
  defaultValue="all"
  onChange={(value) => setSelectedCategory(value)}
  containerClassName="pt-4 pb-4" // Container padding
  tabClassName="font-bold" // All tabs
  activeTabClassName="bg-blue-500" // Active tab only
  inactiveTabClassName="bg-gray-100" // Inactive tabs only
/>
```

## Data Flow

1. **Server**: Fetch categories and businesses from `data.ts`
2. **Client**: Receive data as props in `BusinessesContent`
3. **State**: Track selected category with `useState`
4. **Filter**: Calculate filtered businesses with `useMemo`
5. **Render**: Display filtered results in carousel

## Performance Considerations

- **useMemo**: Prevents unnecessary filtering recalculations
- **Server Component**: Initial data fetching on server
- **Client Component**: Only interactive parts are client-side
- **Suspense**: Lazy loading for SearchHeader component

## Next Steps

You can now build additional sections:

1. Add more carousel sections (Featured, New, Popular)
2. Add grid views for different layouts
3. Add pagination for large datasets
4. Add sorting options (price, rating, date)
5. Add more filter options (location, rating, verified)

# Scrollable Category Tabs - Usage Guide

## Overview

The `ScrollableCategoryTabs` component is a reusable, customizable horizontal scrolling tab component with hidden scrollbars. It's perfect for category filters, navigation, and any scenario requiring horizontal tab selection.

## Features

- ✅ Hidden scrollbars (works across all browsers)
- ✅ Smooth scroll to selected tab
- ✅ Fully customizable styling
- ✅ TypeScript support
- ✅ Accessible (ARIA attributes)
- ✅ Touch-friendly scrolling

## Basic Usage

```tsx
import ScrollableCategoryTabs from "@/components/scrollable-category-tabs";

const categories = [
  { label: "All", value: "all" },
  { label: "Technology", value: "tech" },
  { label: "Design", value: "design" },
  { label: "Business", value: "business" },
];

export default function MyPage() {
  return (
    <ScrollableCategoryTabs
      categories={categories}
      defaultValue="all"
      onChange={(value) => console.log("Selected:", value)}
    />
  );
}
```

## Props

| Prop                   | Type                      | Default              | Description                    |
| ---------------------- | ------------------------- | -------------------- | ------------------------------ |
| `categories`           | `CategoryTabItem[]`       | **Required**         | Array of category objects      |
| `defaultValue`         | `string`                  | First category value | Initially selected category    |
| `className`            | `string`                  | `undefined`          | Custom class for outer wrapper |
| `containerClassName`   | `string`                  | `undefined`          | Custom class for container div |
| `tabClassName`         | `string`                  | `undefined`          | Custom class for all tabs      |
| `activeTabClassName`   | `string`                  | `undefined`          | Custom class for active tab    |
| `inactiveTabClassName` | `string`                  | `undefined`          | Custom class for inactive tabs |
| `onChange`             | `(value: string) => void` | `undefined`          | Callback when tab is selected  |

## CategoryTabItem Type

```typescript
type CategoryTabItem = {
  label: string; // Display text
  value: string; // Unique identifier
  count?: number; // Optional count (not currently displayed)
};
```

## Examples

### Example 1: Business Categories (Current Implementation)

```tsx
const businessCategories = [
  { label: "All businesses", value: "all" },
  { label: "Clothing & Fashion", value: "clothing-fashion" },
  { label: "Food & Beverage", value: "food-beverage" },
  { label: "Health & Beauty", value: "health-beauty" },
  { label: "Home & Garden", value: "home-garden" },
];

<ScrollableCategoryTabs categories={businessCategories} defaultValue="all" />;
```

### Example 2: Blog Post Categories

```tsx
const blogCategories = [
  { label: "All Posts", value: "all" },
  { label: "Tutorials", value: "tutorials" },
  { label: "News", value: "news" },
  { label: "Reviews", value: "reviews" },
  { label: "Case Studies", value: "case-studies" },
];

<ScrollableCategoryTabs
  categories={blogCategories}
  defaultValue="all"
  onChange={(value) => filterPosts(value)}
/>;
```

### Example 3: Product Filters

```tsx
const productFilters = [
  { label: "All Products", value: "all" },
  { label: "New Arrivals", value: "new" },
  { label: "Best Sellers", value: "bestsellers" },
  { label: "On Sale", value: "sale" },
  { label: "Featured", value: "featured" },
];

<ScrollableCategoryTabs categories={productFilters} defaultValue="all" />;
```

### Example 4: Custom Styling

```tsx
<ScrollableCategoryTabs
  categories={categories}
  defaultValue="all"
  containerClassName="px-4 lg:px-8"
  tabClassName="font-bold"
  activeTabClassName="bg-blue-500 border-blue-500"
  inactiveTabClassName="bg-gray-100 text-gray-700 hover:bg-gray-200"
/>
```

### Example 5: Without Default Container Padding

```tsx
<ScrollableCategoryTabs
  categories={categories}
  defaultValue="all"
  containerClassName="px-0" // Remove default padding
/>
```

## Default Styling

The component comes with sensible defaults:

- **Active tab**: Green background (`#9ACC23`), white text
- **Inactive tab**: White background, dark text, hover effect
- **Container**: Responsive padding (px-6 on mobile, px-16 on desktop)
- **Tabs**: Rounded-full, medium font weight, smooth transitions

## Browser Support

The scrollbar hiding works on:

- ✅ Chrome/Edge (Webkit)
- ✅ Firefox (scrollbar-width)
- ✅ Safari (Webkit)
- ✅ IE/Old Edge (ms-overflow-style)

## Accessibility

The component includes:

- `role="listbox"` for the container
- `role="option"` for each tab
- `aria-selected` for active state
- `aria-label` for screen readers
- Keyboard focusable with `tabIndex={0}`

## Notes

- The component automatically scrolls the selected tab into view
- Smooth scrolling behavior is enabled by default
- The scrollbar is completely hidden but scrolling still works
- Touch-friendly on mobile devices

# Category Filtering Implementation Guide

## Overview

The scrollable category tabs now filter the entire business page dynamically based on the selected category.

## Architecture

### 1. Server Component (page.tsx)

```tsx
// src/app/businesses/page.tsx
export default async function Businesses() {
  const categories = businessCategories;
  const businesses = featuredBusinesses;

  return (
    <div className="overflow-x-hidden pt-20 bg-gray-50">
      <div className="w-full">
        <NavigationTab />
        <BusinessesContent categories={categories} businesses={businesses} />
        <Suspense fallback={<div className="h-20" />}>
          <SearchHeader context="businesses" />
        </Suspense>
      </div>
    </div>
  );
}
```

### 2. Client Component (businesses-content.tsx)

```tsx
"use client";

export default function BusinessesContent({ categories, businesses }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Filter businesses based on selected category
  const filteredBusinesses = useMemo(() => {
    if (selectedCategory === "all") {
      return businesses;
    }
    // ... filtering logic
  }, [businesses, selectedCategory]);

  return (
    <>
      <ScrollableCategoryTabs
        categories={categories}
        defaultValue="all"
        onChange={(value) => setSelectedCategory(value)}
      />
      <BusinessBestCarousel businesses={filteredBusinesses} />
    </>
  );
}
```

## How It Works

### Step 1: User Clicks Category Tab

When a user clicks on a category tab (e.g., "Dancers"), the `ScrollableCategoryTabs` component triggers the `onChange` callback.

### Step 2: State Update

The `onChange` callback updates the `selectedCategory` state in `BusinessesContent`.

### Step 3: Filtering

The `useMemo` hook recalculates `filteredBusinesses` based on the new `selectedCategory`:

- If "all" is selected, all businesses are shown
- Otherwise, businesses are filtered to match the selected category

### Step 4: Re-render

The `BusinessBestCarousel` component re-renders with the filtered businesses.

## Category Mapping

The filtering uses a category mapping to handle different naming conventions:

```typescript
const categoryMap: Record<string, string[]> = {
  clothing: ["clothing"],
  jewellery: ["jewelry", "jewellery"],
  "art-crafts": ["art-craft", "art-crafts"],
  caterer: ["food-hospitality", "caterer"],
  dancers: ["dancers"],
  "cultural-attire-stylist": ["cultural-attire-stylist"],
  "drummers-cultural-performers": ["drummers-cultural-performers"],
  "toys-games": ["toys-games"],
  "books-magazines": ["books-magazines"],
};
```

This allows for flexible matching between:

- Category tab values (e.g., "jewellery")
- Business category values (e.g., "Jewelry")

## Categories & Sample Businesses

### Available Categories

1. **All businesses** - Shows all businesses
2. **Dancers** - African dance troupes and performers
3. **Cultural Attire Stylist** - Traditional attire styling services
4. **Drummers & Cultural Performers** - Traditional drummers and performers
5. **Clothing** - Fashion and clothing businesses
6. **Jewellery** - Jewelry and accessories
7. **Art & Crafts** - Art and craft businesses
8. **Caterer** - Catering services
9. **Toys & Games** - Toy stores
10. **Books & Magazines** - Literature and publications

### Sample Businesses by Category

**Dancers:**

- African Dance Troupe (id: 7)

**Cultural Attire Stylist:**

- Heritage Attire Styling (id: 8)

**Drummers & Cultural Performers:**

- Djembe Masters (id: 9)

**Clothing:**

- Kente Tailor — Bespoke Mens Wedding Attire (id: 1)

**Jewellery:**

- Beaded Heritage Necklace & Bracelets (id: 2)

**Art & Crafts:**

- Traditional African sculptures (id: 3)
- Authentic African pottery (id: 4)

**Caterer:**

- Mama's African Catering (id: 10)
- African Cuisine Restaurant (id: 5)

**Toys & Games:**

- African Toy Emporium (id: 11)

**Books & Magazines:**

- African Literature Hub (id: 12)

## Empty State

When no businesses match the selected category, an empty state is displayed:

```tsx
{
  filteredBusinesses.length > 0 ? (
    <BusinessBestCarousel businesses={filteredBusinesses} />
  ) : (
    <div className="py-16 px-4 lg:px-16 text-center">
      <p className="text-gray-500 text-lg">
        No businesses found in this category.
      </p>
    </div>
  );
}
```

## Dynamic Title

The carousel title changes based on the selected category:

```tsx
title={
  selectedCategory === "all"
    ? "Today's best deals just for you!"
    : `${categories.find((c) => c.value === selectedCategory)?.label || "Filtered"} Businesses`
}
```

Examples:

- **All businesses**: "Today's best deals just for you!"
- **Dancers**: "Dancers Businesses"
- **Caterer**: "Caterer Businesses"

## Performance Optimization

The filtering uses `useMemo` to prevent unnecessary recalculations:

```typescript
const filteredBusinesses = useMemo(() => {
  // filtering logic
}, [businesses, selectedCategory]);
```

This ensures filtering only happens when:

- The `businesses` array changes
- The `selectedCategory` changes

## Extending to Other Pages

This pattern can be reused for other pages (Events, Communities, etc.):

### Example: Events Page

```tsx
// src/app/events/events-content.tsx
"use client";

export default function EventsContent({ categories, events }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredEvents = useMemo(() => {
    if (selectedCategory === "all") return events;
    return events.filter((event) => {
      const eventCategory = event.category.toLowerCase();
      return eventCategory.includes(selectedCategory.toLowerCase());
    });
  }, [events, selectedCategory]);

  return (
    <>
      <ScrollableCategoryTabs
        categories={categories}
        defaultValue="all"
        onChange={(value) => setSelectedCategory(value)}
      />
      <EventCarousel events={filteredEvents} />
    </>
  );
}
```

## API Integration

When using the API version, the filtering can happen server-side:

```tsx
// src/app/businesses/page.tsx
export default async function Businesses({ searchParams }) {
  const category = searchParams.category || "all";

  // Fetch filtered businesses from API
  const businesses = await fetchBusinesses({ category });

  return <BusinessesContent businesses={businesses} />;
}
```

This approach:

- ✅ Reduces client-side data transfer
- ✅ Improves performance for large datasets
- ✅ Enables server-side caching
- ✅ Better SEO (unique URLs per category)

# Dynamic Category Filtering Guide

## Overview

The category filtering system is now **fully dynamic** and requires no hardcoded mappings. It works automatically with any category values you add to your data.

## How It Works

### 1. Normalization Function

```typescript
const normalizeString = (str: string) =>
  str
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/&/g, "") // Remove ampersands
    .replace(/'/g, ""); // Remove apostrophes
```

This ensures consistent comparison between:

- Category tab values: `"Art & Crafts"` → `"art-crafts"`
- Business categories: `"Art & Crafts"` → `"art-crafts"`

### 2. Flexible Matching

```typescript
return (
  businessCategory === selectedCat || // Exact match
  businessCategory.includes(selectedCat) || // Business contains category
  selectedCat.includes(businessCategory) // Category contains business
);
```

This allows matching even if the strings aren't identical:

- `"clothing"` matches `"clothing"`
- `"jewellery"` matches `"jewellery"` (even if spelled differently)
- `"art-crafts"` matches `"art-crafts"`

## Adding New Categories

### Step 1: Add to Category Tabs (data.ts)

```typescript
export const businessCategories: BusinessCategory[] = [
  { label: "All businesses", value: "all" },
  { label: "Your New Category", value: "your-new-category" },
  // ... other categories
];
```

### Step 2: Add Businesses with That Category

```typescript
{
  id: "13",
  name: "Your Business Name",
  category: "Your New Category",  // Match the label from step 1
  // ... other fields
}
```

### That's It!

No need to update any filtering logic or mappings. The system will automatically:

1. Normalize both values
2. Match them flexibly
3. Filter the results

## Best Practices

### 1. Consistent Naming

Keep category names consistent between tabs and business data:

✅ **Good:**

```typescript
// Category tab
{ label: "Cultural Attire Stylist", value: "cultural-attire-stylist" }

// Business
{ category: "Cultural Attire Stylist" }
```

❌ **Avoid:**

```typescript
// Category tab
{ label: "Cultural Attire Stylist", value: "cultural-attire-stylist" }

// Business
{ category: "Stylist" }  // Too generic, won't match well
```

### 2. Use Descriptive Values

Make category values descriptive and unique:

✅ **Good:**

```typescript
{ label: "Drummers & Cultural Performers", value: "drummers-cultural-performers" }
```

❌ **Avoid:**

```typescript
{ label: "Drummers & Cultural Performers", value: "performers" }  // Too generic
```

### 3. Handle Plurals Consistently

Choose either singular or plural and stick with it:

✅ **Good:**

```typescript
{ label: "Dancers", value: "dancers" }
{ category: "Dancers" }
```

✅ **Also Good:**

```typescript
{ label: "Dancer", value: "dancer" }
{ category: "Dancer" }
```

## Examples

### Example 1: Adding "Photographers" Category

**Step 1:** Add to `businessCategories` in `data.ts`

```typescript
export const businessCategories: BusinessCategory[] = [
  { label: "All businesses", value: "all" },
  { label: "Photographers", value: "photographers" },
  // ... other categories
];
```

**Step 2:** Add businesses with that category

```typescript
{
  id: "13",
  name: "African Moments Photography",
  description: "Professional photography for cultural events",
  category: "Photographers",
  // ... other fields
}
```

**Result:** Clicking "Photographers" tab will show all businesses with `category: "Photographers"`

### Example 2: Adding "Musicians" Category

```typescript
// In businessCategories
{ label: "Musicians", value: "musicians" }

// In featuredBusinesses
{
  id: "14",
  name: "Afrobeat Live Band",
  category: "Musicians",
  // ...
}
```

### Example 3: Complex Category Names

The system handles complex names automatically:

```typescript
// Category tab
{ label: "Hair & Beauty Salons", value: "hair-beauty-salons" }

// Business (any of these will match)
{ category: "Hair & Beauty Salons" }
{ category: "Hair and Beauty Salons" }
{ category: "Hair Beauty Salons" }
```

All normalize to: `"hair-beauty-salons"`

## Matching Logic Examples

### Exact Match

```
Category: "Dancers"
Business: "Dancers"
Normalized: "dancers" === "dancers" ✅
```

### Contains Match

```
Category: "Cultural Attire Stylist"
Business: "Cultural Attire Stylist Services"
Normalized: "cultural-attire-stylist-services".includes("cultural-attire-stylist") ✅
```

### Partial Match

```
Category: "Art & Crafts"
Business: "Art & Crafts"
Normalized: "art-crafts" === "art-crafts" ✅
```

## Troubleshooting

### Issue: Category not filtering correctly

**Check 1:** Verify category names match

```typescript
// Category tab
{ label: "Jewellery", value: "jewellery" }

// Business
{ category: "Jewellery" }  // Should match ✅
```

**Check 2:** Check for typos

```typescript
// Category tab
{ label: "Caterers", value: "caterers" }

// Business
{ category: "Caterer" }  // Won't match exactly ❌
```

**Solution:** Use consistent spelling:

```typescript
{ label: "Caterers", value: "caterers" }
{ category: "Caterers" }  // Matches ✅
```

### Issue: Too many results showing

This happens when category names are too generic:

```typescript
// Too generic
{ label: "Services", value: "services" }

// Will match many businesses
{ category: "Cultural Services" }  // Matches ✅
{ category: "Catering Services" }  // Matches ✅
{ category: "Photography Services" }  // Matches ✅
```

**Solution:** Use specific category names:

```typescript
{ label: "Cultural Services", value: "cultural-services" }
```

## Performance

The filtering uses `useMemo` to optimize performance:

```typescript
const filteredBusinesses = useMemo(() => {
  // Filtering logic
}, [businesses, selectedCategory]);
```

This ensures filtering only runs when:

- The `businesses` array changes
- The `selectedCategory` changes

For large datasets (1000+ businesses), consider:

1. Server-side filtering via API
2. Pagination
3. Virtual scrolling

## Future Enhancements

### 1. Multi-Category Support

Allow businesses to have multiple categories:

```typescript
{
  id: "15",
  name: "Multi-Service Provider",
  categories: ["Catering", "Event Planning"],  // Array instead of string
}
```

### 2. Tag-Based Filtering

Add tags for more granular filtering:

```typescript
{
  id: "16",
  name: "Business Name",
  category: "Catering",
  tags: ["vegan", "halal", "wedding-specialist"],
}
```

### 3. Search Integration

Combine category filtering with search:

```typescript
const filteredBusinesses = businesses.filter((business) => {
  const matchesCategory = /* category logic */;
  const matchesSearch = business.name.includes(searchTerm);
  return matchesCategory && matchesSearch;
});
```

## Summary

✅ **Fully dynamic** - No hardcoded mappings needed  
✅ **Flexible matching** - Handles variations in naming  
✅ **Easy to extend** - Just add categories and businesses  
✅ **Performant** - Uses `useMemo` for optimization  
✅ **Maintainable** - Single source of truth in data.ts

The filtering system will automatically work with any categories you add to your data!

# Multi-Section Filtering Guide

## Overview

The businesses page supports **multiple sections** that are all filtered simultaneously by the category tabs. When a user selects a category, ALL sections on the page update to show only businesses from that category.

## How It Works

### Single Source of Truth

All sections use the same `filteredBusinesses` array:

```tsx
const filteredBusinesses = useMemo(() => {
  if (selectedCategory === "all") {
    return businesses;
  }
  // ... filtering logic
}, [businesses, selectedCategory]);
```

### Multiple Sections

Each section receives the same filtered data:

```tsx
<>
  {/* Section 1 */}
  <BusinessBestCarousel businesses={filteredBusinesses} />

  {/* Section 2 */}
  <ClothingSectionCarousel businesses={filteredBusinesses} />

  {/* Section 3 */}
  <BusinessSection businesses={filteredBusinesses} title="Featured" />
</>
```

## Current Implementation

```tsx
// src/app/businesses/businesses-content.tsx
export default function BusinessesContent({ categories, businesses }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredBusinesses = useMemo(() => {
    // Filtering logic here
  }, [businesses, selectedCategory]);

  return (
    <>
      {/* Category Tabs */}
      <ScrollableCategoryTabs
        categories={categories}
        onChange={(value) => setSelectedCategory(value)}
      />

      {/* All sections use filteredBusinesses */}
      <div className="bg-gray-50 min-h-screen">
        {filteredBusinesses.length > 0 ? (
          <>
            {/* Section 1: Best Deals */}
            <BusinessBestCarousel businesses={filteredBusinesses} />

            {/* Section 2: Clothing */}
            <ClothingSectionCarousel businesses={filteredBusinesses} />

            {/* Add more sections here */}
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </>
  );
}
```

## Adding New Sections

### Method 1: Using the Reusable BusinessSection Component

The easiest way to add a new section:

```tsx
import BusinessSection from "@/components/business/business-section";

// Inside BusinessesContent component
<BusinessSection
  businesses={filteredBusinesses}
  title="New Arrivals"
  showNavigation={true}
/>;
```

**Full Example:**

```tsx
<div className="bg-gray-50 min-h-screen">
  {filteredBusinesses.length > 0 ? (
    <>
      {/* Section 1: Best Deals */}
      <BusinessBestCarousel businesses={filteredBusinesses} />

      {/* Section 2: Clothing */}
      <BusinessSection businesses={filteredBusinesses} title="Clothing" />

      {/* Section 3: Featured */}
      <BusinessSection
        businesses={filteredBusinesses}
        title="Featured Businesses"
      />

      {/* Section 4: New Arrivals */}
      <BusinessSection businesses={filteredBusinesses} title="New Arrivals" />
    </>
  ) : (
    <EmptyState />
  )}
</div>
```

### Method 2: Creating Custom Section Components

For sections with unique layouts:

**Step 1:** Create your component

```tsx
// src/components/business/custom-section.tsx
"use client";
import type { Business } from "@/lib/api";
import { BusinessCard } from "../business-card";

interface CustomSectionProps {
  businesses: Business[];
}

export default function CustomSection({ businesses }: CustomSectionProps) {
  // Don't render if no businesses
  if (businesses.length === 0) return null;

  return (
    <div className="py-8 px-4 lg:px-16">
      <h2 className="text-2xl font-semibold mb-6">Custom Section</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {businesses.map((business) => (
          <BusinessCard key={business.id} business={business} />
        ))}
      </div>
    </div>
  );
}
```

**Step 2:** Use it in businesses-content.tsx

```tsx
import CustomSection from "@/components/business/custom-section";

// Inside render
<CustomSection businesses={filteredBusinesses} />;
```

## Dynamic Section Titles

Make section titles change based on the selected category:

```tsx
<BusinessSection
  businesses={filteredBusinesses}
  title={
    selectedCategory === "all"
      ? "All Clothing"
      : `${
          categories.find((c) => c.value === selectedCategory)?.label
        } - Clothing`
  }
/>
```

**Examples:**

- When "All" is selected: "All Clothing"
- When "Dancers" is selected: "Dancers - Clothing"
- When "Caterer" is selected: "Caterer - Clothing"

## Category-Specific Sections

Show sections only for specific categories:

```tsx
{
  /* Only show clothing section when "all" or "clothing" is selected */
}
{
  (selectedCategory === "all" || selectedCategory === "clothing") && (
    <BusinessSection businesses={filteredBusinesses} title="Clothing" />
  );
}

{
  /* Only show dancers section when "all" or "dancers" is selected */
}
{
  (selectedCategory === "all" || selectedCategory === "dancers") && (
    <BusinessSection businesses={filteredBusinesses} title="Dancers" />
  );
}
```

## Advanced: Sub-Filtering Within Sections

Filter businesses further within a specific section:

```tsx
// Show only verified businesses in this section
<BusinessSection
  businesses={filteredBusinesses.filter((b) => b.verified)}
  title="Verified Businesses"
/>

// Show only businesses with discounts
<BusinessSection
  businesses={filteredBusinesses.filter((b) => b.discount)}
  title="Special Offers"
/>

// Show top-rated businesses
<BusinessSection
  businesses={filteredBusinesses.filter((b) => b.rating >= 4.5)}
  title="Top Rated"
/>
```

## Complete Example: Multiple Sections with Sub-Filtering

```tsx
export default function BusinessesContent({ categories, businesses }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredBusinesses = useMemo(() => {
    // Main category filtering
  }, [businesses, selectedCategory]);

  // Sub-filtered arrays
  const verifiedBusinesses = useMemo(
    () => filteredBusinesses.filter((b) => b.verified),
    [filteredBusinesses]
  );

  const discountedBusinesses = useMemo(
    () => filteredBusinesses.filter((b) => b.discount),
    [filteredBusinesses]
  );

  const topRatedBusinesses = useMemo(
    () => filteredBusinesses.filter((b) => b.rating >= 4.5),
    [filteredBusinesses]
  );

  return (
    <>
      <ScrollableCategoryTabs
        categories={categories}
        onChange={(value) => setSelectedCategory(value)}
      />

      <div className="bg-gray-50 min-h-screen">
        {filteredBusinesses.length > 0 ? (
          <>
            {/* Main Section: Best Deals */}
            <BusinessBestCarousel
              businesses={filteredBusinesses}
              title="Today's Best Deals"
            />

            {/* Section: Special Offers (only if there are discounts) */}
            {discountedBusinesses.length > 0 && (
              <BusinessSection
                businesses={discountedBusinesses}
                title="Special Offers"
              />
            )}

            {/* Section: Top Rated */}
            {topRatedBusinesses.length > 0 && (
              <BusinessSection
                businesses={topRatedBusinesses}
                title="Top Rated"
              />
            )}

            {/* Section: Verified Businesses */}
            {verifiedBusinesses.length > 0 && (
              <BusinessSection
                businesses={verifiedBusinesses}
                title="Verified Businesses"
              />
            )}

            {/* Section: All Businesses */}
            <BusinessSection
              businesses={filteredBusinesses}
              title="All Businesses"
            />
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </>
  );
}
```

## Performance Considerations

### 1. Use useMemo for Sub-Filtering

Always wrap sub-filtering in `useMemo` to avoid recalculating on every render:

```tsx
const verifiedBusinesses = useMemo(
  () => filteredBusinesses.filter((b) => b.verified),
  [filteredBusinesses]
);
```

### 2. Conditional Rendering

Only render sections that have content:

```tsx
{
  verifiedBusinesses.length > 0 && (
    <BusinessSection businesses={verifiedBusinesses} title="Verified" />
  );
}
```

### 3. Component-Level Checks

The `BusinessSection` component already includes a check:

```tsx
if (businesses.length === 0) return null;
```

## Empty State Handling

### Global Empty State

When no businesses match the selected category:

```tsx
{
  filteredBusinesses.length > 0 ? (
    <AllSections />
  ) : (
    <div className="py-16 px-4 lg:px-16 text-center">
      <p className="text-gray-500 text-lg">
        No businesses found in this category.
      </p>
    </div>
  );
}
```

### Section-Level Empty State

Sections automatically hide when they have no businesses:

```tsx
// This section won't render if no verified businesses
<BusinessSection
  businesses={filteredBusinesses.filter((b) => b.verified)}
  title="Verified Businesses"
/>
```

## Testing Checklist

When adding new sections, verify:

- ✅ Section appears when "All" is selected
- ✅ Section filters correctly when a specific category is selected
- ✅ Section hides when no businesses match
- ✅ Section title updates dynamically (if applicable)
- ✅ Navigation buttons work (if using carousel)
- ✅ Mobile responsive layout works
- ✅ Empty state displays correctly

## Common Patterns

### Pattern 1: Featured Section

```tsx
<BusinessSection businesses={filteredBusinesses.slice(0, 8)} title="Featured" />
```

### Pattern 2: Recently Added

```tsx
<BusinessSection
  businesses={filteredBusinesses
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 12)}
  title="Recently Added"
/>
```

### Pattern 3: By Location

```tsx
<BusinessSection
  businesses={filteredBusinesses.filter((b) => b.location.includes("London"))}
  title="London Businesses"
/>
```

### Pattern 4: Premium/Verified

```tsx
<BusinessSection
  businesses={filteredBusinesses.filter((b) => b.verified)}
  title="Verified Businesses"
/>
```

## Summary

✅ **Single filtering logic** - All sections use the same `filteredBusinesses`  
✅ **Automatic updates** - All sections update when category changes  
✅ **Reusable components** - Use `BusinessSection` for quick additions  
✅ **Sub-filtering** - Further filter within sections as needed  
✅ **Performance optimized** - Uses `useMemo` to prevent unnecessary recalculations  
✅ **Empty state handling** - Sections hide when no data matches

The multi-section filtering system ensures a consistent, performant user experience across all sections of the businesses page!

# Business Categories - Data & API Usage

## Overview

Business categories can be fetched from two sources:

1. **Static data** from `data.ts` (current implementation)
2. **API endpoint** from `api.ts` (for dynamic data)

## Current Implementation (Static Data)

### In `data.ts`

```typescript
export type BusinessCategory = {
  label: string;
  value: string;
};

export const businessCategories: BusinessCategory[] = [
  { label: "All businesses", value: "all" },
  { label: "Clothing & Fashion", value: "clothing-fashion" },
  { label: "Food & Beverage", value: "food-beverage" },
  { label: "Health & Beauty", value: "health-beauty" },
  { label: "Home & Garden", value: "home-garden" },
  { label: "Electronics & Gadgets", value: "electronics-gadgets" },
  { label: "Sports & Outdoors", value: "sports-outdoors" },
  { label: "Toys & Games", value: "toys-games" },
  { label: "Books & Magazines", value: "books-magazines" },
  { label: "Art & Crafts", value: "art-crafts" },
  { label: "Jewelry & Watches", value: "jewelry-watches" },
];
```

### Usage in Pages (Static)

```tsx
import { businessCategories } from "@/lib/data";
import ScrollableCategoryTabs from "@/components/scrollable-category-tabs";

export default async function Businesses() {
  const categories = businessCategories;

  return <ScrollableCategoryTabs categories={categories} defaultValue="all" />;
}
```

## Future Implementation (API)

### In `api.ts`

```typescript
export interface BusinessCategory {
  label: string;
  value: string;
}

export async function fetchBusinessCategories(): Promise<BusinessCategory[]> {
  const response = await fetch("/api/categories/businesses", {
    cache: "force-cache",
    next: { revalidate: 3600 }, // Revalidate every hour
  });

  if (!response.ok) {
    throw new Error("Failed to fetch business categories");
  }

  return response.json();
}
```

### Usage in Pages (API)

```tsx
import { fetchBusinessCategories } from "@/lib/api";
import ScrollableCategoryTabs from "@/components/scrollable-category-tabs";

export default async function Businesses() {
  // Fetch categories from API
  const categories = await fetchBusinessCategories();

  return <ScrollableCategoryTabs categories={categories} defaultValue="all" />;
}
```

### With Error Handling

```tsx
import { fetchBusinessCategories } from "@/lib/api";
import { businessCategories } from "@/lib/data";
import ScrollableCategoryTabs from "@/components/scrollable-category-tabs";

export default async function Businesses() {
  let categories = businessCategories; // Fallback to static data

  try {
    // Try to fetch from API
    categories = await fetchBusinessCategories();
  } catch (error) {
    console.error("Failed to fetch categories, using static data:", error);
    // Falls back to static data from data.ts
  }

  return <ScrollableCategoryTabs categories={categories} defaultValue="all" />;
}
```

## API Endpoint Structure

When you create the API endpoint, it should return an array of categories:

### Expected API Response

```json
[
  { "label": "All businesses", "value": "all" },
  { "label": "Clothing & Fashion", "value": "clothing-fashion" },
  { "label": "Food & Beverage", "value": "food-beverage" },
  { "label": "Health & Beauty", "value": "health-beauty" },
  { "label": "Home & Garden", "value": "home-garden" },
  { "label": "Electronics & Gadgets", "value": "electronics-gadgets" },
  { "label": "Sports & Outdoors", "value": "sports-outdoors" },
  { "label": "Toys & Games", "value": "toys-games" },
  { "label": "Books & Magazines", "value": "books-magazines" },
  { "label": "Art & Crafts", "value": "art-crafts" },
  { "label": "Jewelry & Watches", "value": "jewelry-watches" }
]
```

### Creating the API Route

Create a new file: `src/app/api/categories/businesses/route.ts`

```typescript
import { NextResponse } from "next/server";
import { businessCategories } from "@/lib/data";

export async function GET() {
  try {
    // For now, return static data
    // Later, replace with database query
    return NextResponse.json(businessCategories);

    // Future: Fetch from database
    // const categories = await db.categories.findMany({
    //   where: { type: "business" },
    //   select: { label: true, value: true }
    // });
    // return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
```

## Migration Path

1. **Current**: Use static data from `data.ts` ✅
2. **Step 1**: Create API endpoint that returns static data
3. **Step 2**: Update pages to use `fetchBusinessCategories()` from `api.ts`
4. **Step 3**: Connect API endpoint to database
5. **Step 4**: Add caching and revalidation strategies

## Benefits of API Approach

- ✅ Dynamic categories from database
- ✅ Easy to add/remove categories without code changes
- ✅ Centralized category management
- ✅ Can add metadata (counts, icons, descriptions)
- ✅ Supports multiple category types (businesses, events, etc.)

## Other Category Types

You can create similar structures for other entities:

### Event Categories

```typescript
// In data.ts
export const eventCategories: BusinessCategory[] = [
  { label: "All events", value: "all" },
  { label: "Concerts", value: "concerts" },
  { label: "Festivals", value: "festivals" },
  { label: "Workshops", value: "workshops" },
];

// In api.ts
export async function fetchEventCategories(): Promise<BusinessCategory[]> {
  const response = await fetch("/api/categories/events");
  if (!response.ok) throw new Error("Failed to fetch event categories");
  return response.json();
}
```

### Community Categories

```typescript
// In data.ts
export const communityCategories: BusinessCategory[] = [
  { label: "All communities", value: "all" },
  { label: "Professional", value: "professional" },
  { label: "Local Groups", value: "local-groups" },
  { label: "Community Support", value: "community-support" },
];

// In api.ts
export async function fetchCommunityCategories(): Promise<BusinessCategory[]> {
  const response = await fetch("/api/categories/communities");
  if (!response.ok) throw new Error("Failed to fetch community categories");
  return response.json();
}
```

# Custom Sections Guide - Business Page

## Overview

After the "Explore more businesses" button and additional categories, there are three custom sections you need to implement yourself.

## Location

Add your components in `/src/app/businesses/businesses-content.tsx` at **line 152** (marked with comments).

## Section 1: Grow Your Business with Mefie Banner

### Design Elements

- Split layout: Image on left (40%), Content on right (60%)
- Teal/turquoise background on the right side
- White text
- CTA button: "Join as a vendor" (lime green)

### Suggested Component Structure

```tsx
// Create: src/components/business/grow-business-banner.tsx
export default function GrowBusinessBanner() {
  return (
    <div className="rounded-2xl overflow-hidden grid md:grid-cols-2 gap-0 bg-white shadow-lg">
      {/* Left: Image */}
      <div className="relative h-[400px] md:h-auto">
        <img
          src="/images/your-image.jpg"
          alt="Business growth"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right: Content */}
      <div className="bg-[#1E8B8B] p-12 flex flex-col justify-center text-white">
        <h2 className="text-4xl font-bold mb-6">
          Grow Your Business with Mefie
        </h2>
        <p className="text-lg mb-8 opacity-90">
          Join a network of vendors and service providers reaching new audiences
          through Mefie. Showcase your products, connect with customers, and
          expand your business in a thriving digital marketplace.
        </p>
        <button className="bg-[#9ACC23] text-white px-8 py-3 rounded-full font-medium hover:bg-[#8BB91F] transition-colors w-fit">
          Join as a vendor
        </button>
      </div>
    </div>
  );
}
```

### How to Add

```tsx
// In businesses-content.tsx at line 156
<div className="py-12 px-4 lg:px-16">
  <GrowBusinessBanner />
</div>
```

---

## Section 2: Events Showcase

### Design Elements

- Section title: "Events" (left aligned)
- "Explore Events" link (right aligned)
- 3 event cards in a row
- Each card has:
  - Event image
  - Event name: "TGMA 2026"
  - Badge: "Explore" (white)
  - Verified checkmark (green)
  - Description text
  - Location icon + city name
  - Date icon + date range

### Suggested Component Structure

```tsx
// Create: src/components/business/events-showcase.tsx
export default function EventsShowcase() {
  const events = [
    {
      id: 1,
      name: "TGMA 2026",
      image: "/images/event1.jpg",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do e...",
      location: "Memphis",
      dateRange: "Nov 20 - Dec 3, 2025",
      verified: true,
    },
    // Add 2 more events
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold">Events</h2>
        <a
          href="/events"
          className="text-[#9ACC23] font-medium hover:underline"
        >
          Explore Events
        </a>
      </div>

      {/* Events Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-white rounded-xl overflow-hidden shadow-md"
          >
            {/* Event Image */}
            <div className="relative h-48">
              <img
                src={event.image}
                alt={event.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <span className="bg-white px-3 py-1 rounded-full text-sm font-medium">
                  Explore
                </span>
                {event.verified && (
                  <span className="bg-[#9ACC23] w-8 h-8 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
            </div>

            {/* Event Info */}
            <div className="p-4">
              <h3 className="text-xl font-bold mb-2">{event.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{event.description}</p>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{event.location}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{event.dateRange}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### How to Add

```tsx
// In businesses-content.tsx at line 164
<div className="py-12 px-4 lg:px-16">
  <EventsShowcase />
</div>
```

---

## Section 3: Ready to Grow Your Business CTA

### Design Elements

- Dark blue/navy background with decorative circles
- Centered white text
- Large heading: "Ready to Grow Your Business?"
- Subheading text
- CTA button: "List your Business Today" (lime green)

### Suggested Component Structure

```tsx
// Create: src/components/business/ready-to-grow-cta.tsx
export default function ReadyToGrowCTA() {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-[#1E3A5F] p-16 text-center text-white">
      {/* Decorative Background Circles */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#2A4A6F] rounded-full opacity-50 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#2A4A6F] rounded-full opacity-50 translate-x-1/2 translate-y-1/2" />

      {/* Content */}
      <div className="relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Ready to Grow Your Business?
        </h2>
        <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
          Join thousands of African businesses already listed on Mefie Directory
        </p>
        <button className="bg-[#9ACC23] text-white px-10 py-4 rounded-full font-medium text-lg hover:bg-[#8BB91F] transition-colors">
          List your Business Today
        </button>
      </div>
    </div>
  );
}
```

### How to Add

```tsx
// In businesses-content.tsx at line 172
<div className="py-12 px-4 lg:px-16">
  <ReadyToGrowCTA />
</div>
```

---

## Complete Implementation Example

### Step 1: Create Component Files

Create these three files in `src/components/business/`:

- `grow-business-banner.tsx`
- `events-showcase.tsx`
- `ready-to-grow-cta.tsx`

### Step 2: Import in businesses-content.tsx

```tsx
// Add these imports at the top
import GrowBusinessBanner from "@/components/business/grow-business-banner";
import EventsShowcase from "@/components/business/events-showcase";
import ReadyToGrowCTA from "@/components/business/ready-to-grow-cta";
```

### Step 3: Add Components at Line 152

```tsx
{
  /* ========================================
    PLACE YOUR CUSTOM SECTIONS BELOW
    ======================================== */
}

{
  /* Section 1: Grow Your Business with Mefie Banner */
}
<div className="py-12 px-4 lg:px-16">
  <GrowBusinessBanner />
</div>;

{
  /* Section 2: Events Showcase */
}
<div className="py-12 px-4 lg:px-16">
  <EventsShowcase />
</div>;

{
  /* Section 3: Ready to Grow Your Business CTA */
}
<div className="py-12 px-4 lg:px-16">
  <ReadyToGrowCTA />
</div>;
```

---

## Important Notes

### Visibility Rules

These sections should:

- ✅ Show when `selectedCategory === "all"` (viewing all businesses)
- ✅ Show AFTER the expandable categories
- ❌ NOT show when a specific category is filtered

If you want them to show even when filtering, move them outside the `selectedCategory === "all"` conditional block.

### Responsive Design

- Use Tailwind's responsive classes (`md:`, `lg:`)
- Test on mobile, tablet, and desktop
- Ensure images are optimized

### Images

Place your images in:

- `/public/images/business/` for business-related images
- `/public/images/events/` for event images

### Colors Used

- Teal/Turquoise: `#1E8B8B`
- Dark Navy: `#1E3A5F`
- Lime Green (CTA): `#9ACC23`
- White: `#FFFFFF`

---

## Testing Checklist

- [ ] Sections appear after "Explore more businesses" is clicked
- [ ] Sections appear in correct order
- [ ] All buttons are clickable and styled correctly
- [ ] Images load properly
- [ ] Text is readable on all backgrounds
- [ ] Layout is responsive on mobile
- [ ] Sections don't show when filtering by specific category (unless you want them to)

---

## Need Help?

If you need to show these sections even when filtering:

1. Move them outside the `selectedCategory === "all"` block
2. Place them after the closing `</>` of the conditional at line 180
3. They'll then appear for all views

Good luck building these sections! 🚀

# Complete API Implementation Guide

## Overview

The API utility file (`/src/lib/api.ts`) provides **39 comprehensive API functions** covering all backend operations with full TypeScript support.

## Quick Reference

### Authentication (3 functions)

- `login(credentials)` - User login
- `register(data)` - User registration
- `logout(token?)` - User logout

### User Management (3 functions)

- `getCurrentUser(token?)` - Get current user
- `getAllUsers(token?, params?)` - Get all users (admin)
- `updateUser(data, token?)` - Update user profile

### Listings (9 functions)

- `fetchListings(params?)` - Get all listings
- `getMyListings(token?, params?)` - Get user's listings
- `getListing(slug, token?)` - Get single listing
- `createListingProfile(data, token?)` - Create listing
- `updateListing(slug, data, token?)` - Update listing
- `updateListingStatus(slug, status, token?)` - Update status
- `updateListingAddress(slug, address, token?)` - Update address
- `deleteListing(slug, token?)` - Delete listing

### Content Types (3 functions)

- `fetchBusinesses(params?)` - Get businesses
- `fetchEvents(params?)` - Get events
- `fetchCommunities(params?)` - Get communities

### Categories (4 functions)

- `getCategories(token?, params?)` - List categories
- `createCategory(data, token?)` - Create category
- `updateCategory(id, data, token?)` - Update category
- `deleteCategory(id, token?)` - Delete category

### Opening Hours (4 functions)

- `getOpeningHours(listingId, token?)` - Get hours
- `createOpeningHours(listingId, data, token?)` - Create hours
- `updateOpeningHours(id, data, token?)` - Update hours
- `deleteOpeningHours(id, token?)` - Delete hours

### Services (4 functions)

- `getServices(listingId, token?)` - Get services
- `createService(listingId, data, token?)` - Create service
- `updateService(id, data, token?)` - Update service
- `deleteService(id, token?)` - Delete service

### Social Links (4 functions)

- `getSocials(listingId, token?)` - Get social links
- `createSocial(listingId, data, token?)` - Create social
- `updateSocial(id, data, token?)` - Update social
- `deleteSocial(id, token?)` - Delete social

### Search (1 function)

- `search(params?, token?)` - Global search

---

## Implementation Examples

### 1. Authentication - Login Form

**Client Component:**

```typescript
"use client";
import { login } from "@/lib/api";
import { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login({ email, password });
      localStorage.setItem("token", result.token);
      // Redirect to dashboard
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### 2. Fetch Listings - Server Component

```typescript
import { fetchListings } from "@/lib/api";

export default async function ListingsPage({ searchParams }: any) {
  const listings = await fetchListings({
    q: searchParams.q,
    country: searchParams.country,
    page: parseInt(searchParams.page || "1"),
    limit: 12,
  });

  return (
    <div>
      {listings.data.map((listing) => (
        <div key={listing.id}>
          <h3>{listing.name}</h3>
          <p>{listing.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3. Create Listing - Client Component

```typescript
"use client";
import { createListingProfile } from "@/lib/api";

export default function CreateListingForm() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = localStorage.getItem("token");

    try {
      await createListingProfile(
        {
          name: formData.get("name") as string,
          description: formData.get("description") as string,
          category: formData.get("category") as string,
          country: formData.get("country") as string,
          image: formData.get("image") as string,
        },
        token || undefined
      );

      alert("Listing created!");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" required />
      <textarea name="description" placeholder="Description" required />
      <input name="category" placeholder="Category" required />
      <input name="country" placeholder="Country" required />
      <input name="image" placeholder="Image URL" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

### 4. Update Listing

```typescript
"use client";
import { updateListing } from "@/lib/api";

export default function EditListingForm({ slug, currentData }: any) {
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = localStorage.getItem("token");

    try {
      await updateListing(
        slug,
        {
          name: formData.get("name") as string,
          description: formData.get("description") as string,
        },
        token || undefined
      );

      alert("Updated!");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleUpdate}>
      <input name="name" defaultValue={currentData.name} />
      <textarea name="description" defaultValue={currentData.description} />
      <button type="submit">Update</button>
    </form>
  );
}
```

### 5. Delete Listing

```typescript
"use client";
import { deleteListing } from "@/lib/api";

export default function DeleteButton({ slug }: { slug: string }) {
  const handleDelete = async () => {
    if (!confirm("Delete this listing?")) return;

    const token = localStorage.getItem("token");
    try {
      await deleteListing(slug, token || undefined);
      alert("Deleted!");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

### 6. Manage Opening Hours

```typescript
"use client";
import { getOpeningHours, createOpeningHours } from "@/lib/api";
import { useEffect, useState } from "react";

export default function OpeningHoursManager({
  listingId,
}: {
  listingId: string;
}) {
  const [hours, setHours] = useState([]);

  useEffect(() => {
    getOpeningHours(listingId).then(setHours);
  }, [listingId]);

  const addHours = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = localStorage.getItem("token");

    await createOpeningHours(
      listingId,
      {
        day: formData.get("day") as string,
        openTime: formData.get("openTime") as string,
        closeTime: formData.get("closeTime") as string,
      },
      token || undefined
    );

    // Refresh hours
    getOpeningHours(listingId).then(setHours);
  };

  return (
    <div>
      <ul>
        {hours.map((h: any) => (
          <li key={h.id}>
            {h.day}: {h.openTime} - {h.closeTime}
          </li>
        ))}
      </ul>
      <form onSubmit={addHours}>
        <select name="day">
          <option>Monday</option>
          <option>Tuesday</option>
          {/* ... */}
        </select>
        <input name="openTime" type="time" />
        <input name="closeTime" type="time" />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
```

### 7. Manage Services

```typescript
"use client";
import { getServices, createService, deleteService } from "@/lib/api";
import { useEffect, useState } from "react";

export default function ServicesManager({ listingId }: { listingId: string }) {
  const [services, setServices] = useState([]);

  useEffect(() => {
    getServices(listingId).then(setServices);
  }, [listingId]);

  const addService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = localStorage.getItem("token");

    await createService(
      listingId,
      {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        price: parseFloat(formData.get("price") as string),
      },
      token || undefined
    );

    getServices(listingId).then(setServices);
  };

  const handleDelete = async (serviceId: string) => {
    const token = localStorage.getItem("token");
    await deleteService(serviceId, token || undefined);
    getServices(listingId).then(setServices);
  };

  return (
    <div>
      <ul>
        {services.map((s: any) => (
          <li key={s.id}>
            {s.name} - ${s.price}
            <button onClick={() => handleDelete(s.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <form onSubmit={addService}>
        <input name="name" placeholder="Service Name" />
        <textarea name="description" placeholder="Description" />
        <input name="price" type="number" placeholder="Price" />
        <button type="submit">Add Service</button>
      </form>
    </div>
  );
}
```

### 8. Manage Social Links

```typescript
"use client";
import { getSocials, createSocial, deleteSocial } from "@/lib/api";
import { useEffect, useState } from "react";

export default function SocialsManager({ listingId }: { listingId: string }) {
  const [socials, setSocials] = useState([]);

  useEffect(() => {
    getSocials(listingId).then(setSocials);
  }, [listingId]);

  const addSocial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = localStorage.getItem("token");

    await createSocial(
      listingId,
      {
        platform: formData.get("platform") as string,
        url: formData.get("url") as string,
      },
      token || undefined
    );

    getSocials(listingId).then(setSocials);
  };

  return (
    <div>
      <ul>
        {socials.map((s: any) => (
          <li key={s.id}>
            {s.platform}: {s.url}
          </li>
        ))}
      </ul>
      <form onSubmit={addSocial}>
        <select name="platform">
          <option>Facebook</option>
          <option>Twitter</option>
          <option>Instagram</option>
        </select>
        <input name="url" placeholder="URL" />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
```

### 9. Global Search

```typescript
"use client";
import { search } from "@/lib/api";
import { useState } from "react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const data = await search({ q: query });
    setResults(data);
  };

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <button onClick={handleSearch}>Search</button>
      <ul>
        {results.map((r: any) => (
          <li key={r.id}>{r.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## TypeScript Types

All functions are fully typed. Import types from `/src/lib/api.ts`:

```typescript
import type {
  User,
  Listing,
  Business,
  Event,
  Community,
  Category,
  OpeningHours,
  Service,
  Social,
  Address,
  ApiResponse,
  SearchParams,
  AuthCredentials,
  RegisterData,
} from "@/lib/api";
```

---

## Authentication Pattern

Most functions accept an optional `token` parameter for authenticated requests:

```typescript
// Get token from localStorage
const token = localStorage.getItem("token");

// Pass to API function
await updateUser(data, token || undefined);
```

For server components, get token from cookies:

```typescript
import { cookies } from "next/headers";

const cookieStore = cookies();
const token = cookieStore.get("token")?.value;
```

---

## Error Handling

All functions throw errors with descriptive messages:

```typescript
try {
  await createListing(data, token);
} catch (error: any) {
  console.error(error.message); // "Failed to create listing"
  alert(error.message);
}
```

---

## Summary

✅ **39 API functions** covering all operations  
✅ **Full TypeScript support** with interfaces  
✅ **Authentication** built-in with token management  
✅ **Error handling** with descriptive messages  
✅ **Server & Client** component examples  
✅ **CRUD operations** for all resources

The API utility file is production-ready and requires no modifications. Simply update `NEXT_PUBLIC_API_URL` in `.env.local` and start using the functions in your components!

nested (chained) ternary operators are generally discouraged because they are hard to read and scale. If you add a fourth listing type later, that block of code will become very messy and prone to syntax errors.

The best practice in React/JavaScript for this scenario is to use a Configuration Object (Dictionary Pattern). This separates your data (the text) from your logic.
example:
const addressLabel =

listingType === "business" ? "Business Address" : listingType === "event" ? "Event Venue Address" : "Community Address";

const addressPlaceholder =

listingType === "business"

? "Enter business address"

: listingType === "event"

? "Enter event venue address"

: "Enter community address";

const emailLabel =

listingType === "business" ? "Business Email" : listingType === "event" ? "Event Contact Email" : "Community Contact Email";

const phoneLabel =

listingType === "business" ? "Business Phone" : listingType === "event" ? "Event Contact Phone" : "Community Contact Phone";

const subtitle =

listingType === "business"

? "Provide the business details below"

: listingType === "event"

? "Provide the event details below"

: "Provide the community details below";

Best way to write this is to use Configuration Object
example:
// 1. Define the map
const formTextConfig = {
business: {
addressLabel: "Business Address",
addressPlaceholder: "Enter business address",
emailLabel: "Business Email",
phoneLabel: "Business Phone",
subtitle: "Provide the business details below",
},
event: {
addressLabel: "Event Venue Address",
addressPlaceholder: "Enter event venue address",
emailLabel: "Event Contact Email",
phoneLabel: "Event Contact Phone",
subtitle: "Provide the event details below",
},
community: {
addressLabel: "Community Address",
addressPlaceholder: "Enter community address",
emailLabel: "Community Contact Email",
phoneLabel: "Community Contact Phone",
subtitle: "Provide the community details below",
},
};

// 2. Inside your component
export function BusinessDetailsForm({ listingType, form }: Props) {

// 3. Extract the text based on the type
// This automatically selects the correct group of strings
const text = formTextConfig[listingType];

return (
<div>
<h2>{text.subtitle}</h2>

      {/* Usage in form fields */}
      <Label>{text.addressLabel}</Label>
      <Input placeholder={text.addressPlaceholder} {...form.register("address")} />

      {/* ... etc */}
    </div>

);
}

Why is this better?
Readability: You can see exactly what text corresponds to "event" or "community" at a glance without parsing ? : ? : logic.

Scalability: If you need to add a "service" type later, you just add one key to the object. You don't have to touch the component logic.

Performance: The object lookup (config[type]) is faster and cleaner than evaluating multiple conditions every render.
