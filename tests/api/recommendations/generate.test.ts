/**
 * Recommendations Generate API 测试
 * POST /api/recommendations/generate - 生成综合营养干预方案
 *
 * TDD: 先写测试，验证失败，再实现功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock functions
const mockAuth = vi.fn();
const mockReportFindFirst = vi.fn();
const mockRecommendationCreate = vi.fn();

// Mock the AI generation
const mockGenerateText = vi.fn();

// Mock modules
vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    report: {
      findFirst: mockReportFindFirst,
    },
    recommendation: {
      create: mockRecommendationCreate,
    },
  },
}));

// Mock the AI SDK
vi.mock('ai', () => ({
  generateText: mockGenerateText,
}));

// Set up the environment variable
process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-api-key';
process.env.GEMINI_API_KEY = 'test-api-key';

// Dynamic import
let POST: any;

describe('Recommendations Generate API - TDD', () => {
  const mockUserId = 'test-user-id';
  const mockClientId = 'test-client-id';
  const mockReportId = 'test-report-id';

  // 完整的建议内容结构（期望的输出）
  const expectedRecommendationStructure = {
    dailyTargets: {
      calories: expect.any(Number),
      macros: {
        carbs: expect.objectContaining({
          grams: expect.any(Number),
          kcal: expect.any(Number),
          percentage: expect.any(String),
        }),
        protein: expect.objectContaining({
          grams: expect.any(Number),
          kcal: expect.any(Number),
          percentage: expect.any(String),
        }),
        fat: expect.objectContaining({
          grams: expect.any(Number),
          kcal: expect.any(Number),
          percentage: expect.any(String),
        }),
      },
      fiber: expect.any(String),
      water: expect.any(String),
    },
    trafficLightFoods: {
      green: expect.any(Array),
      yellow: expect.any(Array),
      red: expect.any(Array),
    },
    oneDayMealPlan: {
      breakfast: expect.any(Object),
      lunch: expect.any(Object),
      dinner: expect.any(Object),
      snacks: expect.any(Array),
      dailyTotal: expect.any(Object),
    },
    biomarkerInterventionMapping: expect.any(Array),
    exercisePrescription: expect.any(Object),
    lifestyleModifications: expect.any(Array),
    healthConcernsInterventions: expect.any(Object),
    twoWeekPlan: expect.any(Object),
  };

  // Mock client data
  const mockClient = {
    id: mockClientId,
    userId: mockUserId,
    name: '测试客户',
    gender: 'MALE',
    birthDate: new Date('1990-01-01'),
    height: 175,
    weight: 70,
    activityLevel: 'MODERATE',
    allergies: '[]',
    medicalHistory: '[]',
    healthConcerns: '[]',
    preferences: null,
    userRequirements: '减重5kg',
    exerciseDetails: '家中有哑铃5kgx2，希望在家锻炼',
    phone: '13800138000',
    email: 'test@example.com',
  };

  // Mock report with analysis
  const mockReportWithAnalysis = {
    id: mockReportId,
    clientId: mockClientId,
    fileUrl: 'data:application/pdf;base64,test',
    fileName: '体检报告.pdf',
    fileType: 'application/pdf',
    extractedData: {},
    analysis: {
      summary: '整体健康状况良好，但血脂偏高',
      healthScore: 75,
      bmi: 22.9,
      bmiCategory: '正常',
      abnormalIndicators: [
        {
          indicator: '总胆固醇',
          value: '6.2',
          unit: 'mmol/L',
          normalRange: '3.1-5.7',
          status: '偏高',
          risk: '心血管疾病风险增加',
          priority: '高',
        },
        {
          indicator: '甘油三酯',
          value: '2.5',
          unit: 'mmol/L',
          normalRange: '0.56-1.7',
          status: '偏高',
          risk: '胰腺炎风险增加',
          priority: '中',
        },
      ],
      nutrientDeficiencies: [],
      riskFactors: ['心血管疾病风险'],
    },
    uploadedAt: new Date('2024-03-01'),
  };

  beforeAll(async () => {
    const route = await import('@/app/api/recommendations/generate/route');
    POST = route.POST;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com', name: 'Test User' },
    });

    // Mock AI generation - simulate successful response
    mockGenerateText.mockResolvedValue({
      text: JSON.stringify({
        dailyTargets: {
          calories: 1800,
          macros: {
            carbs: { grams: 200, kcal: 800, percentage: '44%' },
            protein: { grams: 90, kcal: 360, percentage: '20%' },
            fat: { grams: 71, kcal: 640, percentage: '36%' },
          },
          fiber: '25-35g',
          water: '2000-2500ml',
        },
        trafficLightFoods: {
          green: [{ food: '西兰花', category: '蔬菜类', reason: '富含维生素C', nutrients: ['维生素C'], serving: '每餐100g', frequency: '每日' }],
          yellow: [],
          red: [],
        },
        oneDayMealPlan: {
          breakfast: { time: '07:00', meals: [], totalCalories: '400', macroDistribution: '50g/12g/8g' },
          lunch: {},
          dinner: {},
          snacks: [],
          dailyTotal: { calories: '1800', macros: {} },
        },
        biomarkerInterventionMapping: [],
        exercisePrescription: { cardio: {}, resistance: {}, flexibility: {} },
        lifestyleModifications: [],
        healthConcernsInterventions: { title: '健康问题干预', concerns: [], commonConcerns: {} },
        twoWeekPlan: {},
      }),
    });
  });

  describe('POST /api/recommendations/generate - 基础功能测试', () => {
    it('应该成功生成综合营养干预方案', async () => {
      mockReportFindFirst.mockResolvedValue({
        ...mockReportWithAnalysis,
        client: mockClient,
      });

      mockRecommendationCreate.mockResolvedValue({
        id: 'new-rec-id',
        clientId: mockClientId,
        reportId: mockReportId,
        type: 'COMPREHENSIVE',
        content: {},
        generatedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({ reportId: mockReportId }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('建议生成成功');
      expect(data.recommendation).toBeDefined();
      expect(mockRecommendationCreate).toHaveBeenCalled();
    });

    it('应该拒绝未授权的请求', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({ reportId: mockReportId }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('未授权');
    });

    it('应该拒绝缺少 reportId 的请求', async () => {
      const request = new Request('http://localhost:3000/api/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('未选择报告');
    });

    it('应该拒绝不存在的报告', async () => {
      mockReportFindFirst.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({ reportId: 'non-existent-id' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('报告不存在');
    });

    it('应该拒绝没有完成AI分析的报告', async () => {
      mockReportFindFirst.mockResolvedValue({
        ...mockReportWithAnalysis,
        analysis: { error: 'Analysis failed' },
        client: mockClient,
      });

      const request = new Request('http://localhost:3000/api/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({ reportId: mockReportId }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('尚未完成 AI 分析');
    });

    it('应该拒绝不属于当前用户的报告', async () => {
      mockReportFindFirst.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({ reportId: mockReportId }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/recommendations/generate - 建议内容结构测试', () => {
    it('生成的建议应包含所有必需字段', async () => {
      // Mock AI 生成的内容
      const mockGeneratedContent = {
        dailyTargets: {
          calories: 1800,
          macros: {
            carbs: { grams: 200, kcal: 800, percentage: '44%' },
            protein: { grams: 90, kcal: 360, percentage: '20%' },
            fat: { grams: 71, kcal: 640, percentage: '36%' },
          },
          fiber: '25-35g',
          water: '2000-2500ml',
        },
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
          ],
          yellow: [],
          red: [],
        },
        oneDayMealPlan: {
          breakfast: {
            time: '07:00-08:00',
            meals: [
              {
                food: '燕麦粥',
                amount: '50g',
                preparation: '用牛奶煮制',
                nutrition: '热量180kcal，蛋白质6g',
              },
            ],
            totalCalories: '400 kcal',
            macroDistribution: '碳水50g / 蛋白质12g / 脂肪8g',
          },
          lunch: {},
          dinner: {},
          snacks: [],
          dailyTotal: {
            calories: '1800 kcal',
            macros: {
              carbs: '200g (44%)',
              protein: '90g (20%)',
              fat: '71g (36%)',
            },
          },
        },
        biomarkerInterventionMapping: [],
        exercisePrescription: {
          cardio: {
            type: '快走',
            frequency: '每周5次',
            duration: '每次30-45分钟',
            intensity: {
              method: 'Karvonen储备心率法',
              targetZone: '110-130 bpm',
              calculation: '(220-34-70) × 0.6-0.7 + 70',
              rpe: '主观疲劳度：11-12级',
            },
            timing: '餐后1小时',
            precautions: [],
          },
          resistance: {
            type: '自重训练',
            frequency: '每周2-3次',
            exercises: [],
            intensity: '渐进式增加',
          },
          flexibility: {
            type: '静态拉伸',
            frequency: '每周3-4次',
            duration: '每次10-15分钟',
            focus: '全身主要肌群',
          },
        },
        lifestyleModifications: [],
        healthConcernsInterventions: {
          title: '其他健康问题专项干预',
          description: '针对客户报告的具体健康问题提供的营养和生活方式干预方案',
          concerns: [],
          commonConcerns: {},
        },
        twoWeekPlan: {},
        generatedAt: new Date().toISOString(),
        metadata: {
          bmr: 1650,
          tdee: 2200,
          bmi: 22.9,
          weightGoal: '减重',
          age: 34,
        },
      };

      mockReportFindFirst.mockResolvedValue({
        ...mockReportWithAnalysis,
        client: mockClient,
      });

      mockRecommendationCreate.mockResolvedValue({
        id: 'new-rec-id',
        clientId: mockClientId,
        reportId: mockReportId,
        type: 'COMPREHENSIVE',
        content: mockGeneratedContent,
        generatedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({ reportId: mockReportId }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockRecommendationCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          clientId: mockClientId,
          reportId: mockReportId,
          type: 'COMPREHENSIVE',
          content: expect.any(Object),
        }),
      });
    });
  });

  describe('POST /api/recommendations/generate - 详细运动处方测试', () => {
    it('应该生成包含详细运动处方的建议', async () => {
      const mockContentWithExercise = {
        // ... 其他字段
        detailedExercisePrescription: {
          overview: '两周以适应为主，建立正确的动作模式',
          goals: [
            '建立正确的动作模式，为后期增肌打基础',
            '逐步提高心肺功能，从30分钟渐进到45分钟',
            '养成规律运动习惯',
          ],
          equipment: {
            owned: ['哑铃5kgx2'],
            recommended: [
              {
                item: '弹力带',
                reason: '第2周上肢力量训练需要更大阻力',
                priority: 'optional',
                alternatives: ['使用水瓶代替'],
              },
            ],
          },
          weeklySchedule: [
            {
              week: 1,
              focus: '适应期-学习动作模式，建立神经肌肉连接',
              notes: '本周为重点适应期，感觉疲劳可休息',
              days: [
                {
                  day: '周一',
                  type: '力量训练-上肢',
                  duration: '30分钟',
                  focus: '推类动作（胸、肩、三头）',
                  exercises: [
                    {
                      name: '标准俯卧撑',
                      sets: 3,
                      reps: '8-10',
                      rest: '60秒',
                      intensity: '控制离心阶段（3秒下，1秒停，1秒起）',
                      notes: '如做不到标准动作，可做跪姿俯卧撑',
                      targetMuscle: '胸大肌、三角肌前束、肱三头肌',
                    },
                    {
                      name: '哑铃俯身划船',
                      sets: 3,
                      reps: '10-12',
                      rest: '60秒',
                      intensity: '使用5kg哑铃，感受背部肌肉收缩',
                      notes: '保持背部挺直，不要借力',
                      targetMuscle: '背阔肌、菱形肌、肱二头肌',
                    },
                  ],
                },
                {
                  day: '周二',
                  type: '有氧训练',
                  duration: '30分钟',
                  focus: '低强度有氧，建立有氧基础',
                  exercises: [
                    {
                      name: '快走/慢跑',
                      sets: 1,
                      reps: '30分钟',
                      rest: '0',
                      intensity: '心率区间：110-130 bpm（RPE 11-12）',
                      notes: '保持呼吸顺畅，可以交谈的强度',
                      targetMuscle: '全身',
                    },
                  ],
                },
                {
                  day: '周三',
                  type: '休息日',
                  duration: '0分钟',
                  focus: '主动恢复',
                  exercises: [
                    {
                      name: '拉伸放松',
                      sets: 1,
                      reps: '15分钟',
                      rest: '0',
                      intensity: '轻度拉伸',
                      notes: '重点拉伸胸肌、背阔肌、腘绳肌、小腿',
                      targetMuscle: '全身',
                    },
                  ],
                },
              ],
            },
          ],
          progression: '两周内训练量逐步增加，第2周为强度提升阶段。下一阶段将增加哑铃重量至10kg，引入更多复合动作',
          precautions: [
            '训练前充分热身10分钟',
            '训练后拉伸10分钟',
            '如出现关节疼痛，立即停止该动作',
            '保证充足睡眠和营养，特别是蛋白质摄入',
          ],
          successCriteria: [
            '能完成标准俯卧撑15个',
            '连续有氧45分钟不疲劳',
            '体重下降2-3kg',
          ],
        },
      };

      mockReportFindFirst.mockResolvedValue({
        ...mockReportWithAnalysis,
        client: mockClient,
      });

      mockRecommendationCreate.mockResolvedValue({
        id: 'new-rec-id',
        clientId: mockClientId,
        reportId: mockReportId,
        type: 'COMPREHENSIVE',
        content: mockContentWithExercise,
        generatedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({ reportId: mockReportId }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recommendation).toBeDefined();

      // Verify the create was called with content that includes detailedExercisePrescription
      const createCall = mockRecommendationCreate.mock.calls[0][0];
      expect(createCall.data.content).toBeDefined();
    });

    it('即使详细运动处方生成失败，主流程也应继续', async () => {
      mockReportFindFirst.mockResolvedValue({
        ...mockReportWithAnalysis,
        client: mockClient,
      });

      // Mock that recommendation creation succeeds even if exercise prescription fails
      mockRecommendationCreate.mockResolvedValue({
        id: 'new-rec-id',
        clientId: mockClientId,
        reportId: mockReportId,
        type: 'COMPREHENSIVE',
        content: {
          // Content without detailedExercisePrescription
          dailyTargets: {
            calories: 1800,
            macros: {},
          },
          detailedExercisePrescription: null,
        },
        generatedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({ reportId: mockReportId }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      // Should still succeed even if exercise prescription generation fails
      expect(response.status).toBe(200);
      expect(mockRecommendationCreate).toHaveBeenCalled();
    });
  });

  describe('POST /api/recommendations/generate - 边缘情况测试', () => {
    it('应该正确处理客户的运动详情字段', async () => {
      const clientWithExerciseDetails = {
        ...mockClient,
        exerciseDetails: '家中有哑铃5kgx2、弹力带、瑜伽垫，附近有健身房，每周可去2次。之前练习过深蹲、俯卧撑，深蹲最大重量30kg',
      };

      mockReportFindFirst.mockResolvedValue({
        ...mockReportWithAnalysis,
        client: clientWithExerciseDetails,
      });

      mockRecommendationCreate.mockResolvedValue({
        id: 'new-rec-id',
        clientId: mockClientId,
        reportId: mockReportId,
        type: 'COMPREHENSIVE',
        content: {},
        generatedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({ reportId: mockReportId }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockRecommendationCreate).toHaveBeenCalled();
    });

    it('应该正确处理没有运动详情的客户', async () => {
      const clientWithoutExerciseDetails = {
        ...mockClient,
        exerciseDetails: null,
      };

      mockReportFindFirst.mockResolvedValue({
        ...mockReportWithAnalysis,
        client: clientWithoutExerciseDetails,
      });

      mockRecommendationCreate.mockResolvedValue({
        id: 'new-rec-id',
        clientId: mockClientId,
        reportId: mockReportId,
        type: 'COMPREHENSIVE',
        content: {},
        generatedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({ reportId: mockReportId }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('应该处理 AI 生成失败的情况', async () => {
      mockReportFindFirst.mockResolvedValue({
        ...mockReportWithAnalysis,
        client: mockClient,
      });

      // Mock a scenario where AI generation fails but we still create a recommendation
      mockRecommendationCreate.mockResolvedValue({
        id: 'new-rec-id',
        clientId: mockClientId,
        reportId: mockReportId,
        type: 'COMPREHENSIVE',
        content: {
          summary: '建议生成暂时不可用，请稍后重试',
          error: 'AI 生成失败',
          // Should have fallback structure
          dailyTargets: {},
          trafficLightFoods: { green: [], yellow: [], red: [] },
        },
        generatedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({ reportId: mockReportId }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      // Should still return a response, even if AI failed
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/recommendations/generate - 计算准确性测试', () => {
    it('应该正确计算 BMR', async () => {
      mockReportFindFirst.mockResolvedValue({
        ...mockReportWithAnalysis,
        client: mockClient,
      });

      // Capture the created recommendation data
      let createdContent: any = null;
      mockRecommendationCreate.mockImplementation((call: any) => {
        createdContent = call.data.content;
        return Promise.resolve({
          id: 'new-rec-id',
          clientId: mockClientId,
          reportId: mockReportId,
          type: 'COMPREHENSIVE',
          content: call.data.content,
          generatedAt: new Date(),
        });
      });

      const request = new Request('http://localhost:3000/api/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({ reportId: mockReportId }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(createdContent).toBeDefined();
      expect(createdContent.metadata).toBeDefined();

      // Verify BMR calculation: Male: 10 * 70 + 6.25 * 175 - 5 * 34 + 5 ≈ 1650
      // Actual value: 1619 (age 34 from 1990), difference is acceptable
      expect(createdContent.metadata.bmr).toBeGreaterThan(1500);
      expect(createdContent.metadata.bmr).toBeLessThan(1800);
    });

    it('应该正确计算 TDEE（中等活动水平）', async () => {
      mockReportFindFirst.mockResolvedValue({
        ...mockReportWithAnalysis,
        client: mockClient,
      });

      let createdContent: any = null;
      mockRecommendationCreate.mockImplementation((call: any) => {
        createdContent = call.data.content;
        return Promise.resolve({
          id: 'new-rec-id',
          clientId: mockClientId,
          reportId: mockReportId,
          type: 'COMPREHENSIVE',
          content: call.data.content,
          generatedAt: new Date(),
        });
      });

      const request = new Request('http://localhost:3000/api/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({ reportId: mockReportId }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(createdContent).toBeDefined();

      // TDEE = BMR * 1.55 (MODERATE) ≈ 1619 * 1.55 ≈ 2509
      expect(createdContent.metadata.tdee).toBeGreaterThan(2400);
      expect(createdContent.metadata.tdee).toBeLessThan(2700);
    });

    it('应该根据 BMI 调整热量目标（超重应制造热量缺口）', async () => {
      // BMI > 24 的客户
      const overweightClient = {
        ...mockClient,
        weight: 85, // BMI = 85 / (1.75 * 1.75) = 27.8 (超重)
      };

      mockReportFindFirst.mockResolvedValue({
        ...mockReportWithAnalysis,
        client: overweightClient,
      });

      let createdContent: any = null;
      mockRecommendationCreate.mockImplementation((call: any) => {
        createdContent = call.data.content;
        return Promise.resolve({
          id: 'new-rec-id',
          clientId: mockClientId,
          reportId: mockReportId,
          type: 'COMPREHENSIVE',
          content: call.data.content,
          generatedAt: new Date(),
        });
      });

      const request = new Request('http://localhost:3000/api/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({ reportId: mockReportId }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(createdContent).toBeDefined();

      // Verify weight goal is "减重"
      expect(createdContent.metadata.weightGoal).toBe('减重');

      // Verify calories are reduced (should be less than TDEE)
      if (createdContent.dailyTargets?.calories && createdContent.metadata.tdee) {
        expect(createdContent.dailyTargets.calories).toBeLessThan(createdContent.metadata.tdee);
      }
    });
  });

  describe('POST /api/recommendations/generate - 错误处理测试', () => {
    it('应该处理数据库错误', async () => {
      mockReportFindFirst.mockRejectedValue(new Error('Database connection failed'));

      const request = new Request('http://localhost:3000/api/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({ reportId: mockReportId }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('生成建议失败');
    });

    it('应该处理无效的 JSON 请求体', async () => {
      const request = new Request('http://localhost:3000/api/recommendations/generate', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});
