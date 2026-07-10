import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ faq_slug: string }> }
) {
  try {
    const { faq_slug } = await params;
    const authHeader = request.headers.get('Authorization');
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/admin/faqs/${faq_slug}`, {
      method: 'PUT',
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
        { error: errorData.message || 'Failed to update FAQ' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return NextResponse.json({ error: 'Failed to update FAQ' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ faq_slug: string }> }
) {
  try {
    const { faq_slug } = await params;
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(`${API_BASE_URL}/api/admin/faqs/${faq_slug}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to delete FAQ' },
        { status: response.status }
      );
    }

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 });
  }
}
