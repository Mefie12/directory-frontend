import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(
      `${API_BASE_URL}/api/listing/my_listings`,
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
