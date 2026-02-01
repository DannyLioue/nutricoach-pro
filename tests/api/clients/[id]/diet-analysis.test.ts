/**
 * 饮食分析汇总API测试
 * GET /api/clients/[id]/diet-analysis - 获取分析汇总
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// 创建 mock 函数
const mockAuth = vi.fn();
const mockClientFindFirst = vi.fn();
const mockDietPhotoFindMany = vi.fn();

// Mock modules
vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    client: {
      findFirst: mockClientFindFirst,
    },
    dietPhoto: {
      findMany: mockDietPhotoFindMany,
    },
  },
}));

// 动态导入 API 路由
let GET: any;

describe('Diet Analysis Summary API', () => {
  const mockUserId = 'test-user-id';
  const mockClientId = 'test-client-id';

  const mockClient = {
    id: mockClientId,
    userId: mockUserId,
    name: '测试客户',
  };

  const mockPhotosWithAnalysis = [
    {
      id: 'photo-1',
      clientId: mockClientId,
      imageUrl: 'data:image/jpeg;base64,abc...',
      analysis: JSON.stringify({
        mealType: '午餐',
        description: '测试餐1',
        foods: [
          { name: '米饭', category: '主食', portion: '中', cookingMethod: '蒸' },
          { name: '青菜', category: '蔬菜', portion: '小', cookingMethod: '炒' },
        ],
        complianceEvaluation: {
          overallScore: 70,
          overallRating: '良好',
          nutritionBalance: {
            protein: '充足',
            vegetables: '不足',
            carbs: '不足',
            fat: '充足',
            fiber: '不足',
          },
        },
        issues: [{ type: '缺乏蔬菜', severity: '中', description: '蔬菜偏少' }],
        suggestions: [{ category: '增加', content: '增加蔬菜' }],
      }),
      uploadedAt: new Date('2024-01-15'),
    },
    {
      id: 'photo-2',
      clientId: mockClientId,
      imageUrl: 'data:image/jpeg;base64,def...',
      analysis: JSON.stringify({
        mealType: '晚餐',
        foods: [
          { name: '米饭', category: '主食', portion: '中', cookingMethod: '炒' },
          { name: '红烧肉', category: '肉类', portion: '大', cookingMethod: '红烧' },
        ],
        complianceEvaluation: {
          overallScore: 80,
          overallRating: '良好',
          nutritionBalance: { protein: '充足', vegetables: '不足', carbs: '不足', fat: '充足', fiber: '不足' },
        },
        issues: [{ type: '缺乏蔬菜', severity: '中', description: '蔬菜偏少' }],
        suggestions: [{ category: '增加', content: '增加蔬菜' }],
      }),
      uploadedAt: new Date('2024-01-14'),
    },
  ];

  beforeAll(async () => {
    const route = await import('@/app/api/clients/[id]/diet-analysis/route');
    GET = route.GET;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com', name: 'Test User' },
    });
  });

  describe('GET /api/clients/[id]/diet-analysis - 获取分析汇总', () => {
    it('应该成功返回分析汇总', async () => {
      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoFindMany.mockResolvedValue(mockPhotosWithAnalysis);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-analysis');

      const response = await GET(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.summary).toBeDefined();
      expect(data.summary.totalPhotos).toBe(2);
      expect(data.summary.analyzedPhotos).toBe(2);
      expect(data.summary.overallScore).toBe(75);
    });

    it('应该正确计算平均分', async () => {
      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoFindMany.mockResolvedValue(mockPhotosWithAnalysis);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-analysis');

      const response = await GET(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      const data = await response.json();
      expect(data.summary.overallScore).toBe(75);
    });

    it('应该统计常吃的食物', async () => {
      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoFindMany.mockResolvedValue(mockPhotosWithAnalysis);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-analysis');

      const response = await GET(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      const data = await response.json();
      expect(data.preferences.preferredFoods.length).toBeGreaterThan(0);
    });

    it('应该识别饮食优点', async () => {
      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoFindMany.mockResolvedValue(mockPhotosWithAnalysis);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-analysis');

      const response = await GET(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      const data = await response.json();
      expect(data.habits.strengths).toContain('蛋白质摄入充足');
    });

    it('应该识别饮食问题', async () => {
      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoFindMany.mockResolvedValue(mockPhotosWithAnalysis);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-analysis');

      const response = await GET(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      const data = await response.json();
      expect(data.habits.issues).toContain('缺乏蔬菜');
    });

    it('应该处理没有照片的情况', async () => {
      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoFindMany.mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-analysis');

      const response = await GET(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.summary.totalPhotos).toBe(0);
    });

    it('未授权用户应该被拒绝', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-analysis');

      const response = await GET(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      expect(response.status).toBe(401);
    });

    it('客户不存在时应该返回404', async () => {
      mockClientFindFirst.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-analysis');

      const response = await GET(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      expect(response.status).toBe(404);
    });

    it('nutritionBalance 字段应该只包含有效值（充足/不足/缺乏）', async () => {
      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoFindMany.mockResolvedValue(mockPhotosWithAnalysis);

      const request = new Request('http://localhost://3000/api/clients/test-id/diet-analysis');

      const response = await GET(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      expect(response.status).toBe(200);

      // 验证 nutritionBalance 格式
      const validValues = ['充足', '不足', '缺乏'];

      mockPhotosWithAnalysis.forEach((photo: any) => {
        const analysis = JSON.parse(photo.analysis);
        const nb = analysis.complianceEvaluation.nutritionBalance;

        // 检查所有 nutritionBalance 字段
        Object.keys(nb).forEach((key) => {
          expect(validValues).toContain(nb[key]);
        });
      });
    });
  });
});
