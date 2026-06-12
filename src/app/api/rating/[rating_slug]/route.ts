import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rating_slug: string }> },
) {
  try {
    const { rating_slug } = await params;
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(`${API_BASE_URL}/api/rating/${rating_slug}`, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to fetch review' },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch review' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ rating_slug: string }> },
) {
  try {
    const { rating_slug } = await params;
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(`${API_BASE_URL}/api/rating/${rating_slug}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.message || 'Failed to delete review' },
        { status: response.status },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
