import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Edge middleware runs on the Edge runtime, which doesn't support the
// `jsonwebtoken` package (it needs Node's crypto module). This verifies an
// HS256 JWT's signature using the Web Crypto API instead, which Edge does
// support, so a tampered or forged cookie is rejected here rather than only
// being caught later by the API routes.

function base64UrlToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlDecodeToString(base64Url: string): string {
  return new TextDecoder().decode(base64UrlToUint8Array(base64Url));
}

async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = base64UrlToUint8Array(signaturePart);
    const data = new TextEncoder().encode(`${headerPart}.${payloadPart}`);
    const isValid = await crypto.subtle.verify('HMAC', key, signature, data);
    if (!isValid) return null;

    const payload = JSON.parse(base64UrlDecodeToString(payloadPart));
    return payload;
  } catch {
    return null;
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  // Matches lib/auth.ts's dev fallback so tokens signed there verify here too.
  return 'ak-saarthi-dev-only-secret-key-do-not-use-in-prod';
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('ak_token')?.value;
  const nextAuthToken =
    request.cookies.get('__Secure-authjs.session-token')?.value ||
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value ||
    request.cookies.get('next-auth.session-token')?.value;
  const { pathname } = request.nextUrl;

  // If user has a NextAuth Google session, allow through to page & layout guards
  if (nextAuthToken) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const decoded = await verifyJwt(token, getJwtSecret());
  if (!decoded) {
    // Invalid signature or malformed token — clear the cookie
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('ak_token');
    return response;
  }

  // Check expiration
  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (typeof decoded.exp === 'number' && currentTimestamp > decoded.exp) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('ak_token');
    return response;
  }

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    const email = typeof decoded.email === 'string' ? decoded.email.toLowerCase().trim() : '';
    const isAdmin = email === 'kopalkhare2@gmail.com' || decoded.role === 'admin';
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/advisor/dashboard', request.url));
    }
  }

  // Advisor routes protection
  if (pathname.startsWith('/advisor') && decoded.role !== 'advisor') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Client routes protection
  if (pathname.startsWith('/client') && decoded.role !== 'client') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/advisor/:path*',
    '/client/:path*',
  ],
};
