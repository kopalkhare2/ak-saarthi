import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import fs from 'fs';

let prisma: PrismaClient;

let dbPath = path.join(process.cwd(), 'prisma/dev.db');

// On Vercel serverless functions, the root directory is read-only.
// We must copy dev.db to /tmp/dev.db so SQLite write transactions succeed cleanly.
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  const tmpDbPath = '/tmp/dev.db';
  try {
    if (!fs.existsSync(tmpDbPath)) {
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, tmpDbPath);
      }
    }
    dbPath = tmpDbPath;
  } catch (err) {
    console.error('Error setting up /tmp/dev.db for Vercel:', err);
  }
}

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({ adapter });
} else {
  const globalWithPrisma = global as typeof globalThis & {
    prisma?: PrismaClient;
  };
  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalWithPrisma.prisma;
}

export default prisma;
export { prisma };
