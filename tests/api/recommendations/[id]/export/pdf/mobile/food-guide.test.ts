/**
 * 移动端红绿灯食物指南 PDF 导出 API 测试
 * GET /api/recommendations/[id]/export/pdf/mobile/food-guide
 *
 * TDD: 测试移动端PDF导出功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock functions
const mockAuth = vi.fn();
const mockRecommendationFindFirst = vi.fn();

// Mock modules
vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    recommendation: {
      findFirst: mockRecommendationFindFirst,
    },
  },
}));

// Mock the PDF generator
const mockGenerateFoodGuidePDFMobile = vi.fn();
vi.mock('@/lib/pdf/generator', () => ({
  generateFoodGuidePDFMobile: mockGenerateFoodGuidePDFMobile,
}));

// Dynamic import
let GET: any;

describe('移动端红绿灯食物指南 PDF 导出 API - TDD', () => {
  const mockUserId = 'test-user-id';
  const mockClientId = 'test-client-id';
  const mockRecommendationId = 'test-recommendation-id';
  const mockClientName = '测试客户';

  // Mock recommendation with trafficLightFoods
  const mockRecommendationWithFoodGuide = {
    id: mockRecommendationId,
    clientId: mockClientId,
    type: 'COMPREHENSIVE',
    generatedAt: new Date('2024-03-01'),
    content: {
      trafficLightFoods: {
        green: [
          {
            food: '西兰花',
            category: '蔬菜类',
            reason: '富含维生素C和纤维',
            nutrients: ['维生素C', '膳食纤维', '钾'],
            serving: '每餐100-150g',
            frequency: '每日2-3次',
          },
          {
            food: '菠菜',
            category: '蔬菜类',
            reason: '富含铁和叶酸',
            nutrients: ['铁', '叶酸', '维生素A'],
            serving: '每餐100g',
            frequency: '每日1-2次',
          },
        ],
        yellow: [
          {
            food: '白米饭',
            category: '主食类',
            reason: '精制碳水，适量食用',
            nutrients: ['碳水化合物'],
            limit: '每餐不超过1小碗',
          },
        ],
        red: [
          {
            food: '油炸食品',
            category: '其他',
            reason: '高脂肪高热量，不利于健康',
            alternatives: ['清蒸', '水煮'],
          },
        ],
      },
    },
    client: {
      id: mockClientId,
      name: mockClientName,
    },
  };

  // Mock PDF buffer
  const mockPDFBuffer = Buffer.from('mock-pdf-content');

  beforeAll(async () => {
    const route = await import('@/app/api/recommendations/[id]/export/pdf/mobile/food-guide/route');
    GET = route.GET;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com', name: 'Test User' },
    });

    // Mock PDF generation
    mockGenerateFoodGuidePDFMobile.mockResolvedValue(mockPDFBuffer);
  });

  describe('GET /api/recommendations/[id]/export/pdf/mobile/food-guide - 基础功能测试', () => {
    it('应该成功生成移动端PDF并返回', async () => {
      mockRecommendationFindFirst.mockResolvedValue(mockRecommendationWithFoodGuide);

      const request = new Request(
        `http://localhost:3000/api/recommendations/${mockRecommendationId}/export/pdf/mobile/food-guide`,
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: mockRecommendationId }) });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      // URL encoded: 移动版 -> %E7%A7%BB%E5%8A%A8%E7%89%88
      expect(response.headers.get('Content-Disposition')).toContain('%E7%A7%BB%E5%8A%A8%E7%89%88');
      expect(response.headers.get('Content-Disposition')).toContain(encodeURIComponent(mockClientName));
      expect(mockGenerateFoodGuidePDFMobile).toHaveBeenCalledWith(
        mockRecommendationWithFoodGuide.content,
        mockClientName,
        expect.any(String)
      );
    });

    it('应该拒绝未授权的请求', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request(
        `http://localhost:3000/api/recommendations/${mockRecommendationId}/export/pdf/mobile/food-guide`,
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: mockRecommendationId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('未授权');
    });

    it('应该拒绝不存在的推荐', async () => {
      mockRecommendationFindFirst.mockResolvedValue(null);

      const request = new Request(
        `http://localhost:3000/api/recommendations/${mockRecommendationId}/export/pdf/mobile/food-guide`,
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: mockRecommendationId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('推荐不存在');
    });

    it('应该拒绝缺少食物指南数据的推荐', async () => {
      mockRecommendationFindFirst.mockResolvedValue({
        ...mockRecommendationWithFoodGuide,
        content: {},
      });

      const request = new Request(
        `http://localhost:3000/api/recommendations/${mockRecommendationId}/export/pdf/mobile/food-guide`,
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: mockRecommendationId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('暂无食物指南数据');
    });

    it('应该拒绝不属于当前用户的推荐', async () => {
      mockRecommendationFindFirst.mockResolvedValue(null);

      const request = new Request(
        `http://localhost:3000/api/recommendations/${mockRecommendationId}/export/pdf/mobile/food-guide`,
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: mockRecommendationId }) });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/recommendations/[id]/export/pdf/mobile/food-guide - PDF生成测试', () => {
    it('应该正确传递客户名称和生成日期', async () => {
      mockRecommendationFindFirst.mockResolvedValue(mockRecommendationWithFoodGuide);

      const request = new Request(
        `http://localhost:3000/api/recommendations/${mockRecommendationId}/export/pdf/mobile/food-guide`,
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: mockRecommendationId }) });

      expect(response.status).toBe(200);

      // Verify PDF generator was called with correct parameters
      // Date format from toLocaleDateString('zh-CN') is "2024/3/1"
      expect(mockGenerateFoodGuidePDFMobile).toHaveBeenCalledWith(
        mockRecommendationWithFoodGuide.content,
        mockClientName,
        expect.stringMatching(/\d{4}\/\d{1,2}\/\d{1,2}/)
      );
    });

    it('应该处理没有客户名称的情况', async () => {
      const recommendationWithoutClientName = {
        ...mockRecommendationWithFoodGuide,
        client: {
          id: mockClientId,
          name: null,
        },
      };

      mockRecommendationFindFirst.mockResolvedValue(recommendationWithoutClientName);

      const request = new Request(
        `http://localhost:3000/api/recommendations/${mockRecommendationId}/export/pdf/mobile/food-guide`,
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: mockRecommendationId }) });

      expect(response.status).toBe(200);
      expect(mockGenerateFoodGuidePDFMobile).toHaveBeenCalledWith(
        recommendationWithoutClientName.content,
        '客户',
        expect.any(String)
      );
    });
  });

  describe('GET /api/recommendations/[id]/export/pdf/mobile/food-guide - 错误处理测试', () => {
    it('应该处理PDF生成失败的情况', async () => {
      mockRecommendationFindFirst.mockResolvedValue(mockRecommendationWithFoodGuide);
      mockGenerateFoodGuidePDFMobile.mockRejectedValue(new Error('PDF generation failed'));

      const request = new Request(
        `http://localhost:3000/api/recommendations/${mockRecommendationId}/export/pdf/mobile/food-guide`,
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: mockRecommendationId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('PDF generation failed');
    });

    it('应该处理数据库连接错误', async () => {
      mockRecommendationFindFirst.mockRejectedValue(new Error('Database connection failed'));

      const request = new Request(
        `http://localhost:3000/api/recommendations/${mockRecommendationId}/export/pdf/mobile/food-guide`,
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: mockRecommendationId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
    });

    it('应该在开发环境返回错误堆栈', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const testError = new Error('Test error with stack');
      testError.stack = 'Error: Test error with stack\n    at test.js:10:15';

      mockRecommendationFindFirst.mockRejectedValue(testError);

      const request = new Request(
        `http://localhost:3000/api/recommendations/${mockRecommendationId}/export/pdf/mobile/food-guide`,
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: mockRecommendationId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Test error with stack');
      expect(data.details).toBeDefined();

      // Restore original env
      process.env.NODE_ENV = originalEnv;
    });

    it('应该在生产环境不返回错误堆栈', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const testError = new Error('Test error');
      testError.stack = 'Error: Test error\n    at test.js:10:15';

      mockRecommendationFindFirst.mockRejectedValue(testError);

      const request = new Request(
        `http://localhost:3000/api/recommendations/${mockRecommendationId}/export/pdf/mobile/food-guide`,
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: mockRecommendationId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.details).toBeUndefined();

      // Restore original env
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('GET /api/recommendations/[id]/export/pdf/mobile/food-guide - 文件名测试', () => {
    it('应该生成包含时间戳的文件名', async () => {
      mockRecommendationFindFirst.mockResolvedValue(mockRecommendationWithFoodGuide);

      const request = new Request(
        `http://localhost:3000/api/recommendations/${mockRecommendationId}/export/pdf/mobile/food-guide`,
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: mockRecommendationId }) });

      expect(response.status).toBe(200);

      const contentDisposition = response.headers.get('Content-Disposition');
      expect(contentDisposition).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}/); // ISO timestamp format
    });

    it('文件名应该正确编码UTF-8字符', async () => {
      mockRecommendationFindFirst.mockResolvedValue(mockRecommendationWithFoodGuide);

      const request = new Request(
        `http://localhost:3000/api/recommendations/${mockRecommendationId}/export/pdf/mobile/food-guide`,
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: mockRecommendationId }) });

      expect(response.status).toBe(200);

      const contentDisposition = response.headers.get('Content-Disposition');
      expect(contentDisposition).toContain("filename*=UTF-8''");
      expect(contentDisposition).toContain(encodeURIComponent(mockClientName));
    });
  });

  describe('GET /api/recommendations/[id]/export/pdf/mobile/food-guide - 响应头测试', () => {
    it('应该设置正确的Content-Type', async () => {
      mockRecommendationFindFirst.mockResolvedValue(mockRecommendationWithFoodGuide);

      const request = new Request(
        `http://localhost:3000/api/recommendations/${mockRecommendationId}/export/pdf/mobile/food-guide`,
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: mockRecommendationId }) });

      expect(response.headers.get('Content-Type')).toBe('application/pdf');
    });

    it('应该设置正确的Content-Length', async () => {
      mockRecommendationFindFirst.mockResolvedValue(mockRecommendationWithFoodGuide);

      const request = new Request(
        `http://localhost:3000/api/recommendations/${mockRecommendationId}/export/pdf/mobile/food-guide`,
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: mockRecommendationId }) });

      expect(response.headers.get('Content-Length')).toBe(mockPDFBuffer.length.toString());
    });

    it('应该设置为attachment下载模式', async () => {
      mockRecommendationFindFirst.mockResolvedValue(mockRecommendationWithFoodGuide);

      const request = new Request(
        `http://localhost:3000/api/recommendations/${mockRecommendationId}/export/pdf/mobile/food-guide`,
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: mockRecommendationId }) });

      const contentDisposition = response.headers.get('Content-Disposition');
      expect(contentDisposition).toContain('attachment');
    });
  });
});
