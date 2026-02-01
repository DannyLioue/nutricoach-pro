/**
 * AI饮食合规性评估API测试
 * POST /api/clients/[id]/diet-photos/[photoId]/analyze - 分析照片
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// 创建 mock 函数
const mockAuth = vi.fn();
const mockClientFindFirst = vi.fn();
const mockDietPhotoFindFirst = vi.fn();
const mockDietPhotoUpdate = vi.fn();
const mockRecommendationFindFirst = vi.fn();
const mockEvaluateDietPhotoCompliance = vi.fn();

// Mock modules
vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    client: {
      findFirst: mockClientFindFirst,
    },
    dietPhoto: {
      findFirst: mockDietPhotoFindFirst,
      update: mockDietPhotoUpdate,
    },
    recommendation: {
      findFirst: mockRecommendationFindFirst,
    },
  },
}));
vi.mock('@/lib/ai/gemini', () => ({
  evaluateDietPhotoCompliance: mockEvaluateDietPhotoCompliance,
}));

// 动态导入 API 路由
let POST: any;

describe('AI Diet Photo Analysis API', () => {
  const mockUserId = 'test-user-id';
  const mockClientId = 'test-client-id';
  const mockPhotoId = 'test-photo-id';

  const mockClient = {
    id: mockClientId,
    userId: mockUserId,
    name: '张三',
    gender: 'FEMALE',
    birthDate: new Date('1985-05-15'),
    healthConcerns: '["高血压", "失眠"]',
    preferences: '素食, 低盐',
    userRequirements: '减重',
  };

  const mockPhoto = {
    id: mockPhotoId,
    clientId: mockClientId,
    imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...',
    mealType: '午餐',
    notes: '家常菜',
    analysis: null,
    analyzedAt: null,
    uploadedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock 营养干预方案
  const mockRecommendation = {
    id: 'test-recommendation-id',
    clientId: mockClientId,
    type: 'COMPREHENSIVE',
    content: {
      dailyTargets: {
        calories: 1800,
        macros: {
          carbs: { grams: 225, percentage: '50%', kcal: 900 },
          protein: { grams: 90, percentage: '20%', kcal: 360 },
          fat: { grams: 60, percentage: '30%', kcal: 540 },
        },
        fiber: '25-35g',
        water: '2000-2500ml',
      },
      trafficLightFoods: {
        green: [
          { food: '西兰花', reason: '富含维生素C和钾' },
          { food: '鸡胸肉', reason: '优质蛋白，低脂肪' },
        ],
        yellow: [
          { food: '米饭', reason: '精制碳水', limit: '≤150g/餐' },
        ],
        red: [
          { food: '炸鸡翅', reason: '高油脂', alternatives: ['蒸鸡翅', '烤鸡翅'] },
        ],
      },
      biomarkerInterventionMapping: [
        {
          biomarker: '血压偏高',
          status: '偏高',
          mechanism: '钠摄入过多导致水钠潴留',
          nutritionalIntervention: '低钠饮食',
          foodSources: [{ food: '西兰花', nutrient: '钾', amount: '200g/天' }],
        },
      ],
      healthConcernsInterventions: {
        concerns: [
          {
            concern: '减重',
            severity: '中',
            nutritionalStrategy: {
              keyFoods: [{ food: '鸡胸肉' }],
              avoidFoods: [{ food: '炸鸡翅' }],
            },
          },
        ],
      },
    },
    generatedAt: new Date(),
  };

  // Mock 合规性评估结果
  const mockComplianceEvaluation = {
    foods: [
      { name: '米饭', category: '主食', portion: '中', cookingMethod: '蒸', estimatedCalories: 200 },
      { name: '青菜', category: '蔬菜', portion: '小', cookingMethod: '炒', estimatedCalories: 50 },
      { name: '鸡胸肉', category: '肉类', portion: '中', cookingMethod: '炒', estimatedCalories: 150 },
    ],
    mealType: '午餐',
    description: '一份包含米饭、蔬菜和肉类的午餐',
    complianceEvaluation: {
      overallScore: 85,
      overallRating: '良好',
      calorieMatch: {
        estimatedCalories: 400,
        targetCalories: 600,
        percentage: 67,
        status: 'under',
      },
      macroMatch: {
        protein: { actual: 25, target: 30, status: 'under' },
        carbs: { actual: 50, target: 75, status: 'under' },
        fat: { actual: 10, target: 20, status: 'within' },
      },
      foodTrafficLightCompliance: {
        greenFoods: ['鸡胸肉', '青菜'],
        yellowFoods: ['米饭'],
        redFoods: [],
        unknownFoods: [],
      },
      biomarkerCompliance: {
        compliantIndicators: ['血压偏高'],
        violatingIndicators: [],
        neutralIndicators: [],
      },
    },
    improvementSuggestions: {
      priority: 'medium',
      removals: [],
      additions: [
        {
          food: '深色蔬菜',
          reason: '增加膳食纤维',
          targetMeal: '当前餐',
          amount: '100g',
        },
      ],
      modifications: [
        {
          food: '米饭',
          currentIssue: '精制碳水',
          suggestedChange: '改用糙米',
          reason: '增加纤维',
        },
      ],
      portionAdjustments: [],
    },
    mealPlanAlignment: {
      matchesTargetMeal: true,
      targetMealType: 'lunch',
      alignmentScore: 80,
      suggestions: ['建议增加蔬菜比例'],
    },
    healthConcernsAlignment: {
      concernedHealthIssues: ['减重'],
      supportiveFoods: ['鸡胸肉', '青菜'],
      harmfulFoods: [],
      overallImpact: 'positive',
    },
  };

  beforeAll(async () => {
    const route = await import('@/app/api/clients/[id]/diet-photos/[photoId]/analyze/route');
    POST = route.POST;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com', name: 'Test User' },
    });
  });

  describe('POST /api/clients/[id]/diet-photos/[photoId]/analyze - AI分析照片', () => {
    it('应该成功分析照片', async () => {
      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoFindFirst.mockResolvedValue(mockPhoto);
      mockRecommendationFindFirst.mockResolvedValue(mockRecommendation);
      mockEvaluateDietPhotoCompliance.mockResolvedValue(mockComplianceEvaluation);
      mockDietPhotoUpdate.mockResolvedValue({
        ...mockPhoto,
        analysis: JSON.stringify(mockComplianceEvaluation),
        analyzedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos/test-photo-id/analyze', {
        method: 'POST',
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockClientId, photoId: mockPhotoId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.evaluation).toBeDefined();
      expect(data.evaluationMode).toBe('COMPLIANCE');
      expect(data.evaluation.complianceEvaluation.overallScore).toBe(85);
    });

    it('应该保存分析结果到数据库', async () => {
      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoFindFirst.mockResolvedValue(mockPhoto);
      mockRecommendationFindFirst.mockResolvedValue(mockRecommendation);
      mockEvaluateDietPhotoCompliance.mockResolvedValue(mockComplianceEvaluation);
      mockDietPhotoUpdate.mockResolvedValue({
        ...mockPhoto,
        analysis: JSON.stringify(mockComplianceEvaluation),
        analyzedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos/test-photo-id/analyze', {
        method: 'POST',
      });

      await POST(request, {
        params: Promise.resolve({ id: mockClientId, photoId: mockPhotoId }),
      });

      expect(mockDietPhotoUpdate).toHaveBeenCalledWith({
        where: { id: mockPhotoId },
        data: {
          analysis: expect.stringContaining('"personalizedRecommendations"'),
          analyzedAt: expect.any(Date),
        },
      });
    });

    it('应该传递客户信息给AI分析', async () => {
      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoFindFirst.mockResolvedValue(mockPhoto);
      mockRecommendationFindFirst.mockResolvedValue(mockRecommendation);
      mockEvaluateDietPhotoCompliance.mockResolvedValue(mockComplianceEvaluation);
      mockDietPhotoUpdate.mockResolvedValue({
        ...mockPhoto,
        analysis: JSON.stringify(mockComplianceEvaluation),
        analyzedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos/test-photo-id/analyze', {
        method: 'POST',
      });

      await POST(request, {
        params: Promise.resolve({ id: mockClientId, photoId: mockPhotoId }),
      });

      expect(mockRecommendationFindFirst).toHaveBeenCalledWith({
        where: {
          clientId: mockClientId,
          type: 'COMPREHENSIVE',
        },
        orderBy: {
          generatedAt: 'desc',
        },
      });
      expect(mockEvaluateDietPhotoCompliance).toHaveBeenCalledWith(
        mockPhoto.imageUrl,
        {
          name: mockClient.name,
          gender: mockClient.gender,
          age: expect.any(Number),
          healthConcerns: ['高血压', '失眠'],
          userRequirements: '减重',
          preferences: '素食, 低盐',
        },
        mockRecommendation.content
      );
    });

    it('未授权用户应该被拒绝', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos/test-photo-id/analyze', {
        method: 'POST',
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockClientId, photoId: mockPhotoId }),
      });

      expect(response.status).toBe(401);
    });

    it('客户不存在时应该返回404', async () => {
      mockClientFindFirst.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos/test-photo-id/analyze', {
        method: 'POST',
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockClientId, photoId: mockPhotoId }),
      });

      expect(response.status).toBe(404);
    });

    it('照片不存在时应该返回404', async () => {
      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoFindFirst.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos/test-photo-id/analyze', {
        method: 'POST',
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockClientId, photoId: mockPhotoId }),
      });

      expect(response.status).toBe(404);
    });

    it('AI分析失败时应该返回错误', async () => {
      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoFindFirst.mockResolvedValue(mockPhoto);
      mockRecommendationFindFirst.mockResolvedValue(mockRecommendation);
      mockEvaluateDietPhotoCompliance.mockRejectedValue(new Error('AI服务不可用'));

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos/test-photo-id/analyze', {
        method: 'POST',
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockClientId, photoId: mockPhotoId }),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('分析失败');
    });

    it('应该处理没有健康问题的客户', async () => {
      const clientWithoutConcerns = {
        ...mockClient,
        healthConcerns: null,
        preferences: null,
        userRequirements: null,
      };

      mockClientFindFirst.mockResolvedValue(clientWithoutConcerns);
      mockDietPhotoFindFirst.mockResolvedValue(mockPhoto);
      mockRecommendationFindFirst.mockResolvedValue(mockRecommendation);
      mockEvaluateDietPhotoCompliance.mockResolvedValue(mockComplianceEvaluation);
      mockDietPhotoUpdate.mockResolvedValue({
        ...mockPhoto,
        analysis: JSON.stringify(mockComplianceEvaluation),
        analyzedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos/test-photo-id/analyze', {
        method: 'POST',
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockClientId, photoId: mockPhotoId }),
      });

      expect(response.status).toBe(200);
      expect(mockEvaluateDietPhotoCompliance).toHaveBeenCalledWith(
        mockPhoto.imageUrl,
        expect.objectContaining({
          healthConcerns: [],
        }),
        mockRecommendation.content
      );
    });

    it('应该处理包含复杂分析结果的响应', async () => {
      const complexEvaluation = {
        ...mockComplianceEvaluation,
        foods: [
          ...mockComplianceEvaluation.foods,
          { name: '红烧肉', category: '肉类', portion: '大', cookingMethod: '红烧', estimatedCalories: 300 },
        ],
      };

      mockClientFindFirst.mockResolvedValue(mockClient);
      mockDietPhotoFindFirst.mockResolvedValue(mockPhoto);
      mockRecommendationFindFirst.mockResolvedValue(mockRecommendation);
      mockEvaluateDietPhotoCompliance.mockResolvedValue(complexEvaluation);
      mockDietPhotoUpdate.mockResolvedValue({
        ...mockPhoto,
        analysis: JSON.stringify(complexEvaluation),
        analyzedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/clients/test-id/diet-photos/test-photo-id/analyze', {
        method: 'POST',
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockClientId, photoId: mockPhotoId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.evaluation.foods).toHaveLength(4);
    });
  });
});
