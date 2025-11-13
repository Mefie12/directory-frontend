import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://me-fie.co.uk/';

export async function GET(request: NextRequest) {
  try {
    // const searchParams = request.nextUrl.searchParams;
    const authHeader = request.headers.get('Authorization');

    // Build query string
    // const params = new URLSearchParams();
    // searchParams.forEach((value, key) => {
    //   params.append(key, value);
    // });

    const response = await fetch(
      `${API_BASE_URL}/api/all_users`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch users' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
