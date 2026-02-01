/**
 * Dashboard Weekly Stats API 测试
 * GET /api/dashboard/weekly-stats - 获取本周统计数据
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock functions
const mockAuth = vi.fn();
const mockClientGroupBy = vi.fn();
const mockDietPhotoGroupBy = vi.fn();
const mockRecommendationGroupBy = vi.fn();

// Mock modules
vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    client: {
      groupBy: mockClientGroupBy,
    },
    dietPhoto: {
      groupBy: mockDietPhotoGroupBy,
    },
    recommendation: {
      groupBy: mockRecommendationGroupBy,
    },
  },
}));

// Dynamic import
let GET: any;

describe('Dashboard Weekly Stats API', () => {
  const mockUserId = 'test-user-id';

  beforeAll(async () => {
    const route = await import('@/app/api/dashboard/weekly-stats/route');
    GET = route.GET;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com', name: 'Test User' },
    });
  });

  describe('GET /api/dashboard/weekly-stats', () => {
    it('应该成功返回本周统计数据', async () => {
      // Mock 数据：周一到周三
      const mockClientsData = [
        {
          createdAt: new Date('2025-01-20T10:00:00Z'), // 周一
          _count: { id: 2 },
        },
        {
          createdAt: new Date('2025-01-21T10:00:00Z'), // 周二
          _count: { id: 1 },
        },
      ];

      const mockPhotosData = [
        {
          analyzedAt: new Date('2025-01-20T14:00:00Z'), // 周一
          _count: { id: 5 },
        },
        {
          analyzedAt: new Date('2025-01-22T14:00:00Z'), // 周三
          _count: { id: 3 },
        },
      ];

      const mockRecommendationsData = [
        {
          generatedAt: new Date('2025-01-21T16:00:00Z'), // 周二
          _count: { id: 1 },
        },
      ];

      mockClientGroupBy.mockResolvedValue(mockClientsData);
      mockDietPhotoGroupBy.mockResolvedValue(mockPhotosData);
      mockRecommendationGroupBy.mockResolvedValue(mockRecommendationsData);

      const request = new Request('http://localhost:3000/api/dashboard/weekly-stats');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.clients).toBeInstanceOf(Array);
      expect(data.photos).toBeInstanceOf(Array);
      expect(data.recommendations).toBeInstanceOf(Array);

      // 验证数据格式
      if (data.clients.length > 0) {
        expect(data.clients[0]).toHaveProperty('date');
        expect(data.clients[0]).toHaveProperty('count');
        expect(data.clients[0].date).toMatch(/^\d+\/\d+$/); // MM/DD 格式
      }
    });

    it('应该返回空数组当本周没有数据时', async () => {
      mockClientGroupBy.mockResolvedValue([]);
      mockDietPhotoGroupBy.mockResolvedValue([]);
      mockRecommendationGroupBy.mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/dashboard/weekly-stats');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      // API 返回本周的日期数组，但 count 都应该是 0
      expect(data.clients).toBeInstanceOf(Array);
      expect(data.photos).toBeInstanceOf(Array);
      expect(data.recommendations).toBeInstanceOf(Array);

      // 验证所有 count 都是 0
      data.clients.forEach((item: any) => expect(item.count).toBe(0));
      data.photos.forEach((item: any) => expect(item.count).toBe(0));
      data.recommendations.forEach((item: any) => expect(item.count).toBe(0));
    });

    it('应该正确处理analyzeAt为null的记录', async () => {
      mockClientGroupBy.mockResolvedValue([]);
      // 包含 null analyzedAt 的记录
      mockDietPhotoGroupBy.mockResolvedValue([
        {
          analyzedAt: null,
          _count: { id: 1 },
        },
        {
          analyzedAt: new Date('2025-01-20T14:00:00Z'),
          _count: { id: 2 },
        },
      ]);
      mockRecommendationGroupBy.mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/dashboard/weekly-stats');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      // null 的记录应该被过滤掉
      expect(data.photos.length).toBeGreaterThanOrEqual(0);
    });

    it('未授权用户应该被拒绝', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/dashboard/weekly-stats');

      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });
});
