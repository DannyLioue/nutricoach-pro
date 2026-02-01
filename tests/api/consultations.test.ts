/**
 * Integration tests for consultations API routes
 *
 * Tests the consultations API endpoints including:
 * - GET /api/clients/[id]/consultations (list)
 * - POST /api/clients/[id]/consultations (create)
 * - GET /api/clients/[id]/consultations/[consultationId] (get single)
 * - PUT /api/clients/[id]/consultations/[consultationId] (update)
 * - DELETE /api/clients/[id]/consultations/[consultationId] (delete)
 * - POST /api/clients/[id]/consultations/[consultationId]/analyze (AI analysis)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '@/app/api/clients/[id]/consultations/route';
import { GET as GET_SINGLE, PUT, DELETE } from '@/app/api/clients/[id]/consultations/[consultationId]/route';
import { POST as ANALYZE } from '@/app/api/clients/[id]/consultations/[consultationId]/analyze/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    consultation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    client: {
      findFirst: vi.fn(),
    },
    recommendation: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/client-access', () => ({
  verifyClientAccess: vi.fn(),
}));

vi.mock('@/lib/ai/gemini', () => ({
  analyzeConsultation: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    apiRequest: vi.fn(),
    apiSuccess: vi.fn(),
    apiError: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { analyzeConsultation } from '@/lib/ai/gemini';
import { logger } from '@/lib/logger';

describe('Consultations API Integration Tests', () => {
  const mockUserId = 'user-123';
  const mockClientId = 'client-123';
  const mockConsultationId = 'consultation-123';

  const mockConsultation = {
    id: mockConsultationId,
    clientId: mockClientId,
    consultationDate: new Date('2024-01-15'),
    consultationType: '复诊',
    sessionNotes: '客户反馈良好',
    images: JSON.stringify([
      {
        id: 'img-1',
        imageUrl: 'data:image/jpeg;base64,mock',
        uploadedAt: '2024-01-15T10:00:00Z',
        description: '测试图片',
      },
    ]),
    textFiles: JSON.stringify([
      {
        id: 'text-1',
        fileName: 'consultation.txt',
        fileType: 'txt',
        content: '这是咨询文本内容',
        uploadedAt: '2024-01-15T10:00:00Z',
      },
    ]),
    analysis: null,
    analyzedAt: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock auth to return authenticated user
    (auth as any).mockResolvedValue({
      user: { id: mockUserId },
    });

    // Mock verifyClientAccess
    (verifyClientAccess as any).mockResolvedValue({
      exists: true,
      client: {
        id: mockClientId,
        name: '测试客户',
        gender: 'FEMALE',
        birthDate: new Date('1990-01-01'),
        healthConcerns: '["高血压", "糖尿病"]',
      },
    });

    // Mock logger methods
    (logger.apiRequest as any).mockReturnValue(undefined);
    (logger.apiSuccess as any).mockReturnValue(undefined);
    (logger.apiError as any).mockReturnValue(undefined);
    (logger.error as any).mockReturnValue(undefined);
    (logger.debug as any).mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/clients/[id]/consultations', () => {
    it('should return list of consultations for authenticated user', async () => {
      (prisma.consultation.findMany as any).mockResolvedValue([mockConsultation]);

      const request = new NextRequest(`http://localhost/api/clients/${mockClientId}/consultations`);
      const response = await GET(request, { params: Promise.resolve({ id: mockClientId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.consultations).toHaveLength(1);
      expect(data.consultations[0].id).toBe(mockConsultationId);
      expect(Array.isArray(data.consultations[0].images)).toBe(true);
      expect(Array.isArray(data.consultations[0].textFiles)).toBe(true);
    });

    it('should return empty array when no consultations exist', async () => {
      (prisma.consultation.findMany as any).mockResolvedValue([]);

      const request = new NextRequest(`http://localhost/api/clients/${mockClientId}/consultations`);
      const response = await GET(request, { params: Promise.resolve({ id: mockClientId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.consultations).toEqual([]);
    });

    it('should return 401 when user is not authenticated', async () => {
      (auth as any).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost/api/clients/${mockClientId}/consultations`);
      const response = await GET(request, { params: Promise.resolve({ id: mockClientId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('未授权');
    });

    it('should return 404 when client does not exist', async () => {
      (verifyClientAccess as any).mockResolvedValue({
        exists: false,
        error: '客户不存在',
        statusCode: 404,
      });

      const request = new NextRequest(`http://localhost/api/clients/${mockClientId}/consultations`);
      const response = await GET(request, { params: Promise.resolve({ id: mockClientId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('客户不存在');
    });

    it('should return consultations ordered by date descending', async () => {
      const consultations = [
        { ...mockConsultation, id: 'c3', consultationDate: new Date('2024-01-20') },
        { ...mockConsultation, id: 'c2', consultationDate: new Date('2024-01-15') },
        { ...mockConsultation, id: 'c1', consultationDate: new Date('2024-01-10') },
      ];

      (prisma.consultation.findMany as any).mockResolvedValue(consultations);

      const request = new NextRequest(`http://localhost/api/clients/${mockClientId}/consultations`);
      const response = await GET(request, { params: Promise.resolve({ id: mockClientId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.consultations[0].id).toBe('c3');
      expect(data.consultations[1].id).toBe('c2');
      expect(data.consultations[2].id).toBe('c1');
    });

    it('should handle database errors gracefully', async () => {
      (prisma.consultation.findMany as any).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest(`http://localhost/api/clients/${mockClientId}/consultations`);
      const response = await GET(request, { params: Promise.resolve({ id: mockClientId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('获取咨询记录失败');
      expect(logger.apiError).toHaveBeenCalled();
    });
  });

  describe('POST /api/clients/[id]/consultations', () => {
    const validConsultationData = {
      consultationType: '初诊',
      sessionNotes: '这是第一次咨询',
    };

    it('should create consultation successfully', async () => {
      (prisma.client.findFirst as any).mockResolvedValue({ id: mockClientId });
      (prisma.consultation.create as any).mockResolvedValue(mockConsultation);

      const request = new NextRequest(`http://localhost/api/clients/${mockClientId}/consultations`, {
        method: 'POST',
        body: JSON.stringify(validConsultationData),
      });

      const response = await POST(request, { params: Promise.resolve({ id: mockClientId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.consultation).toBeDefined();
      expect(logger.apiSuccess).toHaveBeenCalled();
    });

    it('should create consultation with images', async () => {
      (prisma.client.findFirst as any).mockResolvedValue({ id: mockClientId });
      (prisma.consultation.create as any).mockResolvedValue(mockConsultation);

      const dataWithImages = {
        ...validConsultationData,
        images: [
          { data: 'data:image/jpeg;base64,mock1', description: '图片1' },
          { data: 'data:image/jpeg;base64,mock2', description: '图片2' },
        ],
      };

      const request = new NextRequest(`http://localhost/api/clients/${mockClientId}/consultations`, {
        method: 'POST',
        body: JSON.stringify(dataWithImages),
      });

      const response = await POST(request, { params: Promise.resolve({ id: mockClientId }) });

      expect(response.status).toBe(200);
      expect(prisma.consultation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            images: expect.stringContaining('"data":'),
          }),
        })
      );
    });

    it('should create consultation with text files', async () => {
      (prisma.client.findFirst as any).mockResolvedValue({ id: mockClientId });
      (prisma.consultation.create as any).mockResolvedValue(mockConsultation);

      const dataWithText = {
        ...validConsultationData,
        textFiles: [
          { content: '这是文本内容1', fileName: 'consultation1.txt', fileType: 'txt' },
          { content: '这是文本内容2', fileName: 'consultation2.txt', fileType: 'txt' },
        ],
      };

      const request = new NextRequest(`http://localhost/api/clients/${mockClientId}/consultations`, {
        method: 'POST',
        body: JSON.stringify(dataWithText),
      });

      const response = await POST(request, { params: Promise.resolve({ id: mockClientId }) });

      expect(response.status).toBe(200);
      expect(prisma.consultation.create).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      (auth as any).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost/api/clients/${mockClientId}/consultations`, {
        method: 'POST',
        body: JSON.stringify(validConsultationData),
      });

      const response = await POST(request, { params: Promise.resolve({ id: mockClientId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('未授权');
    });

    it('should return 404 when client does not exist', async () => {
      (prisma.client.findFirst as any).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost/api/clients/${mockClientId}/consultations`, {
        method: 'POST',
        body: JSON.stringify(validConsultationData),
      });

      const response = await POST(request, { params: Promise.resolve({ id: mockClientId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('客户不存在');
    });

    it('should return 400 for invalid consultation type', async () => {
      (prisma.client.findFirst as any).mockResolvedValue({ id: mockClientId });

      const invalidData = {
        ...validConsultationData,
        consultationType: '无效类型',
      };

      const request = new NextRequest(`http://localhost/api/clients/${mockClientId}/consultations`, {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request, { params: Promise.resolve({ id: mockClientId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('数据验证失败');
      expect(data.details).toBeDefined();
    });

    it('should use default values for optional fields', async () => {
      (prisma.client.findFirst as any).mockResolvedValue({ id: mockClientId });
      (prisma.consultation.create as any).mockResolvedValue(mockConsultation);

      const minimalData = {
        consultationType: '复诊',
      };

      const request = new NextRequest(`http://localhost/api/clients/${mockClientId}/consultations`, {
        method: 'POST',
        body: JSON.stringify(minimalData),
      });

      const response = await POST(request, { params: Promise.resolve({ id: mockClientId }) });

      expect(response.status).toBe(200);
      expect(prisma.consultation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clientId: mockClientId,
            consultationType: '复诊',
          }),
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      (prisma.client.findFirst as any).mockResolvedValue({ id: mockClientId });
      (prisma.consultation.create as any).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest(`http://localhost/api/clients/${mockClientId}/consultations`, {
        method: 'POST',
        body: JSON.stringify(validConsultationData),
      });

      const response = await POST(request, { params: Promise.resolve({ id: mockClientId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('创建咨询记录失败');
    });
  });

  describe('GET /api/clients/[id]/consultations/[consultationId]', () => {
    it('should return single consultation', async () => {
      (prisma.consultation.findFirst as any).mockResolvedValue(mockConsultation);

      const request = new NextRequest(
        `http://localhost/api/clients/${mockClientId}/consultations/${mockConsultationId}`
      );
      const response = await GET_SINGLE(request, {
        params: Promise.resolve({ id: mockClientId, consultationId: mockConsultationId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.consultation).toBeDefined();
      expect(data.consultation.id).toBe(mockConsultationId);
    });

    it('should return 404 when consultation does not exist', async () => {
      (prisma.consultation.findFirst as any).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost/api/clients/${mockClientId}/consultations/${mockConsultationId}`
      );
      const response = await GET_SINGLE(request, {
        params: Promise.resolve({ id: mockClientId, consultationId: mockConsultationId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('咨询记录不存在');
    });

    it('should return 401 when user is not authenticated', async () => {
      (auth as any).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost/api/clients/${mockClientId}/consultations/${mockConsultationId}`
      );
      const response = await GET_SINGLE(request, {
        params: Promise.resolve({ id: mockClientId, consultationId: mockConsultationId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/clients/[id]/consultations/[consultationId]', () => {
    it('should update consultation successfully', async () => {
      (prisma.client.findFirst as any).mockResolvedValue({ id: mockClientId });
      (prisma.consultation.findFirst as any).mockResolvedValue(mockConsultation);
      (prisma.consultation.update as any).mockResolvedValue({
        ...mockConsultation,
        sessionNotes: '更新后的笔记',
      });

      const updateData = {
        sessionNotes: '更新后的笔记',
      };

      const request = new NextRequest(
        `http://localhost/api/clients/${mockClientId}/consultations/${mockConsultationId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockClientId, consultationId: mockConsultationId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(logger.apiSuccess).toHaveBeenCalled();
    });

    it('should return 404 when consultation does not exist', async () => {
      (prisma.client.findFirst as any).mockResolvedValue({ id: mockClientId });
      (prisma.consultation.findFirst as any).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost/api/clients/${mockClientId}/consultations/${mockConsultationId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ sessionNotes: '更新' }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockClientId, consultationId: mockConsultationId }),
      });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid update data', async () => {
      (prisma.client.findFirst as any).mockResolvedValue({ id: mockClientId });
      (prisma.consultation.findFirst as any).mockResolvedValue(mockConsultation);

      const invalidData = {
        consultationType: 'invalid-type',
      };

      const request = new NextRequest(
        `http://localhost/api/clients/${mockClientId}/consultations/${mockConsultationId}`,
        {
          method: 'PUT',
          body: JSON.stringify(invalidData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockClientId, consultationId: mockConsultationId }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/clients/[id]/consultations/[consultationId]', () => {
    it('should delete consultation successfully', async () => {
      (prisma.client.findFirst as any).mockResolvedValue({ id: mockClientId });
      (prisma.consultation.findFirst as any).mockResolvedValue(mockConsultation);
      (prisma.consultation.delete as any).mockResolvedValue(mockConsultation);

      const request = new NextRequest(
        `http://localhost/api/clients/${mockClientId}/consultations/${mockConsultationId}`,
        { method: 'DELETE' }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockClientId, consultationId: mockConsultationId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('咨询记录已删除');
      expect(logger.apiSuccess).toHaveBeenCalled();
    });

    it('should return 404 when consultation does not exist', async () => {
      (prisma.client.findFirst as any).mockResolvedValue({ id: mockClientId });
      (prisma.consultation.findFirst as any).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost/api/clients/${mockClientId}/consultations/${mockConsultationId}`,
        { method: 'DELETE' }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockClientId, consultationId: mockConsultationId }),
      });

      expect(response.status).toBe(404);
    });

    it('should return 401 when user is not authenticated', async () => {
      (auth as any).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost/api/clients/${mockClientId}/consultations/${mockConsultationId}`,
        { method: 'DELETE' }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockClientId, consultationId: mockConsultationId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/clients/[id]/consultations/[consultationId]/analyze', () => {
    const mockAnalysis = {
      summary: '客户整体状况良好',
      dietChanges: {
        reportedChanges: ['减少糖分摄入'],
        newPreferences: ['喜欢清淡口味'],
        complianceLevel: 'high',
      },
      physicalConditionFeedback: {
        symptoms: [],
        energyLevel: '良好',
        digestion: '正常',
        sleep: '改善',
      },
      implementationProgress: {
        followedRecommendations: ['饮食控制'],
        challenges: [],
        missedItems: [],
      },
      newProblemsAndRequirements: {
        healthConcerns: [],
        goals: ['维持当前状态'],
        constraints: [],
        questions: [],
      },
      nutritionistActionItems: {
        priority: 'medium',
        followUpActions: ['定期监测'],
        adjustments: [],
      },
      contextForRecommendations: {
        updatedPreferences: [],
        newAllergies: [],
        newConstraints: [],
        motivationLevel: 'high',
      },
    };

    it('should analyze consultation successfully', async () => {
      (prisma.consultation.findFirst as any).mockResolvedValue(mockConsultation);
      (prisma.recommendation.findFirst as any).mockResolvedValue(null);
      (analyzeConsultation as any).mockResolvedValue(mockAnalysis);
      (prisma.consultation.update as any).mockResolvedValue({
        ...mockConsultation,
        analysis: JSON.stringify(mockAnalysis),
        analyzedAt: new Date(),
      });

      const request = new NextRequest(
        `http://localhost/api/clients/${mockClientId}/consultations/${mockConsultationId}/analyze`,
        { method: 'POST' }
      );

      const response = await ANALYZE(request, {
        params: Promise.resolve({ id: mockClientId, consultationId: mockConsultationId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.analysis).toEqual(mockAnalysis);
      expect(data.analyzedAt).toBeDefined();
      expect(analyzeConsultation).toHaveBeenCalled();
      expect(logger.apiSuccess).toHaveBeenCalled();
    });

    it('should pass client info to AI analysis', async () => {
      (prisma.consultation.findFirst as any).mockResolvedValue(mockConsultation);
      (prisma.recommendation.findFirst as any).mockResolvedValue(null);
      (analyzeConsultation as any).mockResolvedValue(mockAnalysis);
      (prisma.consultation.update as any).mockResolvedValue({
        ...mockConsultation,
        analysis: JSON.stringify(mockAnalysis),
        analyzedAt: new Date(),
      });

      const request = new NextRequest(
        `http://localhost/api/clients/${mockClientId}/consultations/${mockConsultationId}/analyze`,
        { method: 'POST' }
      );

      await ANALYZE(request, {
        params: Promise.resolve({ id: mockClientId, consultationId: mockConsultationId }),
      });

      expect(analyzeConsultation).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.any(String),
          gender: expect.any(String),
          age: expect.any(Number),
          healthConcerns: expect.any(Array),
        }),
        expect.objectContaining({
          sessionNotes: expect.any(String),
        })
      );
    });

    it('should include current recommendations in analysis', async () => {
      const mockRecommendation = {
        content: { dietPlan: '低盐饮食' },
      };

      (prisma.consultation.findFirst as any).mockResolvedValue(mockConsultation);
      (prisma.recommendation.findFirst as any).mockResolvedValue(mockRecommendation);
      (analyzeConsultation as any).mockResolvedValue(mockAnalysis);
      (prisma.consultation.update as any).mockResolvedValue({
        ...mockConsultation,
        analysis: JSON.stringify(mockAnalysis),
        analyzedAt: new Date(),
      });

      const request = new NextRequest(
        `http://localhost/api/clients/${mockClientId}/consultations/${mockConsultationId}/analyze`,
        { method: 'POST' }
      );

      await ANALYZE(request, {
        params: Promise.resolve({ id: mockClientId, consultationId: mockConsultationId }),
      });

      expect(analyzeConsultation).toHaveBeenCalledWith(
        expect.objectContaining({
          currentRecommendations: mockRecommendation.content,
        }),
        expect.any(Object)
      );
    });

    it('should return 404 when consultation does not exist', async () => {
      (prisma.consultation.findFirst as any).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost/api/clients/${mockClientId}/consultations/${mockConsultationId}/analyze`,
        { method: 'POST' }
      );

      const response = await ANALYZE(request, {
        params: Promise.resolve({ id: mockClientId, consultationId: mockConsultationId }),
      });

      expect(response.status).toBe(404);
    });

    it('should return 401 when user is not authenticated', async () => {
      (auth as any).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost/api/clients/${mockClientId}/consultations/${mockConsultationId}/analyze`,
        { method: 'POST' }
      );

      const response = await ANALYZE(request, {
        params: Promise.resolve({ id: mockClientId, consultationId: mockConsultationId }),
      });

      expect(response.status).toBe(401);
    });

    it('should handle AI analysis errors gracefully', async () => {
      (prisma.consultation.findFirst as any).mockResolvedValue(mockConsultation);
      (prisma.recommendation.findFirst as any).mockResolvedValue(null);
      (analyzeConsultation as any).mockRejectedValue(new Error('AI service error'));

      const request = new NextRequest(
        `http://localhost/api/clients/${mockClientId}/consultations/${mockConsultationId}/analyze`,
        { method: 'POST' }
      );

      const response = await ANALYZE(request, {
        params: Promise.resolve({ id: mockClientId, consultationId: mockConsultationId }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('AI分析失败');
      expect(logger.apiError).toHaveBeenCalled();
    });

    it('should extract image descriptions for analysis', async () => {
      const consultationWithImages = {
        ...mockConsultation,
        images: JSON.stringify([
          { description: '餐盘照片' },
          { description: '体重记录' },
        ]),
      };

      (prisma.consultation.findFirst as any).mockResolvedValue(consultationWithImages);
      (prisma.recommendation.findFirst as any).mockResolvedValue(null);
      (analyzeConsultation as any).mockResolvedValue(mockAnalysis);
      (prisma.consultation.update as any).mockResolvedValue({
        ...mockConsultation,
        analysis: JSON.stringify(mockAnalysis),
        analyzedAt: new Date(),
      });

      const request = new NextRequest(
        `http://localhost/api/clients/${mockClientId}/consultations/${mockConsultationId}/analyze`,
        { method: 'POST' }
      );

      await ANALYZE(request, {
        params: Promise.resolve({ id: mockClientId, consultationId: mockConsultationId }),
      });

      expect(analyzeConsultation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          imageDescriptions: ['餐盘照片', '体重记录'],
        })
      );
    });

    it('should save analysis result to database', async () => {
      (prisma.consultation.findFirst as any).mockResolvedValue(mockConsultation);
      (prisma.recommendation.findFirst as any).mockResolvedValue(null);
      (analyzeConsultation as any).mockResolvedValue(mockAnalysis);
      (prisma.consultation.update as any).mockResolvedValue({
        ...mockConsultation,
        analysis: JSON.stringify(mockAnalysis),
        analyzedAt: new Date(),
      });

      const request = new NextRequest(
        `http://localhost/api/clients/${mockClientId}/consultations/${mockConsultationId}/analyze`,
        { method: 'POST' }
      );

      await ANALYZE(request, {
        params: Promise.resolve({ id: mockClientId, consultationId: mockConsultationId }),
      });

      expect(prisma.consultation.update).toHaveBeenCalledWith({
        where: { id: mockConsultationId },
        data: {
          analysis: JSON.stringify(mockAnalysis),
          analyzedAt: expect.any(Date),
        },
      });
    });
  });
});
