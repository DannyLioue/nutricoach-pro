/**
 * Dashboard Todos API 测试
 * GET /api/dashboard/todos - 获取待办事项
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock functions
const mockAuth = vi.fn();
const mockDietPhotoFindMany = vi.fn();
const mockClientFindMany = vi.fn();
const mockMealGroupFindMany = vi.fn();

// Mock modules
vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    dietPhoto: {
      findMany: mockDietPhotoFindMany,
    },
    client: {
      findMany: mockClientFindMany,
    },
    dietPhotoMealGroup: {
      findMany: mockMealGroupFindMany,
    },
  },
}));

// Dynamic import
let GET: any;

describe('Dashboard Todos API', () => {
  const mockUserId = 'test-user-id';
  const mockClientId = 'test-client-id';

  const mockPendingPhotos = [
    {
      id: 'photo-1',
      clientId: mockClientId,
      uploadedAt: new Date('2025-01-26'),
      mealType: '午餐',
      client: { id: mockClientId, name: '张三' },
    },
    {
      id: 'photo-2',
      clientId: mockClientId,
      uploadedAt: new Date('2025-01-25'),
      mealType: '晚餐',
      client: { id: mockClientId, name: '张三' },
    },
  ];

  const mockClients = [
    {
      id: mockClientId,
      name: '张三',
      _count: {
        reports: 2,
        recommendations: 0,
      },
    },
  ];

  const mockPendingMealGroups = [
    {
      id: 'group-1',
      clientId: mockClientId,
      name: '周一午餐',
      createdAt: new Date('2025-01-26'),
      client: { id: mockClientId, name: '张三' },
      _count: { photos: 3 },
    },
  ];

  beforeAll(async () => {
    const route = await import('@/app/api/dashboard/todos/route');
    GET = route.GET;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com', name: 'Test User' },
    });
  });

  describe('GET /api/dashboard/todos', () => {
    it('应该成功返回所有待办事项', async () => {
      mockDietPhotoFindMany.mockResolvedValue(mockPendingPhotos);
      mockClientFindMany.mockResolvedValue(mockClients);
      mockMealGroupFindMany.mockResolvedValue(mockPendingMealGroups);

      const request = new Request('http://localhost:3000/api/dashboard/todos');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.pendingPhotos).toHaveLength(2);
      expect(data.pendingPhotos[0].clientName).toBe('张三');
      expect(data.pendingRecommendations).toHaveLength(1);
      expect(data.pendingRecommendations[0].name).toBe('张三');
      expect(data.pendingRecommendations[0].hasReports).toBe(true);
      expect(data.pendingMealGroups).toHaveLength(1);
      expect(data.pendingMealGroups[0].name).toBe('周一午餐');
    });

    it('应该只返回待分析的照片（analysis为null）', async () => {
      mockDietPhotoFindMany.mockResolvedValue(mockPendingPhotos);
      mockClientFindMany.mockResolvedValue([]);
      mockMealGroupFindMany.mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/dashboard/todos');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.pendingPhotos).toHaveLength(2);
    });

    it('应该只返回有报告但无COMPREHENSIVE建议的客户', async () => {
      mockDietPhotoFindMany.mockResolvedValue([]);
      mockClientFindMany.mockResolvedValue(mockClients);
      mockMealGroupFindMany.mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/dashboard/todos');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.pendingRecommendations).toHaveLength(1);
      expect(data.pendingRecommendations[0].reportsCount).toBe(2);
    });

    it('应该只返回待分析的食谱组（combinedAnalysis为null）', async () => {
      mockDietPhotoFindMany.mockResolvedValue([]);
      mockClientFindMany.mockResolvedValue([]);
      mockMealGroupFindMany.mockResolvedValue(mockPendingMealGroups);

      const request = new Request('http://localhost:3000/api/dashboard/todos');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.pendingMealGroups).toHaveLength(1);
      expect(data.pendingMealGroups[0].photoCount).toBe(3);
    });

    it('应该返回空数组当没有待办事项时', async () => {
      mockDietPhotoFindMany.mockResolvedValue([]);
      mockClientFindMany.mockResolvedValue([]);
      mockMealGroupFindMany.mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/dashboard/todos');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.pendingPhotos).toHaveLength(0);
      expect(data.pendingRecommendations).toHaveLength(0);
      expect(data.pendingMealGroups).toHaveLength(0);
    });

    it('未授权用户应该被拒绝', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/dashboard/todos');

      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });
});
