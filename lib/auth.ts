/**
 * Shared authentication helpers.
 * Single source of truth for JWT_SECRET — never hardcode secrets in route files.
 */

import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const DEV_FALLBACK = 'ak-saarthi-dev-only-secret-key-do-not-use-in-prod';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[FATAL] JWT_SECRET environment variable is not set. ' +
      'Set it in your hosting platform before deploying to production.'
    );
  }

  // Dev-only fallback
  console.warn(
    '⚠️  JWT_SECRET is not set — using development fallback. ' +
    'Set JWT_SECRET in .env for production.'
  );
  return DEV_FALLBACK;
}

export type Role = 'advisor' | 'client';

export interface SessionUser {
  userId: string;
  email: string;
  role: Role;
  clientId: string | null;
}

/**
 * Reads and verifies the ak_token cookie server-side. Returns null if missing,
 * expired, or tampered with. Every route that returns or mutates data must
 * call this (or requireSession) — never trust a role/clientId sent by the client.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ak_token')?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, getJwtSecret()) as Partial<SessionUser>;
    if (!decoded.userId || !decoded.role) return null;

    return {
      userId: decoded.userId,
      email: decoded.email ?? '',
      role: decoded.role,
      clientId: decoded.clientId ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Guard for API routes. Returns the verified session, or a ready-to-return
 * NextResponse (401/403) when the caller isn't allowed through.
 *
 * Usage:
 *   const auth = await requireSession(['advisor']);
 *   if ('response' in auth) return auth.response;
 *   const { session } = auth;
 */
export async function requireSession(
  allowedRoles?: Role[]
): Promise<{ session: SessionUser } | { response: NextResponse }> {
  const session = await getSession();

  if (!session) {
    return { response: NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 }) };
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { session };
}
