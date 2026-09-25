/**
 * Test helpers for AK Saarthi API route testing.
 *
 * Provides an in-memory mock PrismaClient so unit/integration tests run
 * fast and reliably without needing a live PostgreSQL/Supabase database.
 * Also mocks `next/headers` (cookies).
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

function matchWhere(record: any, where: any, getRelations?: () => Record<string, (r: any) => any>): boolean {
  if (!where) return true;
  for (const key of Object.keys(where)) {
    const val = where[key];
    if (val === undefined) continue;

    if (key === 'OR' && Array.isArray(val)) {
      if (!val.some((subWhere: any) => matchWhere(record, subWhere, getRelations))) return false;
      continue;
    }
    if (key === 'AND' && Array.isArray(val)) {
      if (!val.every((subWhere: any) => matchWhere(record, subWhere, getRelations))) return false;
      continue;
    }
    if (key === 'NOT' && val) {
      if (matchWhere(record, val, getRelations)) return false;
      continue;
    }

    if (key === 'isDeleted') {
      if (Boolean(record.isDeleted) !== Boolean(val)) return false;
      continue;
    }

    if (val === null) {
      if (record[key] !== null && record[key] !== undefined) return false;
    } else if (typeof val === 'object' && !Array.isArray(val)) {
      if ('equals' in val) {
        const expected = val.equals;
        const actual = record[key];
        if (typeof expected === 'string' && typeof actual === 'string') {
          if (expected.toLowerCase() !== actual.toLowerCase()) return false;
        } else if (actual !== expected) {
          return false;
        }
      } else if ('in' in val) {
        if (!Array.isArray(val.in) || !val.in.includes(record[key])) return false;
      } else if ('notIn' in val) {
        if (Array.isArray(val.notIn) && val.notIn.includes(record[key])) return false;
      } else if ('not' in val) {
        if (val.not === null) {
          if (record[key] === null || record[key] === undefined) return false;
        } else if (record[key] === val.not) {
          return false;
        }
      } else if ('contains' in val) {
        const actual = String(record[key] ?? '').toLowerCase();
        const expected = String(val.contains ?? '').toLowerCase();
        if (!actual.includes(expected)) return false;
      } else if ('gte' in val) {
        if (record[key] < val.gte) return false;
      } else if ('lte' in val) {
        if (record[key] > val.lte) return false;
      } else if ('gt' in val) {
        if (record[key] <= val.gt) return false;
      } else if ('lt' in val) {
        if (record[key] >= val.lt) return false;
      } else {
        // Relation sub-query (e.g. { client: { advisorId: '...' } })
        if (getRelations) {
          const rels = getRelations();
          const relFn = rels[key];
          if (relFn) {
            const relRecord = relFn(record);
            if (!relRecord || !matchWhere(relRecord, val)) return false;
            continue;
          }
        }
        if (record[key] && typeof record[key] === 'object') {
          if (!matchWhere(record[key], val)) return false;
          continue;
        }
      }
    } else {
      const expected = val;
      const actual = record[key];
      if (typeof expected === 'string' && typeof actual === 'string' && key.toLowerCase().includes('email')) {
        if (expected.toLowerCase() !== actual.toLowerCase()) return false;
      } else if (actual !== expected) {
        return false;
      }
    }
  }
  return true;
}

function createModelStore<T extends Record<string, any>>(name: string, getRelations: () => Record<string, (r: any) => any> = () => ({})) {
  let records: T[] = [];

  function resolveIncludes(record: any, include: any) {
    if (!include || !record) return record;
    const cloned = { ...record };
    const rels = getRelations();
    for (const relKey of Object.keys(include)) {
      if (!include[relKey]) continue;
      if (rels[relKey]) {
        cloned[relKey] = rels[relKey](record);
      } else if (relKey === 'family') {
        cloned.family = [];
      } else if (relKey === 'notes') {
        cloned.notes = [];
      }
    }
    return cloned;
  }

  return {
    async findUnique(args: { where: any; include?: any }) {
      const found = records.find(r => matchWhere(r, args.where, getRelations));
      return found ? resolveIncludes(JSON.parse(JSON.stringify(found)), args?.include) : null;
    },
    async findFirst(args: { where?: any; include?: any; orderBy?: any } = {}) {
      const found = records.find(r => matchWhere(r, args?.where, getRelations));
      return found ? resolveIncludes(JSON.parse(JSON.stringify(found)), args?.include) : null;
    },
    async findMany(args: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number } = {}) {
      let filtered = records.filter(r => matchWhere(r, args?.where, getRelations));
      if (args?.skip) filtered = filtered.slice(args.skip);
      if (args?.take) filtered = filtered.slice(0, args.take);
      return filtered.map(r => resolveIncludes(JSON.parse(JSON.stringify(r)), args?.include));
    },
    async create(args: { data: any; include?: any }) {
      // Check unique constraints
      if (name === 'Policy' && args.data.policyNumber) {
        if (records.some(r => r.policyNumber === args.data.policyNumber)) {
          const err: any = new Error('Unique constraint failed on policyNumber');
          err.code = 'P2002';
          throw err;
        }
      }
      if (name === 'Client' && args.data.email) {
        if (records.some(r => r.email && r.email.toLowerCase() === args.data.email.toLowerCase() && !r.isDeleted)) {
          const err: any = new Error('Unique constraint failed on email');
          err.code = 'P2002';
          throw err;
        }
      }

      const id = args.data.id || `${name.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date();
      const newRecord = {
        id,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        isDeleted: false,
        ...args.data,
      } as T;

      // Handle nested family creation for Client
      if (name === 'Client' && args.data.family?.create) {
        const familyList = Array.isArray(args.data.family.create) ? args.data.family.create : [args.data.family.create];
        const rels = getRelations();
        if (rels._familyStore) {
          const fs = rels._familyStore();
          for (const m of familyList) {
            await fs.create({ data: { ...m, clientId: id } });
          }
        }
      }

      records.push(newRecord);
      return resolveIncludes(JSON.parse(JSON.stringify(newRecord)), args?.include);
    },
    async createMany(args: { data: any[] }) {
      for (const item of args.data) {
        await this.create({ data: item });
      }
      return { count: args.data.length };
    },
    async update(args: { where: any; data: any; include?: any }) {
      const idx = records.findIndex(r => matchWhere(r, args.where, getRelations));
      if (idx === -1) throw new Error(`Record not found in ${name}`);

      // Handle nested family updates for Client
      if (name === 'Client' && args.data.family?.create) {
        const familyList = Array.isArray(args.data.family.create) ? args.data.family.create : [args.data.family.create];
        const rels = getRelations();
        if (rels._familyStore) {
          const fs = rels._familyStore();
          await fs.deleteMany({ where: { clientId: records[idx].id } });
          for (const m of familyList) {
            await fs.create({ data: { ...m, clientId: records[idx].id } });
          }
        }
      }

      const updated = {
        ...records[idx],
        ...args.data,
        updatedAt: new Date(),
      };
      records[idx] = updated;
      return resolveIncludes(JSON.parse(JSON.stringify(updated)), args?.include);
    },
    async updateMany(args: { where?: any; data: any }) {
      let count = 0;
      for (let i = 0; i < records.length; i++) {
        if (matchWhere(records[i], args?.where, getRelations)) {
          records[i] = { ...records[i], ...args.data, updatedAt: new Date() };
          count++;
        }
      }
      return { count };
    },
    async delete(args: { where: any }) {
      const idx = records.findIndex(r => matchWhere(r, args.where, getRelations));
      if (idx === -1) throw new Error(`Record to delete does not exist.`);
      const [removed] = records.splice(idx, 1);
      return removed;
    },
    async deleteMany(args?: { where?: any }) {
      if (!args?.where || Object.keys(args.where).length === 0) {
        const count = records.length;
        records = [];
        return { count };
      }
      const initial = records.length;
      records = records.filter(r => !matchWhere(r, args.where, getRelations));
      return { count: initial - records.length };
    },
    async count(args?: { where?: any }) {
      return records.filter(r => matchWhere(r, args?.where, getRelations)).length;
    },
    async aggregate(args?: { where?: any; _sum?: any }) {
      const filtered = records.filter(r => matchWhere(r, args?.where, getRelations));
      const res: any = { _sum: {} };
      if (args?._sum) {
        for (const k of Object.keys(args._sum)) {
          res._sum[k] = filtered.reduce((acc, curr: any) => acc + (Number(curr[k]) || 0), 0);
        }
      }
      return res;
    },
    _getRecords() {
      return records;
    },
    _setRecords(newRecords: T[]) {
      records = newRecords;
    },
  };
}

function createInMemoryPrisma(): any {
  let userStore: any;
  let clientStore: any;
  let familyStore: any;
  let policyStore: any;
  let investmentStore: any;
  let commissionStore: any;
  let appointmentStore: any;
  let taskStore: any;
  let documentStore: any;
  let profileStore: any;
  let requestStore: any;
  let noteStore: any;

  userStore = createModelStore('User', () => ({
    client: (u: any) => clientStore._getRecords().find((c: any) => c.id === u.clientId) || null,
  }));

  clientStore = createModelStore('Client', () => ({
    family: (c: any) => familyStore._getRecords().filter((f: any) => f.clientId === c.id),
    policies: (c: any) => policyStore._getRecords().filter((p: any) => p.clientId === c.id),
    investments: (c: any) => investmentStore._getRecords().filter((i: any) => i.clientId === c.id),
    documents: (c: any) => documentStore._getRecords().filter((d: any) => d.clientId === c.id),
    notes: (c: any) => noteStore._getRecords().filter((n: any) => n.clientId === c.id),
    user: (c: any) => userStore._getRecords().find((u: any) => u.clientId === c.id) || null,
    _familyStore: () => familyStore,
  }));

  familyStore = createModelStore('FamilyMember');
  policyStore = createModelStore('Policy', () => ({
    client: (p: any) => clientStore._getRecords().find((c: any) => c.id === p.clientId) || null,
  }));
  investmentStore = createModelStore('Investment', () => ({
    client: (i: any) => clientStore._getRecords().find((c: any) => c.id === i.clientId) || null,
  }));
  commissionStore = createModelStore('Commission');
  appointmentStore = createModelStore('Appointment');
  taskStore = createModelStore('Task', () => ({
    client: (t: any) => clientStore._getRecords().find((c: any) => c.id === t.clientId) || null,
  }));
  documentStore = createModelStore('ClientDocument', () => ({
    client: (d: any) => clientStore._getRecords().find((c: any) => c.id === d.clientId) || null,
  }));
  profileStore = createModelStore('AdvisorProfile');
  requestStore = createModelStore('AdvisorAccessRequest');
  noteStore = createModelStore('Note');

  const instance = {
    user: userStore,
    client: clientStore,
    familyMember: familyStore,
    policy: policyStore,
    investment: investmentStore,
    commission: commissionStore,
    appointment: appointmentStore,
    task: taskStore,
    clientDocument: documentStore,
    advisorProfile: profileStore,
    advisorAccessRequest: requestStore,
    note: noteStore,
    async $transaction(arg: any) {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      if (typeof arg === 'function') {
        return arg(instance);
      }
      return null;
    },
    async $disconnect() {},
  };

  return instance;
}

let testPrisma: any = createInMemoryPrisma();

export function getTestPrisma(): PrismaClient {
  return testPrisma as PrismaClient;
}

export async function setupTestDatabase(): Promise<void> {
  testPrisma = createInMemoryPrisma();
}

export async function teardownTestDatabase(): Promise<void> {
  if (testPrisma && testPrisma.$disconnect) {
    await testPrisma.$disconnect();
  }
}

export async function clearDatabase(): Promise<void> {
  if (!testPrisma) return;
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
  await testPrisma.advisorAccessRequest.deleteMany();
  await testPrisma.note.deleteMany();
}

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
      advisorId: 'test-advisor',
      isDeleted: false,
      firstName: 'Test',
      lastName: 'Client',
      dob: '1990-01-01',
      gender: 'male',
      phone: '9876543210',
      email: `test-${Date.now()}-${Math.random().toString(36).slice(2, 5)}@example.com`,
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
      advisorId: 'test-advisor',
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
      isDeleted: false,
      ...overrides,
    },
  });
}

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
