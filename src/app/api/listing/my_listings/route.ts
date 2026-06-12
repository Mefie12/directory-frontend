import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const { searchParams } = new URL(request.url);
    const upstreamParams = new URLSearchParams();
    upstreamParams.set('page', searchParams.get('page') || '1');
    upstreamParams.set('per_page', searchParams.get('per_page') || '10');
    const cursor = searchParams.get('cursor');
    if (cursor) upstreamParams.set('cursor', cursor);
    const queryString = upstreamParams.toString();

    const response = await fetch(
      `${API_BASE_URL}/api/listing/my_listings?${queryString}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch my listings' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching my listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch my listings' },
      { status: 500 }
    );
  }
}
