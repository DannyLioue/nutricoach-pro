/**
 * 饮食照片API测试
 * POST /api/clients/[id]/diet-photos - 上传照片
 * GET /api/clients/[id]/diet-photos - 获取照片列表
 * DELETE /api/clients/[id]/diet-photos/[photoId] - 删除照片
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// 创建 mock 函数
const mockAuth = vi.fn();
const mockClientFindFirst = vi.fn();
const mockClientFindMany = vi.fn();
const mockClientCreate = vi.fn();
const mockClientUpdate = vi.fn();
const mockClientDelete = vi.fn();
const mockDietPhotoFindFirst = vi.fn();
const mockDietPhotoFindMany = vi.fn();
const mockDietPhotoCreate = vi.fn();
const mockDietPhotoUpdate = vi.fn();
const mockDietPhotoDelete = vi.fn();

// Mock modules
vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    client: {
      findFirst: mockClientFindFirst,
      findMany: mockClientFindMany,
      create: mockClientCreate,
      update: mockClientUpdate,
      delete: mockClientDelete,
    },
    dietPhoto: {
      findFirst: mockDietPhotoFindFirst,
      findMany: mockDietPhotoFindMany,
      create: mockDietPhotoCreate,
      update: mockDietPhotoUpdate,
      delete: mockDietPhotoDelete,
    },
  },
}));

// 动态导入 API 路由（需要在 mock 之后）
let POST: any, GET: any, DELETE: any;

describe('Diet Photos API', () => {
  const mockUserId = 'test-user-id';
  const mockClientId = 'test-client-id';
  const mockPhotoId = 'test-photo-id';

  const mockClient = {
    id: mockClientId,
    userId: mockUserId,
    name: '测试客户',
    email: 'test@example.com',
  };

  const mockPhotos = [
    {
      id: mockPhotoId,
      clientId: mockClientId,
      imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
      mealType: '午餐',
      notes: '测试备注',
      analysis: null,
      analyzedAt: null,
      uploadedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeAll(async () => {
    // 动态导入 API 路由
    const dietPhotosRoute = await import('@/app/api/clients/[id]/diet-photos/route');
    const photoRoute = await import('@/app/api/clients/[id]/diet-photos/[photoId]/route');
    POST = dietPhotosRoute.POST;
    GET = dietPhotosRoute.GET;
    DELETE = photoRoute.DELETE;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com', name: 'Test User' },
    });
  });

  describe('POST /api/clients/[id]/diet-photos - 上传照片', () => {
    it('应该成功上传单张照片', async () => {
      const mockPhoto = {
        data: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
        mealType: '午餐',
        notes: '测试备注',
      };

      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoCreate.mockResolvedValue(mockPhotos[0]);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos', {
        method: 'POST',
        body: JSON.stringify({ photos: [mockPhoto] }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.photos).toHaveLength(1);
    });

    it('应该成功上传多张照片', async () => {
      const mockPhotosData = [
        {
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
          mealType: '早餐',
        },
        {
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
          mealType: '午餐',
        },
        {
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
          mealType: '晚餐',
        },
      ];

      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoCreate.mockResolvedValue(mockPhotos[0]);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos', {
        method: 'POST',
        body: JSON.stringify({ photos: mockPhotosData }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      expect(response.status).toBe(200);
    });

    it('应该拒绝超过9张照片的上传', async () => {
      const mockPhotosData = Array(10).fill({
        data: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
      });

      mockClientFindFirst.mockResolvedValue(mockClient);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos', {
        method: 'POST',
        body: JSON.stringify({ photos: mockPhotosData }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('数据验证失败');
    });

    it('应该拒绝空照片数组', async () => {
      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos', {
        method: 'POST',
        body: JSON.stringify({ photos: [] }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      expect(response.status).toBe(400);
    });

    it('应该拒绝无效的餐型', async () => {
      const mockPhoto = {
        data: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
        mealType: '深夜零食', // 无效餐型
      };

      mockClientFindFirst.mockResolvedValue(mockClient);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos', {
        method: 'POST',
        body: JSON.stringify({ photos: [mockPhoto] }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      expect(response.status).toBe(400);
    });

    it('未授权用户应该被拒绝', async () => {
      mockAuth.mockResolvedValue(null);

      const mockPhoto = {
        data: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
      };

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos', {
        method: 'POST',
        body: JSON.stringify({ photos: [mockPhoto] }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      expect(response.status).toBe(401);
    });

    it('应该拒绝访问其他用户的客户', async () => {
      mockClientFindFirst.mockResolvedValue(null);

      const mockPhoto = {
        data: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
      };

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos', {
        method: 'POST',
        body: JSON.stringify({ photos: [mockPhoto] }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/clients/[id]/diet-photos - 获取照片列表', () => {
    it('应该成功获取照片列表', async () => {
      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoFindMany.mockResolvedValue(mockPhotos);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos');

      const response = await GET(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.photos).toHaveLength(1);
      expect(data.photos[0].id).toBe(mockPhotoId);
    });

    it('应该返回空列表当没有照片时', async () => {
      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoFindMany.mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos');

      const response = await GET(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.photos).toHaveLength(0);
    });

    it('应该解析JSON分析结果', async () => {
      const mockPhotoWithAnalysis = {
        ...mockPhotos[0],
        analysis: JSON.stringify({
          mealType: '午餐',
          overallScore: 85,
          overallRating: '良好',
        }),
      };

      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoFindMany.mockResolvedValue([mockPhotoWithAnalysis]);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos');

      const response = await GET(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.photos[0].analysis).toBeInstanceOf(Object);
      expect(data.photos[0].analysis.overallScore).toBe(85);
    });

    it('未授权用户应该被拒绝', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos');

      const response = await GET(request, {
        params: Promise.resolve({ id: mockClientId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/clients/[id]/diet-photos/[photoId] - 删除照片', () => {
    it('应该成功删除照片', async () => {
      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoFindFirst.mockResolvedValue(mockPhotos[0]);
      mockDietPhotoDelete.mockResolvedValue(mockPhotos[0]);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos/test-photo-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockClientId, photoId: mockPhotoId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('应该拒绝删除不存在的照片', async () => {
      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoFindFirst.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos/non-existent', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockClientId, photoId: 'non-existent' }),
      });

      expect(response.status).toBe(404);
    });

    it('应该拒绝删除其他用户的照片', async () => {
      // 模拟场景：用户可以访问当前客户，但照片不存在于该客户下
      mockClientFindFirst.mockResolvedValue(mockClient);
      // 返回 null 表示照片不属于该客户
      mockDietPhotoFindFirst.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos/test-photo-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockClientId, photoId: mockPhotoId }),
      });

      expect(response.status).toBe(404);
    });

    it('未授权用户应该被拒绝', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos/test-photo-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockClientId, photoId: mockPhotoId }),
      });

      expect(response.status).toBe(401);
    });
  });
});
