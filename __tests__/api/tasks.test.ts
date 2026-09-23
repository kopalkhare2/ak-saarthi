/**
 * Tests for /api/tasks and /api/tasks/[id]
 */

import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  createTestClient,
  createTestTask,
  createMockRequest,
  mockPrismaModule,
  createCookiesMock,
  clearMockCookies,
  setAdvisorSession,
} from '../helpers/setup';

jest.mock('@/lib/prisma', () => mockPrismaModule());
jest.mock('next/headers', () => createCookiesMock());

import { GET as getTasks, POST as createTask } from '@/app/api/tasks/route';
import {
  GET as getTaskById,
  PUT as updateTask,
  DELETE as deleteTask,
} from '@/app/api/tasks/[id]/route';

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

describe('GET /api/tasks', () => {
  it('should return an empty array when no tasks exist', async () => {
    const res = await getTasks();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(0);
  });

  it('should return all tasks', async () => {
    await createTestTask({ title: 'Task 1' });
    await createTestTask({ title: 'Task 2' });

    const res = await getTasks();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
  });
});

describe('POST /api/tasks', () => {
  it('should create a task without a client', async () => {
    const req = createMockRequest('/api/tasks', {
      method: 'POST',
      body: {
        title: 'Follow up on renewal',
        priority: 'high',
        status: 'todo',
        dueDate: '2025-07-30',
      },
    });

    const res = await createTask(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.title).toBe('Follow up on renewal');
    expect(data.priority).toBe('high');
    expect(data.clientId).toBeNull();
  });

  it('should create a task linked to a client', async () => {
    const client = await createTestClient({ email: 'task-client@test.com' });

    const req = createMockRequest('/api/tasks', {
      method: 'POST',
      body: {
        title: 'Send policy documents',
        priority: 'medium',
        status: 'todo',
        clientId: client.id,
        clientName: 'Test Client',
      },
    });

    const res = await createTask(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.clientId).toBe(client.id);
    expect(data.clientName).toBe('Test Client');
  });
});

describe('GET /api/tasks/:id', () => {
  it('should return a specific task', async () => {
    const task = await createTestTask({ title: 'Specific Task' });

    const req = createMockRequest(`/api/tasks/${task.id}`);
    const res = await getTaskById(req, { params: Promise.resolve({ id: task.id }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.title).toBe('Specific Task');
  });

  it('should return 404 for non-existent task', async () => {
    const req = createMockRequest('/api/tasks/non-existent-id');
    const res = await getTaskById(req, {
      params: Promise.resolve({ id: 'non-existent-id' }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Task not found');
  });
});

describe('PUT /api/tasks/:id', () => {
  it('should update a task', async () => {
    const task = await createTestTask({ title: 'Original', status: 'todo' });

    const req = createMockRequest(`/api/tasks/${task.id}`, {
      method: 'PUT',
      body: {
        title: 'Updated Title',
        priority: 'high',
        status: 'in_progress',
      },
    });

    const res = await updateTask(req, { params: Promise.resolve({ id: task.id }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.title).toBe('Updated Title');
    expect(data.status).toBe('in_progress');
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('should delete a task', async () => {
    const task = await createTestTask({ title: 'To Delete' });

    const req = createMockRequest(`/api/tasks/${task.id}`, { method: 'DELETE' });
    const res = await deleteTask(req, { params: Promise.resolve({ id: task.id }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
