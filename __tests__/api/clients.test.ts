/**
 * Tests for /api/clients and /api/clients/[id]
 */

import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  createTestClient,
  createTestUser,
  createMockRequest,
  mockPrismaModule,
  createCookiesMock,
  clearMockCookies,
  setAdvisorSession,
  setClientSession,
  getTestPrisma,
} from '../helpers/setup';

jest.mock('@/lib/prisma', () => mockPrismaModule());
jest.mock('next/headers', () => createCookiesMock());

import { GET as getClients, POST as createClient } from '@/app/api/clients/route';
import {
  GET as getClientById,
  PUT as updateClient,
  DELETE as deleteClient,
} from '@/app/api/clients/[id]/route';

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

describe('GET /api/clients', () => {
  it('should return an empty array when no clients exist', async () => {
    const req = createMockRequest('/api/clients');
    const res = await getClients(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });

  it('should return all clients', async () => {
    await createTestClient({ email: 'client1@test.com' });
    await createTestClient({ email: 'client2@test.com' });

    const req = createMockRequest('/api/clients');
    const res = await getClients(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
  });

  it('should return 401 for an unauthenticated request', async () => {
    clearMockCookies(); // no session at all
    const req = createMockRequest('/api/clients');
    const res = await getClients(req);

    expect(res.status).toBe(401);
  });

  it('should scope a client-role session to only their own record', async () => {
    const clientA = await createTestClient({ email: 'client-a@test.com' });
    const clientB = await createTestClient({ email: 'client-b@test.com' });
    setClientSession(clientA.id);

    const req = createMockRequest('/api/clients');
    const res = await getClients(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe(clientA.id);
    expect(data.some((c: { id: string }) => c.id === clientB.id)).toBe(false);
  });
});

describe('POST /api/clients', () => {
  it('should create a client with family members', async () => {
    const req = createMockRequest('/api/clients', {
      method: 'POST',
      body: {
        firstName: 'Raj',
        lastName: 'Sharma',
        dob: '1985-05-15',
        gender: 'male',
        phone: '9876543210',
        email: 'raj@test.com',
        address: '456 Main Rd',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        occupation: 'Doctor',
        maritalStatus: 'married',
        annualIncome: 2500000,
        riskProfile: 'aggressive',
        family: [
          { name: 'Priya Sharma', relation: 'spouse', dob: '1988-03-20' },
          { name: 'Aarav Sharma', relation: 'child', dob: '2015-11-10' },
        ],
      },
    });

    const res = await createClient(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.firstName).toBe('Raj');
    expect(data.lastName).toBe('Sharma');
    expect(data.email).toBe('raj@test.com');
    expect(data.family).toHaveLength(2);
    expect(data.family[0].name).toBe('Priya Sharma');
  });

  it('should return 400 for duplicate email', async () => {
    await createTestClient({ email: 'duplicate@test.com' });

    const req = createMockRequest('/api/clients', {
      method: 'POST',
      body: {
        firstName: 'Another',
        lastName: 'Client',
        dob: '1990-01-01',
        gender: 'female',
        phone: '9999999999',
        email: 'duplicate@test.com',
        address: '789 St',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        occupation: 'Teacher',
        maritalStatus: 'single',
        annualIncome: 800000,
        riskProfile: 'conservative',
      },
    });

    const res = await createClient(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('already exists');
  });

  it('should return 403 when a client-role session tries to create a client', async () => {
    const existingClient = await createTestClient({ email: 'existing@test.com' });
    setClientSession(existingClient.id);

    const req = createMockRequest('/api/clients', {
      method: 'POST',
      body: { firstName: 'Someone', lastName: 'Else', email: 'someone@test.com' },
    });

    const res = await createClient(req);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/clients/:id', () => {
  it('should return a specific client', async () => {
    const client = await createTestClient({ email: 'specific@test.com' });

    const req = createMockRequest(`/api/clients/${client.id}`);
    const res = await getClientById(req, { params: Promise.resolve({ id: client.id }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.email).toBe('specific@test.com');
    expect(data.family).toBeDefined();
  });

  it('should return 404 for non-existent client', async () => {
    const req = createMockRequest('/api/clients/non-existent-id');
    const res = await getClientById(req, {
      params: Promise.resolve({ id: 'non-existent-id' }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Client not found');
  });
});

describe('PUT /api/clients/:id', () => {
  it('should update a client and replace family members', async () => {
    const client = await createTestClient({
      email: 'update@test.com',
      firstName: 'Old',
    });

    const req = createMockRequest(`/api/clients/${client.id}`, {
      method: 'PUT',
      body: {
        firstName: 'Updated',
        lastName: client.lastName,
        dob: client.dob,
        gender: client.gender,
        phone: client.phone,
        email: client.email,
        address: client.address,
        city: client.city,
        state: client.state,
        pincode: client.pincode,
        occupation: client.occupation,
        maritalStatus: client.maritalStatus,
        annualIncome: client.annualIncome,
        riskProfile: client.riskProfile,
        family: [{ name: 'New Family Member', relation: 'spouse' }],
      },
    });

    const res = await updateClient(req, { params: Promise.resolve({ id: client.id }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.firstName).toBe('Updated');
    expect(data.family).toHaveLength(1);
    expect(data.family[0].name).toBe('New Family Member');
  });
});

describe('DELETE /api/clients/:id', () => {
  it('should delete a client', async () => {
    const client = await createTestClient({ email: 'delete@test.com' });

    const req = createMockRequest(`/api/clients/${client.id}`, { method: 'DELETE' });
    const res = await deleteClient(req, { params: Promise.resolve({ id: client.id }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should return 404 when deleting non-existent client', async () => {
    const req = createMockRequest('/api/clients/non-existent-id', { method: 'DELETE' });
    const res = await deleteClient(req, {
      params: Promise.resolve({ id: 'non-existent-id' }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Client not found');
  });

  it('soft-deletes the client but keeps the linked user account intact', async () => {
    // DELETE is a soft delete (isDeleted: true) so the client can be restored
    // from trash later — it must not touch the linked login account. Only the
    // separate "permanent delete" endpoint removes the user record.
    const client = await createTestClient({ email: 'linked-user@test.com' });
    await createTestUser({ email: 'linked-user@test.com', password: 'pass123', role: 'client' });

    const req = createMockRequest(`/api/clients/${client.id}`, { method: 'DELETE' });
    await deleteClient(req, { params: Promise.resolve({ id: client.id }) });

    const updatedClient = await getTestPrisma().client.findUnique({ where: { id: client.id } });
    expect(updatedClient?.isDeleted).toBe(true);

    const userCount = await getTestPrisma().user.count({
      where: { email: 'linked-user@test.com' },
    });
    expect(userCount).toBe(1);
  });
});
