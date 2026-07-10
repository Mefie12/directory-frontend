import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('Authorization');

    const backendUrl = new URL(`${API_BASE_URL}/api/admin/faqs`);
    searchParams.forEach((value, key) => backendUrl.searchParams.set(key, value));

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch FAQs' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/admin/faqs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to create FAQ' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 });
  }
}
