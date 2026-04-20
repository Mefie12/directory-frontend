# Mefie Directory — Frontend Architecture

This document explains how the directory frontend (Next.js 15 + React) is structured, why certain patterns were chosen, and where we can go next.

---

## 1. High-level layout

```
src/
├── app/                             # Next.js App Router (pages + route handlers)
│   ├── api/                         # Server-side proxy routes → Laravel backend
│   │   ├── businesses/route.ts
│   │   ├── events/route.ts
│   │   ├── communities/route.ts
│   │   ├── listings_by_geolocation/route.ts
│   │   └── ...
│   ├── businesses/
│   │   ├── businesses-content.tsx   # ~95 lines — page configuration
│   │   └── map-business.ts          # ApiListing → ProcessedBusiness
│   ├── events/
│   │   ├── events-content.tsx
│   │   └── map-event.ts
│   └── communities/
│       ├── community-content.tsx
│       └── map-community.ts
│
├── components/
│   ├── directory/
│   │   └── directory-page-shell.tsx # Generic shell: tabs + search + hero +
│   │                                # groups + paginated grid + CTA slots
│   └── ...                          # Cards, carousels, UI primitives
│
├── lib/
│   ├── directory/
│   │   ├── types.ts                 # ApiImage, ApiCategory, ApiListing, …
│   │   ├── image-utils.ts           # getImageUrl, processImages, formatDateTime
│   │   └── use-directory-listings.ts# Generic data hook (fetch + map + state)
│   └── api.ts                       # Thin wrappers for auth/bookmark/etc. APIs
│
├── context/                         # React Context providers (auth, bookmark)
├── types/                           # Shared cross-page TS types
└── hooks/                           # Other reusable hooks
```

---

## 2. Data flow: request → screen

```
┌──────────────┐   fetch("/api/events?q=...")  ┌────────────────────────┐
│  Browser     │ ─────────────────────────────▶│  Next.js route handler │
│ (React page) │                               │  src/app/api/events    │
└──────────────┘◀────────────────────────────  │   /route.ts            │
        ▲          JSON (normalised)           └───────────┬────────────┘
        │                                                  │ fetch(…)
        │                                                  ▼
        │                                       ┌────────────────────────┐
        │                                       │  Laravel API           │
        │                                       │  https://me-fie.co.uk  │
        │                                       └────────────────────────┘
        │
        │ 1. `useDirectoryListings({ endpoint, mapItem })` fires the fetch,
        │    handles loading/error/cancellation, maps each raw item.
        │ 2. `<DirectoryPageShell>` consumes the mapped items, owns tab
        │    state, grouping, pagination, skeleton and empty state.
        │ 3. The page component declares only *what* to render via render
        │    props (hero carousel, group carousel, card, CTAs).
```

---

## 3. Why we proxy API calls through Next.js route handlers

Every call to the Laravel backend goes through a server-side route under `src/app/api/*/route.ts`. This is deliberate.

### 3.1 Hide the backend URL & keep env vars server-side

`NEXT_PUBLIC_*` env vars are inlined into the client bundle. If the frontend called the backend directly, the backend host would leak into shipped JS and could not be swapped per environment without a rebuild. The `API_URL` used by proxies is a **private** (non-`NEXT_PUBLIC_`) variable that can be changed in Vercel without touching a single client file.

### 3.2 Avoid CORS headaches

Browser → `same-origin/api/events` → no CORS preflight.
Server (Next.js) → `https://me-fie.co.uk/api/events` → server-to-server call, no CORS at all.

Before proxying, the backend would have needed to whitelist every Vercel preview subdomain (`*.vercel.app`, branch deploys, etc.) — fragile and error-prone.

### 3.3 Normalise upstream errors

Laravel occasionally returns HTML error pages (Cloudflare 502, nginx 503, generic 5xx). Our proxy reads the response as text first, attempts `JSON.parse`, and returns a **structured JSON error** to the client on failure:

```ts
// src/app/api/businesses/route.ts (abridged)
const rawText = await response.text();
let data: unknown;
try { data = JSON.parse(rawText); }
catch {
  return NextResponse.json(
    { message: "Upstream returned non-JSON response",
      upstreamStatus: response.status,
      upstreamBody: rawText.slice(0, 500),
      backendUrl: backendUrl.toString() },
    { status: 502 },
  );
}
```

This means the UI never has to handle `"Unexpected token <"` JSON-parse crashes, and we get actionable diagnostics in the Network tab.

### 3.4 A single place to inject headers / auth / observability

The proxy forwards the `Authorization` header from the browser when present, but it's also the natural place to add:
- API keys or server-only tokens
- Request logging / tracing / metrics
- Rate limiting
- Response shape adjustments (e.g. field renaming during a backend migration)

### 3.5 Enrich requests with server-only data

Example: the geolocation endpoint at `@/Users/gideonkorblahoenyefia/Desktop/Kobby/MyProjects/me-fie-directory/src/app/api/listings_by_geolocation/route.ts` pulls the client IP from `x-forwarded-for` and forwards it to the backend so it can geolocate. The browser cannot easily obtain its own public IP, but the server always has it.

---

## 4. The directory page abstraction

Four files, one pattern, three directory pages (`/businesses`, `/events`, `/communities`) and room for more.

### 4.1 `lib/directory/types.ts`

The canonical shape of a raw listing returned by the backend: `ApiListing`, `ApiCategory`, `ApiImage`, `ApiListingsResponse<T>`, and the union `DirectoryEndpoint`. Page-specific "processed" shapes (e.g. `ProcessedBusiness`) live next to their mappers.

### 4.2 `lib/directory/image-utils.ts`

Pure helpers with no React dependencies, easy to unit-test:

- `getImageUrl(url)` — resolves a relative media path against `NEXT_PUBLIC_API_URL` or returns the fallback placeholder.
- `processImages(images, fallbacks)` — filters out images with bad processing statuses, maps to absolute URLs, and guarantees a non-empty array by using provided fallbacks (`item.image`, `item.cover_image`, placeholder).
- `formatDateTime(iso)` — `"TBA"` on invalid, otherwise `"Apr 20, 2026"`.

### 4.3 `lib/directory/use-directory-listings.ts`

Generic data hook. The core contract:

```ts
const { items, isLoading, error, detectedCountry, refetch } =
  useDirectoryListings<ProcessedBusiness>({
    endpoint: "/api/businesses",
    mapItem: mapBusiness,
    forwardParams: ["q", "country", "category_id"], // defaults
    perPage: 100,
    extraParams: { event_start_date, event_end_date },
  });
```

Key responsibilities:
- Read filter values from `useSearchParams`.
- Build the query string and call the proxy endpoint.
- Cancel in-flight requests when params change (`AbortController`).
- Parse the envelope, map each item through `mapItem` (which can return `null` to skip).
- Track `isLoading`, `error`, `detectedCountry`, and expose `refetch`.

Because it's generic, every directory page gets the same semantics for free.

### 4.4 `components/directory/directory-page-shell.tsx`

The shared UI shell. It owns:
- Category tab state (`ScrollableCategoryTabs`).
- Client-side grouping and category filtering (via `groupBy`, `matchesCategory` props).
- The skeleton and empty state.
- The paginated grid (see §4.5).
- Slots for hero, group carousels, filtered view, mid banner, footer CTA — all provided via render props.

A page component is reduced to configuration:

```tsx
// src/app/businesses/businesses-content.tsx (abridged)
<DirectoryPageShell<ProcessedBusiness>
  mainCategorySlug="business"
  context="businesses"
  items={items}
  isLoading={isLoading}
  detectedCountry={detectedCountry}
  groupBy={(b) => b.category}
  matchesCategory={(b, slug) => b.categorySlugs.includes(slug)}
  heroSize={8}
  visibleGroups={3}
  emptyMessage="No businesses found in this category."
  gridTitle="All businesses"
  renderHero={...}
  renderGroup={...}
  renderFiltered={...}
  renderCard={(b) => <BusinessCard business={adapt(b)} />}
  renderFooterCta={...}
/>
```

### 4.5 Paginated grid ("Show more")

Inside the shell, `<PaginatedGrid>` shows a responsive grid (1/2/3/4 columns at sm/md/lg/xl) with:
- `initialGridCount = 12` cards initially.
- `gridLoadMoreStep = 8` more per "Show more" click.
- Auto-hides the button when the visible count catches up to the list length.
- Resets to initial when the selected category tab or the underlying items change (implemented via a React `key` so the component remounts — no effect-based resets needed).

### 4.6 Per-page mappers

Each page has a small, pure function (or factory) that converts a raw `ApiListing` to the page's display type:

```ts
// src/app/businesses/map-business.ts
export function mapBusiness(item: ApiListing): ProcessedBusiness { … }

// src/app/events/map-event.ts — factory so we can close over filterCountry
export function createEventMapper(filterCountry?: string | null) {
  return function mapEvent(item: ApiListing): ProcessedEvent | null { … };
}
```

Because they're just functions, they're trivial to unit-test without React or fetch.

---

## 5. Adding a new directory type

Adding `/api/products` (example):

1. Add `"/api/products"` to the `DirectoryEndpoint` union in `@/Users/gideonkorblahoenyefia/Desktop/Kobby/MyProjects/me-fie-directory/src/lib/directory/types.ts`.
2. Create a proxy route `src/app/api/products/route.ts` — copy `src/app/api/businesses/route.ts` and rename the upstream path.
3. Create `src/app/products/map-product.ts` defining `ProcessedProduct` and `mapProduct(item)`.
4. Create `src/app/products/products-content.tsx` — ~50 lines of `<DirectoryPageShell>` config.

Everything else (fetch, filters, loading, skeleton, pagination, empty state) comes for free.

---

## 6. Current tradeoffs and known limitations

1. **Manual fetch/state management.** The hook uses `useState` + `useEffect` + `AbortController`. No caching between tab switches, no stale-while-revalidate, no automatic retry or dedup. Going to a page and back re-fetches.
2. **Loose typing at component boundaries.** `BusinessSection` expects the legacy `Business` shape from `@/lib/api` (`image: string[]`). We adapt via `any`. This is a historical mismatch that could be fixed by unifying the display types.
3. **No request deduplication.** Two components on the same page asking for the same data will each fire a fetch.
4. **No optimistic UI or mutations layer.** Bookmarks, "claim", etc. each build their own fetch logic.
5. **Auth token lives in `localStorage` and is forwarded manually.** There's no single HTTP client; each call site re-attaches the `Authorization` header.
6. **Search params are the single source of truth for filters.** Works well for link-sharing and back/forward, but there's no derived cache keyed by those params.

---

## 7. Future improvements

### 7.1 TanStack Query (react-query) — the biggest single win

Replacing the custom `useDirectoryListings` with a Query hook gives us, essentially for free:

- **Automatic caching** keyed by `[endpoint, params]` — tab → back → instant render from cache while a background revalidate fetch runs.
- **Deduplication** — two components requesting the same data fire one fetch.
- **Stale-while-revalidate** with configurable `staleTime` / `gcTime`.
- **Background refetch** on window focus / reconnect.
- **Retry with exponential backoff** for transient 5xx.
- **Parallel & dependent queries**, `useQueries`, `useInfiniteQuery` for real pagination.
- **Mutations** with optimistic updates + rollback, replacing handwritten fetches for bookmarks/claims/ratings.
- **Devtools** for inspecting the cache in development.

Sketch:

```ts
// src/lib/directory/use-directory-listings.ts (hypothetical)
export function useDirectoryListings<T>({ endpoint, mapItem }: Options<T>) {
  const searchParams = useSearchParams();
  const params = buildParams(searchParams);
  return useInfiniteQuery({
    queryKey: [endpoint, Object.fromEntries(params)],
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get<ApiListingsResponse>(endpoint, { params: { ...Object.fromEntries(params), page: pageParam } }),
    getNextPageParam: (last) => last.links.next ? last.meta.current_page + 1 : undefined,
    select: (data) => ({
      pages: data.pages.map((p) => p.data.map(mapItem).filter(Boolean)),
    }),
  });
}
```

With `useInfiniteQuery`, the "Show more" button just calls `fetchNextPage()` — server-side pagination instead of slicing an in-memory array.

### 7.2 Axios (or `ky`) as a single HTTP client

A tiny wrapper that:
- Sets `baseURL`, common headers, timeout.
- Uses **request interceptors** to inject the `Authorization` header from the auth context once, instead of at every call site.
- Uses **response interceptors** to surface 401 → redirect to login, and to unwrap the `{ data }` envelope into plain items.
- Plays nicely with TanStack Query (`queryFn: ({ signal }) => apiClient.get(url, { signal })`).

```ts
// src/lib/api-client.ts (sketch)
export const apiClient = axios.create({ baseURL: "/api", timeout: 15000 });

apiClient.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("authToken");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

apiClient.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) window.location.href = "/auth/login";
    return Promise.reject(err);
  },
);
```

### 7.3 Zustand for global UI state

Small, hook-based global store. Good fits:
- Auth state (replacing parts of `context/auth-context`) — selectors reduce re-renders compared to Context.
- Bookmark set — a Zustand store with a persistence middleware syncing to `localStorage` would replace the hand-rolled `bookmark-context`.
- UI state that needs to cross page boundaries (e.g. a global command palette, toast queue overrides, onboarding progress).

Keep server state in **TanStack Query**; keep UI state in **Zustand**. Don't conflate the two.

### 7.4 Zod (or Valibot) for runtime validation

Right now, `ApiListing` is a TS `interface` — a compile-time promise. If the backend changes a field name, TS is happy but the UI silently breaks.

Define schemas once, derive TS types from them, and validate at the proxy boundary:

```ts
import { z } from "zod";
export const ApiListing = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  images: z.array(z.union([z.string(), z.object({ media: z.string() })])),
  // …
});
export type ApiListing = z.infer<typeof ApiListing>;

// In the proxy, after JSON.parse:
const parsed = ApiListingsResponse.safeParse(data);
if (!parsed.success) return NextResponse.json({ message: "Schema drift", issues: parsed.error.issues }, { status: 502 });
```

Catches backend contract drift immediately and gives an actionable error.

### 7.5 OpenAPI codegen

If the Laravel app can emit an OpenAPI spec (via `scribe`, `l5-swagger`, etc.), tools like `openapi-typescript` or `orval` can generate:
- TS types for every endpoint — no more hand-maintained `ApiListing`.
- Ready-made TanStack Query hooks.
- Request/response validators.

One command regenerates everything when the backend changes.

### 7.6 Error boundaries + React Suspense

Wrap each page in a route-level error boundary so a throw in `mapItem` or `renderCard` shows a recovery UI instead of a blank screen. Once on TanStack Query v5 + React 19, we can use the `suspense: true` option and hand off loading orchestration to `<Suspense>` + `<ErrorBoundary>`, removing the `isLoading` / `error` ternaries from pages.

### 7.7 Testing strategy

- **Unit:** `mapBusiness`, `mapEvent`, `mapCommunity`, `processImages`, `formatDateTime` — pure functions, vitest + fixtures. Fast and high-value.
- **Hook:** `useDirectoryListings` with `@testing-library/react` and `msw` (mock service worker) stubbing the proxy endpoints.
- **Integration:** Render a page with a mocked proxy, assert "show more" pagination, tab filtering, empty state.
- **E2E:** Playwright on preview deployments hitting the real staging backend, covering login, verify OTP, claim flow.

### 7.8 Observability

- **Sentry** (or similar) on both the Next.js server (proxy errors) and client (render errors). The proxy already returns structured error bodies — wire those into Sentry breadcrumbs.
- **Vercel Analytics / Web Vitals** for real-user performance tracking.

### 7.9 Performance hygiene

- Stop bundling the full icon set where we only need a few — prefer `lucide-react` tree-shaking or per-icon imports.
- Replace `<Image unoptimized />` with `next/image` where possible so CDN resizing kicks in.
- Consider server components for the shell scaffolding (`SearchHeader`, tabs) and keep only the interactive parts client-side.

---

## 8. Quick reference

| Concern                               | Location                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------ |
| Shared types for listings             | `src/lib/directory/types.ts`                                             |
| Image / date helpers                  | `src/lib/directory/image-utils.ts`                                       |
| Generic fetch hook                    | `src/lib/directory/use-directory-listings.ts`                            |
| Page shell (tabs, groups, pagination) | `src/components/directory/directory-page-shell.tsx`                      |
| Per-page mappers                      | `src/app/{businesses,events,communities}/map-*.ts`                       |
| Per-page configuration                | `src/app/{businesses,events,communities}/*-content.tsx`                  |
| Proxy routes                          | `src/app/api/{businesses,events,communities,listings_by_geolocation}/route.ts` |
| Auth context                          | `src/context/auth-context.tsx`                                           |
| Misc API wrappers                     | `src/lib/api.ts`                                                         |

---

## 9. Decision log

- **Server-side proxies over direct browser calls** — chosen to avoid CORS, keep `API_URL` out of the client bundle, normalise upstream errors, and centralise auth header forwarding.
- **Generic hook + render-prop shell instead of a deep component hierarchy** — each page stays declarative (~50 lines) without boxing us into a single layout; any page can still render whatever JSX it wants via the render props.
- **Client-side grouping from a flat `items` list** — the backend returns a flat paginated list; grouping by category is a presentation concern, cheap in memory, and trivially swappable when we move to server-side pagination with TanStack Query.
- **Pagination state inside `PaginatedGrid` (component-local) + `key` for reset** — avoids the `setState-in-useEffect` anti-pattern and makes reset semantics obvious at the call site.
