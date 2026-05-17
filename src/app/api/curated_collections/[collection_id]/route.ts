import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collection_id: string }> }
) {
  try {
    const { collection_id } = await params;
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(`${API_BASE_URL}/api/curated_collections/${collection_id}`, {
      headers: {
        Accept: 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('curated_collections GET single error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ collection_id: string }> }
) {
  try {
    const { collection_id } = await params;
    const authHeader = request.headers.get('Authorization');
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/curated_collections/${collection_id}`, {
      method: 'PUT',
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
    console.error('curated_collections PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ collection_id: string }> }
) {
  try {
    const { collection_id } = await params;
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(`${API_BASE_URL}/api/curated_collections/${collection_id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (response.status === 204) return new NextResponse(null, { status: 204 });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('curated_collections DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
