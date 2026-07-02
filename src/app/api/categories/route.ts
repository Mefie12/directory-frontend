import { NextRequest, NextResponse } from 'next/server';
import { getCached, setCached } from "@/lib/server-cache";

const TTL = 5 * 60 * 1000; // 5 minutes

const API_BASE_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const authHeader = request.headers.get('Authorization');

    const params = new URLSearchParams();
    searchParams.forEach((value, key) => params.append(key, value));
    const queryString = params.toString();

    const cacheKey = `categories:${queryString}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' },
      });
    }

    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/api/categories${queryString ? `?${queryString}` : ""}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch categories' },
        { status: response.status }
      );
    }

    const data = await response.json();

    setCached(cacheKey, data, TTL);
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const contentType = request.headers.get('Content-Type') || '';

    // Forward FormData as-is for file uploads; fall back to JSON for plain requests
    let forwardBody: BodyInit;
    const forwardHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...(authHeader && { Authorization: authHeader }),
    };

    if (contentType.includes('multipart/form-data')) {
      forwardBody = await request.formData();
      // Do NOT set Content-Type — fetch adds it with the correct boundary automatically
    } else {
      forwardBody = JSON.stringify(await request.json());
      forwardHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'POST',
      headers: forwardHeaders,
      body: forwardBody,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to create category', ...errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
