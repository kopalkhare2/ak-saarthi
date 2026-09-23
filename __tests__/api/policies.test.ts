/**
 * Tests for /api/policies
 */

import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  createTestClient,
  createTestPolicy,
  createMockRequest,
  mockPrismaModule,
  createCookiesMock,
  clearMockCookies,
  setAdvisorSession,
} from '../helpers/setup';

jest.mock('@/lib/prisma', () => mockPrismaModule());
jest.mock('next/headers', () => createCookiesMock());

import { GET as getPolicies, POST as createPolicy } from '@/app/api/policies/route';

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

beforeEach(async () => {
  await clearDatabase();
  clearMockCookies();
  setAdvisorSession();
});

describe('GET /api/policies', () => {
  it('should return an empty array when no policies exist', async () => {
    const res = await getPolicies();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(0);
  });

  it('should return all policies', async () => {
    const client = await createTestClient({ email: 'policy-client@test.com' });
    await createTestPolicy(client.id, { policyNumber: 'POL-001' });
    await createTestPolicy(client.id, { policyNumber: 'POL-002' });

    const res = await getPolicies();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
  });
});

describe('POST /api/policies', () => {
  it('should create a new policy', async () => {
    const client = await createTestClient({ email: 'new-policy@test.com' });

    const req = createMockRequest('/api/policies', {
      method: 'POST',
      body: {
        clientId: client.id,
        company: 'HDFC Life',
        policyNumber: 'HDFC-12345',
        type: 'term',
        premium: 15000,
        premiumFrequency: 'yearly',
        dueDate: '2025-06-01',
        startDate: '2024-06-01',
        endDate: '2054-06-01',
        sumAssured: 5000000,
        nominee: 'Spouse',
        status: 'active',
      },
    });

    const res = await createPolicy(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.company).toBe('HDFC Life');
    expect(data.policyNumber).toBe('HDFC-12345');
    expect(data.premium).toBe(15000);
    expect(data.sumAssured).toBe(5000000);
    expect(data.type).toBe('term');
  });

  it('should return 400 for duplicate policy number', async () => {
    const client = await createTestClient({ email: 'dup-policy@test.com' });
    await createTestPolicy(client.id, { policyNumber: 'DUP-001' });

    const req = createMockRequest('/api/policies', {
      method: 'POST',
      body: {
        clientId: client.id,
        company: 'SBI Life',
        policyNumber: 'DUP-001', // same as above
        type: 'health',
        premium: 10000,
        premiumFrequency: 'monthly',
        dueDate: '2025-01-01',
        startDate: '2024-01-01',
        sumAssured: 500000,
        nominee: 'Parent',
        status: 'active',
      },
    });

    const res = await createPolicy(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('already exists');
  });
});
