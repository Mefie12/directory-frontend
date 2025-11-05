# API Integration Guide

## Overview
This project uses Next.js App Router with API routes that act as a proxy to your backend API. This approach provides:

- **Security**: Backend API URL and keys are kept server-side
- **Caching**: Built-in caching with Next.js revalidation
- **SSR Support**: Server-side rendering for better SEO
- **Type Safety**: TypeScript types for all API responses

## Setup

### 1. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-api.com
# API_KEY=your-api-key-if-needed
```

### 2. API Routes Structure

```
src/app/api/
├── listings/route.ts      # GET /api/listings
├── businesses/route.ts    # GET /api/businesses
├── events/route.ts        # GET /api/events
└── communities/route.ts   # GET /api/communities
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
    "Authorization": `Bearer ${process.env.API_KEY}`,
  },
});
```

### Adjust Caching

Modify the `revalidate` value in route handlers:

```typescript
next: { revalidate: 300 } // Cache for 5 minutes
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
