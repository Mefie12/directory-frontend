import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listing_slug: string }> }
) {
  try {
    const { listing_slug } = await params;
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(
      `${API_BASE_URL}/api/listing/${listing_slug}/new_listing_mail`,
      {
        method: 'POST',
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
        { error: errorData.message || 'Failed to send listing email' },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error sending new listing mail:', error);
    return NextResponse.json(
      { error: 'Failed to send listing email' },
      { status: 500 }
    );
  }
}
