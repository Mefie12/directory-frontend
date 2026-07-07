import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listing_slug: string }> }
) {
  try {
    const { listing_slug } = await params;
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(`${API_BASE_URL}/api/listings/${listing_slug}/services`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listing_slug: string }> }
) {
  try {
    const { listing_slug } = await params;
    const authHeader = request.headers.get('Authorization');
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/listings/${listing_slug}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ listing_slug: string }> }
) {
  try {
    const { listing_slug } = await params;
    const authHeader = request.headers.get('Authorization');
    const contentType = request.headers.get('content-type') || '';

    let upstreamBody: BodyInit;
    const upstreamHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...(authHeader && { Authorization: authHeader }),
    };

    if (contentType.includes('multipart/form-data') || contentType.includes('application/octet-stream') || contentType.includes('image/')) {
      // Raw file upload from S3-style presigned PUT
      upstreamBody = await request.arrayBuffer();
      upstreamHeaders['Content-Type'] = contentType;
    } else {
      const json = await request.json();
      upstreamBody = JSON.stringify(json);
      upstreamHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}/api/listings/${listing_slug}/services`, {
      method: 'PUT',
      headers: upstreamHeaders,
      body: upstreamBody,
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error uploading to service:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
