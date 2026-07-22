import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listing_slug: string; event_slug: string }> }
) {
  try {
    const { listing_slug, event_slug } = await params;
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(
      `${API_BASE_URL}/api/listing/${listing_slug}/event/${event_slug}/ticket-types`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch ticket types' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching ticket types:', error);
    return NextResponse.json({ error: 'Failed to fetch ticket types' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listing_slug: string; event_slug: string }> }
) {
  try {
    const { listing_slug, event_slug } = await params;
    const authHeader = request.headers.get('Authorization');
    const body = await request.json();

    const response = await fetch(
      `${API_BASE_URL}/api/listing/${listing_slug}/event/${event_slug}/ticket-types`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to create ticket type' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating ticket type:', error);
    return NextResponse.json({ error: 'Failed to create ticket type' }, { status: 500 });
  }
}
