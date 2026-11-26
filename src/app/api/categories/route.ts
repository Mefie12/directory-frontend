import { NextRequest, NextResponse } from 'next/server';
import { proxyPublicGet } from '@/lib/bff/public-cache';

const API_BASE_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

// Public category taxonomy. V2 Phase 5.3c (owner decision 2026-11-26): anonymous requests may be shared on
// Vercel's CDN for 60 seconds (+ stale-while-revalidate), which overrides the no-store rule of
// md files/V1-category-taxonomy-lifecycle-cache-PRD.md §15.4 for this PUBLIC READ route only. Laravel's
// versioned CategoryCache still gives immediate consistency at the origin, signed-in callers and errors are never
// shared, and the admin category screens read uncached admin endpoints.
export async function GET(request: NextRequest) {
  return proxyPublicGet(request, { path: "categories" });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const contentType = request.headers.get('Content-Type') || '';

    // Forward FormData as-is for file uploads; fall back to JSON for plain requests
    let forwardBody: BodyInit;
    const forwardHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...(authHeader && { Authorization: authHeader }),
    };

    if (contentType.includes('multipart/form-data')) {
      forwardBody = await request.formData();
      // Do NOT set Content-Type — fetch adds it with the correct boundary automatically
    } else {
      forwardBody = JSON.stringify(await request.json());
      forwardHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'POST',
      headers: forwardHeaders,
      body: forwardBody,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to create category', ...errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
