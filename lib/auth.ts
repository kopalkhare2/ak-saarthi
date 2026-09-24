import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';

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

export async function getAuthSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ak_token')?.value;
    if (!token) return null;

    return jwt.verify(token, getJwtSecret()) as {
      userId: string;
      email: string;
      role: string;
      clientId?: string;
    };
  } catch (err) {
    return null;
  }
}

export function isAdmin(email: string): boolean {
  return email.toLowerCase().trim() === 'kopalkhare2@gmail.com';
}
