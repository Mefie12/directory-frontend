import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('Authorization');

    // Forward all query params (page, limit, search, listing_slug, etc.)
    const backendUrl = new URL(`${API_BASE_URL}/api/vendor_ratings`);
    searchParams.forEach((value, key) => backendUrl.searchParams.set(key, value));

    const response = await fetch(
      backendUrl.toString(),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch vendor ratings' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('Error fetching vendor ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor ratings' },
      { status: 500 }
    );
  }
}