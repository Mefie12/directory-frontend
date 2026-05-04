import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendor_slug?: string }> }
) {
  try {
    const { vendor_slug } = await params;
    const { searchParams } = new URL(request.url);
    const listingSlug = searchParams.get('listing_slug') || vendor_slug;
    
    if (!listingSlug) {
      return NextResponse.json(
        { error: 'Vendor slug is required' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('Authorization');

    const response = await fetch(
      `${API_BASE_URL}/api/vendor_ratings?listing_slug=${encodeURIComponent(listingSlug)}`,
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