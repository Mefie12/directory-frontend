import { NextRequest, NextResponse } from 'next/server';

// Ensure there is no trailing slash here to avoid double slashes in the fetch
const API_BASE_URL = (process.env.API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listing_slug: string }> }
) {
  try {
    const { listing_slug } = await params;
    const authHeader = request.headers.get('Authorization');
    const contentType = request.headers.get('Content-Type') || '';

    // Forward the multipart form data
    const body = await request.arrayBuffer();

    const response = await fetch(
      `${API_BASE_URL}/api/listing/${listing_slug}/media`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': contentType,
          ...(authHeader && { Authorization: authHeader }),
        },
        body: body,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to upload media' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}