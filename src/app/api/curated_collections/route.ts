import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

// Public GET — returns published collections filtered by country
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backendUrl = new URL(`${API_BASE_URL}/api/curated_collections`);
    searchParams.forEach((value, key) => backendUrl.searchParams.set(key, value));

    const response = await fetch(backendUrl.toString(), {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('curated_collections GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Admin POST — create a new collection
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
