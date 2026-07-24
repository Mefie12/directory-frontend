import type { Metadata } from "next";

interface ListingSocialPreview {
  title: string;
  description: string;
  image_url: string;
  canonical_url: string;
  type: string;
  indexable: boolean;
}

/**
 * Builds page-specific social sharing metadata for a public listing route.
 * Runs on the server inside `generateMetadata()`, so it fetches the Laravel
 * API directly rather than through the internal BFF `/api` proxy — that
 * proxy exists to keep secrets/headers off the browser, which doesn't apply
 * to a server-only call, and going through it here would just add a
 * redundant self-referential HTTP hop (same reasoning already applied by
 * universal-slug-page.tsx's own direct-to-Laravel fetch for this endpoint).
 */
export async function buildListingMetadata(slug: string): Promise<Metadata> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

  try {
    const response = await fetch(`${API_URL}/api/listing/${slug}/social-preview`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!response.ok) return {};

    const data: ListingSocialPreview = await response.json();

    return {
      title: data.title,
      description: data.description,
      alternates: { canonical: data.canonical_url },
      robots: data.indexable ? undefined : { index: false, follow: false },
      openGraph: {
        title: data.title,
        description: data.description,
        url: data.canonical_url,
        siteName: "Me-fie Directory",
        type: "website",
        images: [{ url: data.image_url, alt: data.title }],
      },
      twitter: {
        card: "summary_large_image",
        title: data.title,
        description: data.description,
        images: [data.image_url],
      },
    };
  } catch {
    // API failure — fall back to the root layout's static site-wide metadata
    // rather than risk missing or malformed tags on the shared page.
    return {};
  }
}
