import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ ticket_type_slug: string }> }
) {
  try {
    const { ticket_type_slug } = await params;
    const authHeader = request.headers.get('Authorization');
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/ticket-types/${ticket_type_slug}`, {
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
        { error: errorData.message || 'Failed to update ticket type' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating ticket type:', error);
    return NextResponse.json({ error: 'Failed to update ticket type' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ticket_type_slug: string }> }
) {
  try {
    const { ticket_type_slug } = await params;
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(`${API_BASE_URL}/api/ticket-types/${ticket_type_slug}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to delete ticket type' },
        { status: response.status }
      );
    }

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error deleting ticket type:', error);
    return NextResponse.json({ error: 'Failed to delete ticket type' }, { status: 500 });
  }
}
