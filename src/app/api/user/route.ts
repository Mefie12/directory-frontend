import { NextRequest, NextResponse } from 'next/server';
import { authCookieEnabled } from '@/lib/auth-cookie';
import { clearSessionCookies } from '@/lib/bff/session-cookie';

const API_BASE_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://me-fie.co.uk').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(`${API_BASE_URL}/api/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const failure = NextResponse.json(
        { error: errorData.message || 'Failed to fetch user' },
        { status: response.status }
      );
      // V2 Phase 5.2: an expired or revoked token must not leave a dead cookie behind.
      if (response.status === 401 && authCookieEnabled()) clearSessionCookies(failure, request);
      return failure;
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-store',
        'Vary': 'Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
