/**
 * Tests for /api/documents
 */

import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  createTestClient,
  createTestDocument,
  createMockRequest,
  mockPrismaModule,
  createCookiesMock,
  clearMockCookies,
  setAdvisorSession,
} from '../helpers/setup';

jest.mock('@/lib/prisma', () => mockPrismaModule());
jest.mock('next/headers', () => createCookiesMock());

import { GET as getDocuments, POST as createDocument } from '@/app/api/documents/route';

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

describe('GET /api/documents', () => {
  it('should return an empty array when no documents exist', async () => {
    const req = createMockRequest('/api/documents');
    const res = await getDocuments(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(0);
  });

  it('should return all documents', async () => {
    const client = await createTestClient({ email: 'doc-client@test.com' });
    await createTestDocument(client.id, { name: 'PAN Card', fileName: 'pan.pdf' });
    await createTestDocument(client.id, { name: 'Aadhaar', fileName: 'aadhaar.pdf', type: 'aadhaar' });

    const req = createMockRequest('/api/documents');
    const res = await getDocuments(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
  });
});

describe('POST /api/documents', () => {
  it('should create a document record', async () => {
    const client = await createTestClient({ email: 'upload-client@test.com' });

    const req = createMockRequest('/api/documents', {
      method: 'POST',
      body: {
        clientId: client.id,
        clientName: 'Test Client',
        type: 'kyc',
        name: 'KYC Form',
        fileName: 'kyc-form.pdf',
        size: 102400,
      },
    });

    const res = await createDocument(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.name).toBe('KYC Form');
    expect(data.fileName).toBe('kyc-form.pdf');
    expect(data.type).toBe('kyc');
    expect(data.size).toBe(102400);
    expect(data.clientId).toBe(client.id);
  });

  it('should create a document without size', async () => {
    const client = await createTestClient({ email: 'no-size@test.com' });

    const req = createMockRequest('/api/documents', {
      method: 'POST',
      body: {
        clientId: client.id,
        clientName: 'Test Client',
        type: 'pan',
        name: 'PAN Card',
        fileName: 'pan.jpg',
      },
    });

    const res = await createDocument(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.size).toBeNull();
  });
});
