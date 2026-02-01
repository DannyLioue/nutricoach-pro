/**
 * Client Recommendations API 测试
 * GET /api/clients/[id]/recommendations - 获取客户的建议列表
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock functions
const mockAuth = vi.fn();
const mockRecommendationFindMany = vi.fn();

// Mock modules
vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    recommendation: {
      findMany: mockRecommendationFindMany,
    },
  },
}));

// Dynamic import
let GET: any;

describe('Client Recommendations API', () => {
  const mockUserId = 'test-user-id';
  const mockClientId = 'test-client-id';
  const mockAnotherClientId = 'another-client-id';

  const mockRecommendations = [
    {
      id: 'rec-1',
      clientId: mockClientId,
      reportId: 'report-1',
      type: 'COMPREHENSIVE',
      content: {
        summary: '综合营养干预方案',
        dailyTargets: {
          calories: 1800,
          macros: {
            carbs: { grams: 200, percentage: '45%' },
            protein: { grams: 90, percentage: '20%' },
            fat: { grams: 60, percentage: '30%' },
          },
        },
      },
      generatedAt: new Date('2024-03-15T10:00:00Z'),
      client: {
        id: mockClientId,
        name: '张三',
      },
      report: {
        id: 'report-1',
        fileName: '体检报告2024.pdf',
        uploadedAt: new Date('2024-03-10T09:00:00Z'),
        analysis: {
          healthScore: 75,
        },
      },
    },
    {
      id: 'rec-2',
      clientId: mockClientId,
      reportId: null,
      type: 'DIET',
      content: {
        summary: '饮食调整建议',
      },
      generatedAt: new Date('2024-02-20T14:30:00Z'),
      client: {
        id: mockClientId,
        name: '张三',
      },
      report: null,
    },
    {
      id: 'rec-3',
      clientId: mockClientId,
      reportId: 'report-2',
      type: 'EXERCISE',
      content: {
        summary: '运动处方',
      },
      generatedAt: new Date('2024-01-10T09:15:00Z'),
      client: {
        id: mockClientId,
        name: '张三',
      },
      report: {
        id: 'report-2',
        fileName: '血常规检查.jpg',
        uploadedAt: new Date('2024-01-05T10:00:00Z'),
        analysis: null,
      },
    },
  ];

  beforeAll(async () => {
    const route = await import('@/app/api/clients/[id]/recommendations/route');
    GET = route.GET;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com', name: 'Test User' },
    });
  });

  describe('GET /api/clients/[id]/recommendations', () => {
    it('应该成功返回指定客户的建议列表', async () => {
      mockRecommendationFindMany.mockResolvedValue(mockRecommendations);

      const request = new Request(`http://localhost:3000/api/clients/${mockClientId}/recommendations`);

      const response = await GET(request, { params: Promise.resolve({ id: mockClientId }) });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.recommendations).toBeDefined();
      expect(data.recommendations).toHaveLength(3);
      expect(data.recommendations[0].type).toBe('COMPREHENSIVE');
    });

    it('应该按生成时间倒序排列建议', async () => {
      mockRecommendationFindMany.mockResolvedValue(mockRecommendations);

      const request = new Request(`http://localhost:3000/api/clients/${mockClientId}/recommendations`);

      const response = await GET(request, { params: Promise.resolve({ id: mockClientId }) });

      expect(response.status).toBe(200);
      const data = await response.json();

      // 验证顺序：最新在上
      const dates = data.recommendations.map((r: any) => new Date(r.generatedAt));
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i + 1].getTime());
      }
    });

    it('应该只返回属于当前用户的建议', async () => {
      mockRecommendationFindMany.mockResolvedValue(mockRecommendations);

      const request = new Request(`http://localhost:3000/api/clients/${mockClientId}/recommendations`);

      await GET(request, { params: Promise.resolve({ id: mockClientId }) });

      expect(mockRecommendationFindMany).toHaveBeenCalledWith({
        where: {
          clientId: mockClientId,
          client: {
            userId: mockUserId,
          },
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          report: {
            select: {
              id: true,
              fileName: true,
              uploadedAt: true,
              analysis: true,
            },
          },
        },
        orderBy: {
          generatedAt: 'desc',
        },
      });
    });

    it('应该返回空数组当客户没有建议时', async () => {
      mockRecommendationFindMany.mockResolvedValue([]);

      const request = new Request(`http://localhost:3000/api/clients/${mockClientId}/recommendations`);

      const response = await GET(request, { params: Promise.resolve({ id: mockClientId }) });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.recommendations).toEqual([]);
      expect(data.recommendations).toHaveLength(0);
    });

    it('未授权用户应该被拒绝', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request(`http://localhost:3000/api/clients/${mockClientId}/recommendations`);

      const response = await GET(request, { params: Promise.resolve({ id: mockClientId }) });

      expect(response.status).toBe(401);
    });

    it('应该正确处理不同类型的建议（COMPREHENSIVE, DIET, EXERCISE, LIFESTYLE）', async () => {
      mockRecommendationFindMany.mockResolvedValue(mockRecommendations);

      const request = new Request(`http://localhost:3000/api/clients/${mockClientId}/recommendations`);

      const response = await GET(request, { params: Promise.resolve({ id: mockClientId }) });

      expect(response.status).toBe(200);
      const data = await response.json();

      const types = data.recommendations.map((r: any) => r.type);
      expect(types).toContain('COMPREHENSIVE');
      expect(types).toContain('DIET');
      expect(types).toContain('EXERCISE');
    });

    it('应该正确处理没有关联报告的建议', async () => {
      mockRecommendationFindMany.mockResolvedValue(mockRecommendations);

      const request = new Request(`http://localhost:3000/api/clients/${mockClientId}/recommendations`);

      const response = await GET(request, { params: Promise.resolve({ id: mockClientId }) });

      expect(response.status).toBe(200);
      const data = await response.json();

      // 验证有 reportId 为 null 的建议
      const withoutReport = data.recommendations.filter((r: any) => r.report === null);
      expect(withoutReport.length).toBeGreaterThan(0);
    });
  });
});
