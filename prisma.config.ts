// prisma.config.ts — Prisma ORM v7 configuration
// In Prisma 7, datasource URL is configured here (not in schema.prisma).
//
// DATABASE_URL      — Supabase connection pooler (Transaction mode, port 6543)
//                    Used by PrismaClient at runtime via @prisma/adapter-neon
// DIRECT_URL        — Supabase direct connection (port 5432, no pooler)
//                    Used here by Prisma CLI for migrations
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  // Prisma CLI (migrate deploy, db push, studio) uses DIRECT_URL for a
  // direct connection — required when DATABASE_URL is a pgBouncer pooler URL.
  // If you don't use a pooler, set DIRECT_URL to the same value as DATABASE_URL.
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"] ?? "",
  },
});
