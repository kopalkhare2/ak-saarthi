'use server';

import { signIn } from '@/auth';

export async function loginWithGoogle(role: 'advisor' | 'client') {
  await signIn('google', {
    redirectTo: role === 'advisor' ? '/advisor/dashboard' : '/client/dashboard',
  });
}
