/**
 * Task Progress API 测试
 * 测试周饮食汇总任务的断点续传功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST as startPOST } from '@/app/api/clients/[id]/weekly-diet-summary/task/start/route';
import { GET as statusGET, POST as pausePOST } from '@/app/api/clients/[id]/weekly-diet-summary/task/[taskId]/route';
import { POST as resumePOST } from '@/app/api/clients/[id]/weekly-diet-summary/task/[taskId]/resume/route';
import { DELETE as cancelDELETE } from '@/app/api/clients/[id]/weekly-diet-summary/task/[taskId]/cancel/route';
import { TaskStatus } from '@/types';

// Mock modules
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() => ({ user: { id: 'test-user-id' } })),
}));

vi.mock('@/lib/auth/client-access', () => ({
  verifyClientAccess: vi.fn(() => ({ exists: true })),
}));

vi.mock('@/lib/task-progress/manager', () => ({
  createTask: vi.fn(() => ({
    id: 'test-task-id',
    clientId: 'test-client-id',
    taskType: 'weekly-summary',
    status: 'PENDING',
    currentStep: null,
    progress: 0,
    completedSteps: [],
    startedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })),
  getTask: vi.fn(() => ({
    id: 'test-task-id',
    clientId: 'test-client-id',
    taskType: 'weekly-summary',
    status: 'RUNNING',
    currentStep: 'analyze',
    progress: 45,
    completedSteps: ['auth', 'fetch'],
    startedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })),
  getActiveTask: vi.fn(() => null),
  updateTaskStatus: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    taskProgress: {
      update: vi.fn(() => ({})),
    },
  },
}));

describe('Task Progress API - POST /task/start', () => {
  const mockClientId = 'test-client-id';
  const mockTaskId = 'test-task-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该成功创建新任务', async () => {
    const { createTask } = await import('@/lib/task-progress/manager');
    const request = {
      json: async () => ({
        startDate: '2026-02-01',
        endDate: '2026-02-07',
        summaryType: 'custom',
      }),
    } as any;

    const params = Promise.resolve({ id: mockClientId });

    const response = await startPOST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.taskId).toBe(mockTaskId);
    expect(data.status).toBe('PENDING');
    expect(data.sseUrl).toContain(mockTaskId);
    expect(data.sseUrl).toContain('/stream');
  });

  it('日期范围超过7天应该返回400', async () => {
    const request = {
      json: async () => ({
        startDate: '2026-02-01',
        endDate: '2026-02-10', // 10天
      }),
    } as any;

    const params = Promise.resolve({ id: mockClientId });

    const response = await startPOST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('不能超过7天');
  });

  it('开始日期晚于结束日期应该返回400', async () => {
    const request = {
      json: async () => ({
        startDate: '2026-02-10',
        endDate: '2026-02-01',
      }),
    } as any;

    const params = Promise.resolve({ id: mockClientId });

    const response = await startPOST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});

describe('Task Progress API - GET /task/[taskId]', () => {
  const mockClientId = 'test-client-id';
  const mockTaskId = 'test-task-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该成功获取任务状态', async () => {
    const request = {} as any;
    const params = Promise.resolve({ id: mockClientId, taskId: mockTaskId });

    const response = await statusGET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.task).toBeDefined();
    expect(data.task.id).toBe(mockTaskId);
    expect(data.task.status).toBe('RUNNING');
  });

  it('任务不存在时应该返回404', async () => {
    const { getTask } = await import('@/lib/task-progress/manager');
    vi.mocked(getTask).mockResolvedValueOnce(null);

    const request = {} as any;
    const params = Promise.resolve({ id: mockClientId, taskId: mockTaskId });

    const response = await statusGET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('任务不存在');
  });
});

describe('Task Progress API - POST /task/[taskId] (pause)', () => {
  const mockClientId = 'test-client-id';
  const mockTaskId = 'test-task-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该成功暂停运行中的任务', async () => {
    const request = {} as any;
    const params = Promise.resolve({ id: mockClientId, taskId: mockTaskId });

    const response = await pausePOST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('暂停');
    expect(data.canResume).toBe(true);
  });
});

describe('Task Progress API - POST /task/[taskId]/resume', () => {
  const mockClientId = 'test-client-id';
  const mockTaskId = 'test-task-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该成功恢复暂停的任务', async () => {
    const { getTask } = await import('@/lib/task-progress/manager');
    vi.mocked(getTask).mockResolvedValueOnce({
      id: mockTaskId,
      clientId: mockClientId,
      taskType: 'weekly-summary',
      status: 'PAUSED',
      currentStep: 'analyze',
      progress: 45,
      completedSteps: ['auth', 'fetch'],
      pausedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const request = {} as any;
    const params = Promise.resolve({ id: mockClientId, taskId: mockTaskId });

    const response = await resumePOST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('恢复');
  });
});

describe('Task Progress API - DELETE /task/[taskId]/cancel', () => {
  const mockClientId = 'test-client-id';
  const mockTaskId = 'test-task-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该成功取消运行中的任务', async () => {
    const request = {} as any;
    const params = Promise.resolve({ id: mockClientId, taskId: mockTaskId });

    const response = await cancelDELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('取消');
  });

  it('已完成的任务不能取消', async () => {
    const { getTask } = await import('@/lib/task-progress/manager');
    vi.mocked(getTask).mockResolvedValueOnce({
      id: mockTaskId,
      clientId: mockClientId,
      taskType: 'weekly-summary',
      status: 'COMPLETED',
      currentStep: null,
      progress: 100,
      completedSteps: [],
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const request = {} as any;
    const params = Promise.resolve({ id: mockClientId, taskId: mockTaskId });

    const response = await cancelDELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toContain('已完成');
  });
});
