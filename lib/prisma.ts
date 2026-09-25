// lib/prisma.ts — Prisma ORM v7 + Supabase PostgreSQL
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let _prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (_prisma) return _prisma;

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.DIRECT_URL ||
    'postgresql://postgres:postgres@localhost:5432/postgres';

  const isLocal =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  const pool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

  const adapter = new PrismaPg(pool);
  _prisma = new PrismaClient({ adapter });

  return _prisma;
}

// Global caching for development to prevent hot-reload connection leaks
const globalWithPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (process.env.NODE_ENV !== 'production' && globalWithPrisma.prisma) {
      const client = globalWithPrisma.prisma;
      const value = (client as unknown as Record<string | symbol, unknown>)[prop];
      return typeof value === 'function' ? (value as Function).bind(client) : value;
    }

    const client = getPrismaClient();
    if (process.env.NODE_ENV !== 'production') {
      globalWithPrisma.prisma = client;
    }

    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? (value as Function).bind(client) : value;
  },
});

export default prisma;
