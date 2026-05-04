import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

async function handleUpdateStatus(
  request: NextRequest,
  listing_slug: string,
) {
  const body = await request.json();
  const authHeader = request.headers.get('Authorization');

  const response = await fetch(
    `${API_BASE_URL}/api/listing/${listing_slug}/update_status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return NextResponse.json(
      { error: errorData.message || 'Failed to update listing status' },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listing_slug: string }> }
) {
  try {
    const { listing_slug } = await params;
    return handleUpdateStatus(request, listing_slug);
  } catch (error) {
    console.error('Error updating listing status:', error);
    return NextResponse.json({ error: 'Failed to update listing status' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ listing_slug: string }> }
) {
  try {
    const { listing_slug } = await params;
    return handleUpdateStatus(request, listing_slug);
  } catch (error) {
    console.error('Error updating listing status:', error);
    return NextResponse.json({ error: 'Failed to update listing status' }, { status: 500 });
  }
}
