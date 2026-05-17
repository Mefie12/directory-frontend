import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collection_id: string }> }
) {
  try {
    const { collection_id } = await params;
    const authHeader = request.headers.get('Authorization');
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/curated_collections/${collection_id}/items`, {
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
    console.error('collection items POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
