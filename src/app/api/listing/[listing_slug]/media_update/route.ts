import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

async function forwardToBackend(
  request: NextRequest,
  listing_slug: string,
  method: string,
) {
  const authHeader = request.headers.get('Authorization');
  const contentType = request.headers.get('Content-Type') || '';
  const body = await request.arrayBuffer();

  const response = await fetch(
    `${API_BASE_URL}/api/listing/${listing_slug}/media_update`,
    {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': contentType,
        ...(authHeader && { Authorization: authHeader }),
      },
      body,
    },
  );

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json(
      { message: data.message || 'Failed to update media' },
      { status: response.status },
    );
  }
  return NextResponse.json(data);
}

// POST handler — used by the frontend with _method=PATCH for Laravel method spoofing.
// PHP only populates $_FILES for POST requests; PATCH drops file uploads.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listing_slug: string }> },
) {
  try {
    const { listing_slug } = await params;
    return forwardToBackend(request, listing_slug, 'POST');
  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// Keep the PATCH handler for any direct PATCH calls
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listing_slug: string }> },
) {
  try {
    const { listing_slug } = await params;
    return forwardToBackend(request, listing_slug, 'PATCH');
  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}