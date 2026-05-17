import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ collection_id: string; item_id: string }> }
) {
  try {
    const { collection_id, item_id } = await params;
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(
      `${API_BASE_URL}/api/curated_collections/${collection_id}/items/${item_id}`,
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
      }
    );

    if (response.status === 204) return new NextResponse(null, { status: 204 });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('collection item DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
