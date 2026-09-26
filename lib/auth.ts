import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * Shared authentication helpers.
 * Single source of truth for JWT_SECRET — never hardcode secrets in route files.
 */

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
 * Reads and verifies the ak_token cookie (legacy email/password login)
 * OR falls back to the NextAuth session (Google OAuth login).
 * Returns null if neither is present or valid.
 */
export async function getSession(): Promise<SessionUser | null> {
  // 1. Try legacy ak_token cookie first (email/password login)
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ak_token')?.value;
    if (token) {
      const decoded = jwt.verify(token, getJwtSecret()) as Partial<SessionUser>;
      if (decoded.userId && decoded.role) {
        return {
          userId: decoded.userId,
          email: decoded.email ?? '',
          role: decoded.role as Role,
          clientId: decoded.clientId ?? null,
        };
      }
    }
  } catch {
    // ak_token missing or invalid — fall through to NextAuth
  }

  // 2. Fall back to NextAuth session (Google OAuth login)
  try {
    const nextAuthSession = await auth();
    if (nextAuthSession?.user?.email) {
      const email = nextAuthSession.user.email.toLowerCase().trim();
      const sessionRole = ((nextAuthSession.user as any).role as Role) || 'advisor';
      const sessionClientId = (nextAuthSession.user as any).clientId as string | null;

      try {
        const dbUser = await prisma.user.findFirst({ where: { email } });
        if (dbUser) {
          return {
            userId: dbUser.id,
            email: dbUser.email,
            role: dbUser.role as Role,
            clientId: dbUser.clientId ?? null,
          };
        }
      } catch (dbErr) {
        console.error('DB user lookup in getSession failed:', dbErr);
      }

      // Fallback directly to NextAuth validated session
      return {
        userId: nextAuthSession.user.id || email,
        email: email,
        role: sessionRole,
        clientId: sessionClientId ?? null,
      };
    }
  } catch {
    // NextAuth not available
  }

  return null;
}

/**
 * Alias for getSession for backwards-compatibility
 */
export async function getAuthSession() {
  return getSession();
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

export function isAdmin(email: string): boolean {
  return email.toLowerCase().trim() === 'kopalkhare2@gmail.com';
}
