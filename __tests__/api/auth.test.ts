/**
 * Tests for /api/auth/login and /api/auth/me
 */

import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  clearMockCookies,
  getMockCookieStore,
  createTestUser,
  createMockRequest,
  mockPrismaModule,
  createCookiesMock,
} from '../helpers/setup';

// Mock prisma — the factory runs lazily so testPrisma is ready by test time
jest.mock('@/lib/prisma', () => mockPrismaModule());

// Mock next/headers
const cookiesMock = createCookiesMock();
jest.mock('next/headers', () => cookiesMock);

// Import route handlers AFTER mocks are set up
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { GET as meHandler } from '@/app/api/auth/me/route';

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

beforeEach(async () => {
  await clearDatabase();
  clearMockCookies();
});

describe('POST /api/auth/login', () => {
  it('should return 400 when email is missing', async () => {
    const req = createMockRequest('/api/auth/login', {
      method: 'POST',
      body: { password: 'password123' },
    });

    const res = await loginHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Email and password are required');
  });

  it('should return 400 when password is missing', async () => {
    const req = createMockRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'test@example.com' },
    });

    const res = await loginHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Email and password are required');
  });

  it('should return 401 for non-existent user', async () => {
    const req = createMockRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'nobody@example.com', password: 'password123' },
    });

    const res = await loginHandler(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Invalid email or password');
  });

  it('should return 401 for wrong password', async () => {
    await createTestUser({ email: 'advisor@test.com', password: 'correct-password' });

    const req = createMockRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'advisor@test.com', password: 'wrong-password' },
    });

    const res = await loginHandler(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Invalid email or password');
  });

  it('should return 200 with user data and set cookie on valid login', async () => {
    await createTestUser({ email: 'advisor@test.com', password: 'password123', role: 'advisor' });

    const req = createMockRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'advisor@test.com', password: 'password123' },
    });

    const res = await loginHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.email).toBe('advisor@test.com');
    expect(data.role).toBe('advisor');
    expect(data.id).toBeDefined();
    // Password should NOT be in the response
    expect(data.password).toBeUndefined();
    // Cookie should have been set
    expect(getMockCookieStore().has('ak_token')).toBe(true);
  });
});

describe('GET /api/auth/me', () => {
  it('should return 401 when no token is present', async () => {
    const res = await meHandler();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.user).toBeNull();
  });

  it('should return 401 for an invalid token', async () => {
    getMockCookieStore().set('ak_token', 'invalid-jwt-token');

    const res = await meHandler();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.user).toBeNull();
  });

  it('should return user data for a valid token', async () => {
    // First, login to get a valid token set in the mock cookie store
    await createTestUser({ email: 'me@test.com', password: 'password123', role: 'advisor' });

    const loginReq = createMockRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'me@test.com', password: 'password123' },
    });
    await loginHandler(loginReq);

    // Now call /me — the cookie was set by login
    const res = await meHandler();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('me@test.com');
    expect(data.user.role).toBe('advisor');
  });
});
