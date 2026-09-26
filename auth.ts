import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  basePath: '/api/auth',
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Credentials({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.toLowerCase().trim();
        const password = credentials?.password as string;
        const requestedRole = credentials?.role as string | undefined;

        if (!email || !password) return null;

        const user = await prisma.user.findFirst({ where: { email } });
        if (!user) return null;

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return null;

        if (requestedRole && user.role !== requestedRole) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          clientId: user.clientId ?? null,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // For Google OAuth, auto-provision or link accounts
      if (account?.provider === 'google' && user.email) {
        const email = user.email.toLowerCase().trim();
        const existing = await prisma.user.findFirst({ where: { email } });

        if (!existing) {
          // Auto-create user with advisor role for google sign-in
          // (They can only access advisor dashboard — admin controls access)
          const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
          await prisma.user.create({
            data: {
              email,
              password: randomPassword,
              role: 'advisor',
            },
          });
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        // On initial sign in, enrich token with DB role + clientId
        const dbUser = await prisma.user.findFirst({
          where: { email: (user.email ?? '').toLowerCase() },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.clientId = dbUser.clientId ?? null;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).clientId = token.clientId as string | null;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  // Required for Vercel deployments — prevents CSRF errors
  trustHost: true,

  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});
