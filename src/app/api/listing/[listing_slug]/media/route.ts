import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_URL || 'https://me-fie.co.uk/';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listing_slug: string }> }
) {
  try {
    const { listing_slug } = await params;
    const authHeader = request.headers.get('Authorization');

    // Forward the multipart form data as-is
    const body = await request.arrayBuffer();
    const contentType = request.headers.get('Content-Type') || '';

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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to upload media' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    );
  }
}
