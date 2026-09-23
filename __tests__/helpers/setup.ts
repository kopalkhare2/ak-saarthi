/**
 * Test helpers for AK Saarthi API route testing.
 *
 * Strategy: We mock `@/lib/prisma` so every route handler that imports prisma
 * gets a PrismaClient connected to an in-memory SQLite database.
 * We also mock `next/headers` (cookies) and `next/server` partially.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// Test database — use a temp file-based SQLite so Prisma migrations work.
// Each test suite gets its own DB file to avoid cross-contamination.
// ---------------------------------------------------------------------------

let testPrisma: PrismaClient;
let testDbPath: string;

export function getTestPrisma(): PrismaClient {
  return testPrisma;
}

/**
 * Sets up a fresh test database by copying the schema and running migrations.
 * Call in `beforeAll`.
 */
export async function setupTestDatabase(): Promise<void> {
  // Create a unique temp DB file inside the project (not /tmp)
  testDbPath = path.join(
    process.cwd(),
    `prisma/test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`
  );

  const adapter = new PrismaBetterSqlite3({ url: `file:${testDbPath}` });
  testPrisma = new PrismaClient({ adapter });

  // Push the schema to the test database (Prisma v7 syntax)
  execSync(`npx prisma db push --accept-data-loss --url "file:${testDbPath}"`, {
    cwd: process.cwd(),
    stdio: 'pipe',
  });
}

/**
 * Tears down the test database. Call in `afterAll`.
 */
export async function teardownTestDatabase(): Promise<void> {
  await testPrisma.$disconnect();
  // Clean up the temp DB file
  try {
    if (testDbPath && fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    // Also clean up WAL and SHM files if they exist
    if (fs.existsSync(testDbPath + '-wal')) fs.unlinkSync(testDbPath + '-wal');
    if (fs.existsSync(testDbPath + '-shm')) fs.unlinkSync(testDbPath + '-shm');
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Clears all data from all tables. Call in `beforeEach` for test isolation.
 */
export async function clearDatabase(): Promise<void> {
  // Delete in order that respects foreign key constraints
  await testPrisma.commission.deleteMany();
  await testPrisma.clientDocument.deleteMany();
  await testPrisma.appointment.deleteMany();
  await testPrisma.task.deleteMany();
  await testPrisma.policy.deleteMany();
  await testPrisma.investment.deleteMany();
  await testPrisma.familyMember.deleteMany();
  await testPrisma.client.deleteMany();
  await testPrisma.user.deleteMany();
  await testPrisma.advisorProfile.deleteMany();
}

// ---------------------------------------------------------------------------
// Mock the prisma module so route handlers use our test instance
// ---------------------------------------------------------------------------

/**
 * Call this in a `jest.mock` block or at the top of your test file.
 * Returns an object that can be spread into jest.mock's factory.
 */
export function mockPrismaModule() {
  return {
    prisma: new Proxy(
      {},
      {
        get(_target, prop) {
          return (testPrisma as unknown as Record<PropertyKey, unknown>)[prop];
        },
      }
    ),
    default: new Proxy(
      {},
      {
        get(_target, prop) {
          return (testPrisma as unknown as Record<PropertyKey, unknown>)[prop];
        },
      }
    ),
  };
}

// ---------------------------------------------------------------------------
// Mock next/headers (cookies)
// ---------------------------------------------------------------------------

let mockCookieStore: Map<string, string> = new Map();

export function getMockCookieStore() {
  return mockCookieStore;
}

export function setMockCookie(name: string, value: string) {
  mockCookieStore.set(name, value);
}

export function clearMockCookies() {
  mockCookieStore = new Map();
}

export function createCookiesMock() {
  return {
    cookies: jest.fn().mockResolvedValue({
      get: (name: string) => {
        const value = mockCookieStore.get(name);
        return value ? { name, value } : undefined;
      },
      set: (opts: { name: string; value: string }) => {
        mockCookieStore.set(opts.name, opts.value);
      },
      delete: (name: string) => {
        mockCookieStore.delete(name);
      },
    }),
  };
}

// ---------------------------------------------------------------------------
// Session mocking — every route now requires an authenticated session via
// lib/auth.ts's requireSession(), which reads/verifies the `ak_token` cookie.
// Sign a real token with the same (dev-fallback) secret and drop it into the
// mocked cookie store so route handlers see a valid session in tests.
// ---------------------------------------------------------------------------

// Kept in sync with lib/auth.ts's DEV_FALLBACK — not imported from there
// directly because that module pulls in `next/headers`, and importing it here
// would create a require cycle through the jest.mock('next/headers', ...)
// factory (which itself closes over this file's exports).
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'ak-saarthi-dev-only-secret-key-do-not-use-in-prod';

export function signSessionToken(payload: {
  userId: string;
  email: string;
  role: 'advisor' | 'client';
  clientId?: string | null;
}): string {
  return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '7d' });
}

export function setAdvisorSession(overrides: { userId?: string; email?: string } = {}) {
  setMockCookie(
    'ak_token',
    signSessionToken({
      userId: overrides.userId || 'test-advisor',
      email: overrides.email || 'advisor@test.com',
      role: 'advisor',
      clientId: null,
    })
  );
}

export function setClientSession(clientId: string, overrides: { userId?: string; email?: string } = {}) {
  setMockCookie(
    'ak_token',
    signSessionToken({
      userId: overrides.userId || `test-client-user-${clientId}`,
      email: overrides.email || 'client@test.com',
      role: 'client',
      clientId,
    })
  );
}

// ---------------------------------------------------------------------------
// Factory helpers for creating test data
// ---------------------------------------------------------------------------

export async function createTestClient(overrides: Record<string, unknown> = {}) {
  return testPrisma.client.create({
    data: {
      firstName: 'Test',
      lastName: 'Client',
      dob: '1990-01-01',
      gender: 'male',
      phone: '9876543210',
      email: `test-${Date.now()}@example.com`,
      address: '123 Test St',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      occupation: 'Engineer',
      maritalStatus: 'single',
      annualIncome: 1200000,
      riskProfile: 'moderate',
      ...overrides,
    },
    include: { family: true },
  });
}

export async function createTestUser(overrides: { email?: string; password?: string; role?: string; clientId?: string } = {}) {
  const hashedPassword = await bcrypt.hash(overrides.password || 'password123', 10);
  return testPrisma.user.create({
    data: {
      email: overrides.email || `user-${Date.now()}@example.com`,
      password: hashedPassword,
      role: overrides.role || 'advisor',
      clientId: overrides.clientId || null,
    },
  });
}

export async function createTestPolicy(clientId: string, overrides: Record<string, unknown> = {}) {
  return testPrisma.policy.create({
    data: {
      clientId,
      company: 'LIC',
      policyNumber: `POL-${Date.now()}`,
      type: 'life',
      premium: 25000,
      premiumFrequency: 'yearly',
      dueDate: '2025-12-01',
      startDate: '2024-01-01',
      sumAssured: 1000000,
      nominee: 'Test Nominee',
      status: 'active',
      ...overrides,
    },
  });
}

export async function createTestTask(overrides: Record<string, unknown> = {}) {
  return testPrisma.task.create({
    data: {
      title: 'Test Task',
      priority: 'medium',
      status: 'todo',
      ...overrides,
    },
  });
}

export async function createTestInvestment(clientId: string, overrides: Record<string, unknown> = {}) {
  return testPrisma.investment.create({
    data: {
      clientId,
      type: 'mutual_fund',
      schemeName: 'Test Fund',
      investedAmount: 100000,
      currentValue: 110000,
      returns: 10,
      startDate: '2024-01-01',
      status: 'active',
      ...overrides,
    },
  });
}

export async function createTestDocument(clientId: string, overrides: Record<string, unknown> = {}) {
  return testPrisma.clientDocument.create({
    data: {
      clientId,
      clientName: 'Test Client',
      type: 'pan',
      name: 'PAN Card',
      fileName: 'pan.pdf',
      ...overrides,
    },
  });
}

// ---------------------------------------------------------------------------
// Helper to build a mock Request object
// ---------------------------------------------------------------------------

export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Request {
  const { method = 'GET', body, headers = {} } = options;
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return new Request(`http://localhost:3000${url}`, init);
}
