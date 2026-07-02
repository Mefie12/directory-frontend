import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ service_id: string }> }
) {
  try {
    const { service_id } = await params;
    const authHeader = request.headers.get('Authorization');
    const contentType = request.headers.get('content-type') || '';

    let upstreamBody: BodyInit;
    const upstreamHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...(authHeader && { Authorization: authHeader }),
    };

    if (contentType.includes('multipart/form-data')) {
      // Forward FormData as-is (browser sets correct boundary)
      upstreamBody = await request.formData();
    } else {
      const json = await request.json();
      upstreamBody = JSON.stringify(json);
      upstreamHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(
      `${API_BASE_URL}/api/service/${service_id}`,
      {
        method: 'PUT',
        headers: upstreamHeaders,
        body: upstreamBody,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to update service' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ service_id: string }> }
) {
  try {
    const { service_id } = await params;
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(
      `${API_BASE_URL}/api/service/${service_id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to delete service' },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}
