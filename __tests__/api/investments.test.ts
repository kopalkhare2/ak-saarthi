/**
 * Tests for /api/investments/[id]
 */

import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  createTestClient,
  createTestInvestment,
  createMockRequest,
  mockPrismaModule,
  createCookiesMock,
  clearMockCookies,
  setAdvisorSession,
} from '../helpers/setup';

jest.mock('@/lib/prisma', () => mockPrismaModule());
jest.mock('next/headers', () => createCookiesMock());

import {
  GET as getInvestmentById,
  PUT as updateInvestment,
  DELETE as deleteInvestment,
} from '@/app/api/investments/[id]/route';

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

describe('GET /api/investments/:id', () => {
  it('should return a specific investment', async () => {
    const client = await createTestClient({ email: 'invest-client@test.com' });
    const investment = await createTestInvestment(client.id, {
      schemeName: 'Axis Bluechip Fund',
      investedAmount: 200000,
      currentValue: 240000,
      returns: 20,
    });

    const req = createMockRequest(`/api/investments/${investment.id}`);
    const res = await getInvestmentById(req, {
      params: Promise.resolve({ id: investment.id }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.schemeName).toBe('Axis Bluechip Fund');
    expect(data.investedAmount).toBe(200000);
    expect(data.currentValue).toBe(240000);
    expect(data.returns).toBe(20);
  });

  it('should return 404 for non-existent investment', async () => {
    const req = createMockRequest('/api/investments/non-existent-id');
    const res = await getInvestmentById(req, {
      params: Promise.resolve({ id: 'non-existent-id' }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Investment not found');
  });
});

describe('PUT /api/investments/:id', () => {
  it('should update an investment', async () => {
    const client = await createTestClient({ email: 'update-invest@test.com' });
    const investment = await createTestInvestment(client.id, {
      schemeName: 'Old Fund',
      currentValue: 100000,
    });

    const req = createMockRequest(`/api/investments/${investment.id}`, {
      method: 'PUT',
      body: {
        clientId: client.id,
        type: 'mutual_fund',
        schemeName: 'Updated Fund',
        investedAmount: 100000,
        currentValue: 130000,
        returns: 30,
        startDate: '2024-01-01',
        status: 'active',
      },
    });

    const res = await updateInvestment(req, {
      params: Promise.resolve({ id: investment.id }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.schemeName).toBe('Updated Fund');
    expect(data.currentValue).toBe(130000);
    expect(data.returns).toBe(30);
  });
});

describe('DELETE /api/investments/:id', () => {
  it('should delete an investment', async () => {
    const client = await createTestClient({ email: 'del-invest@test.com' });
    const investment = await createTestInvestment(client.id);

    const req = createMockRequest(`/api/investments/${investment.id}`, { method: 'DELETE' });
    const res = await deleteInvestment(req, {
      params: Promise.resolve({ id: investment.id }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
