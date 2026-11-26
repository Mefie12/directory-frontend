import { NextRequest, NextResponse } from 'next/server';
import { proxyPublicGet } from '@/lib/bff/public-cache';

const API_BASE_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

// Public GET: published collections filtered by country. V2 Phase 5.3c: shared on Vercel's CDN for anonymous
// requests that name a country (lib/bff/public-cache.ts).
export async function GET(request: NextRequest) {
  return proxyPublicGet(request, { path: "curated_collections", countrySensitive: true });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/curated_collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('curated_collections POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
