import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import {
  HEALTH_ANALYSIS_PROMPT,
  DIET_RECOMMENDATION_PROMPT,
  EXERCISE_RECOMMENDATION_PROMPT,
  LIFESTYLE_RECOMMENDATION_PROMPT,
  DIET_PHOTO_ANALYSIS_PROMPT,
  DIET_PHOTO_COMPLIANCE_EVALUATION_PROMPT,
  DIET_TEXT_DESCRIPTION_EVALUATION_PROMPT,
  CONSULTATION_ANALYSIS_PROMPT,
  EVALUATE_NUTRITIONIST_PLAN_PROMPT,
  WEEKLY_DIET_SUMMARY_PROMPT,
} from './prompts';
import type {
  HealthAnalysis,
  DietRecommendation,
  ExerciseRecommendation,
  LifestyleRecommendation,
  DietAnalysis,
  DietComplianceEvaluation,
  ConsultationAnalysis,
  ExtractedPlanData,
  PlanEvaluationResult,
  Concern,
  Suggestion,
  WeeklyDietSummaryContent,
} from '@/types';

// 设置全局环境变量（确保在动态导入时可用）
process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY || '';

// 使用 Gemini 3.5 Pro 模型（最新最强）
const model = google('gemini-2.5-pro');

// 用于 Vision API 的模型（快速多模态模型）
const visionModel = google('gemini-2.5-flash');

/**
 * 分析体检报告
 */
export async function analyzeHealthReport(
  clientInfo: {
    name: string;
    gender: string;
    age: number;
    height: number;
    weight: number;
    activityLevel: string;
    allergies: string[];
    medicalHistory: string[];
  },
  reportData: any
): Promise<HealthAnalysis> {
  try {
    const prompt = HEALTH_ANALYSIS_PROMPT(clientInfo, reportData);

    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.3,
    });

    // 清理可能的 markdown 格式
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return JSON.parse(cleanText) as HealthAnalysis;
  } catch (error) {
    console.error('Health analysis error:', error);
    throw new Error('健康分析失败：' + (error as Error).message);
  }
}

/**
 * 生成饮食建议
 */
export async function generateDietRecommendation(
  healthAnalysis: HealthAnalysis,
  preferences: string,
  allergies: string[]
): Promise<DietRecommendation> {
  try {
    const prompt = DIET_RECOMMENDATION_PROMPT(healthAnalysis, preferences, allergies);

    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.4,
    });

    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return JSON.parse(cleanText) as DietRecommendation;
  } catch (error) {
    console.error('Diet recommendation error:', error);
    throw new Error('饮食建议生成失败：' + (error as Error).message);
  }
}

/**
 * 生成运动建议
 */
export async function generateExerciseRecommendation(
  healthAnalysis: HealthAnalysis,
  activityLevel: string
): Promise<ExerciseRecommendation> {
  try {
    const prompt = EXERCISE_RECOMMENDATION_PROMPT(healthAnalysis, activityLevel);

    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.4,
    });

    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return JSON.parse(cleanText) as ExerciseRecommendation;
  } catch (error) {
    console.error('Exercise recommendation error:', error);
    throw new Error('运动建议生成失败：' + (error as Error).message);
  }
}

/**
 * 生成生活方式建议
 */
export async function generateLifestyleRecommendation(
  healthAnalysis: HealthAnalysis
): Promise<LifestyleRecommendation> {
  try {
    const prompt = LIFESTYLE_RECOMMENDATION_PROMPT(healthAnalysis);

    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.4,
    });

    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return JSON.parse(cleanText) as LifestyleRecommendation;
  } catch (error) {
    console.error('Lifestyle recommendation error:', error);
    throw new Error('生活方式建议生成失败：' + (error as Error).message);
  }
}

/**
 * 使用 Vision API 直接分析图片中的体检报告
 */
export async function analyzeReportImage(imageBase64: string): Promise<any> {
  try {
    const { text } = await generateText({
      model: visionModel,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `请识别这张体检报告中的所有指标数据，以 JSON 格式返回。
返回格式：
{
  "indicators": [
    {
      "name": "指标名称",
      "value": "检测值",
      "unit": "单位",
      "normalRange": "正常范围"
    }
  ]
}
只返回 JSON，不要有其他内容。`,
            },
            {
              type: 'image',
              image: imageBase64,
            },
          ],
        },
      ],
    });

    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Image analysis error:', error);
    throw new Error('图片分析失败：' + (error as Error).message);
  }
}

/**
 * 使用 Vision API 分析饮食照片
 */
export async function analyzeDietPhoto(
  imageBase64: string,
  clientInfo: {
    name: string;
    healthConcerns: string;
    preferences: string | null;
    userRequirements: string | null;
  }
): Promise<DietAnalysis> {
  try {
    const prompt = DIET_PHOTO_ANALYSIS_PROMPT(clientInfo);

    const { text } = await generateText({
      model: visionModel,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image',
              image: imageBase64,
            },
          ],
        },
      ],
    });

    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return JSON.parse(cleanText) as DietAnalysis;
  } catch (error) {
    console.error('Diet photo analysis error:', error);
    throw new Error('饮食照片分析失败：' + (error as Error).message);
  }
}

/**
 * 评估饮食照片与营养干预方案的合规性
 * 使用 Vision API 分析照片，对比客户的营养干预方案进行评估
 */
export async function evaluateDietPhotoCompliance(
  imageBase64: string,
  clientInfo: {
    name: string;
    gender: string;
    age: number;
    healthConcerns: string[];
  },
  recommendation: any // ComprehensiveRecommendation content
): Promise<DietComplianceEvaluation> {
  try {
    const prompt = DIET_PHOTO_COMPLIANCE_EVALUATION_PROMPT(clientInfo, recommendation);

    const { text } = await generateText({
      model: visionModel,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image',
              image: imageBase64,
            },
          ],
        },
      ],
    });

    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return JSON.parse(cleanText) as DietComplianceEvaluation;
  } catch (error) {
    console.error('Diet photo compliance evaluation error:', error);
    throw new Error('饮食照片合规性评估失败：' + (error as Error).message);
  }
}

/**
 * 根据文字描述分析饮食合规性
 * 用于没有照片的情况下，通过文字描述来评估饮食
 */
export async function evaluateTextDescriptionCompliance(
  textDescription: string,
  clientInfo: {
    name: string;
    gender: string;
    age: number;
    healthConcerns: string[];
  },
  recommendation: any // ComprehensiveRecommendation content
): Promise<DietComplianceEvaluation> {
  try {
    const prompt = DIET_TEXT_DESCRIPTION_EVALUATION_PROMPT(textDescription, clientInfo, recommendation);

    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.3,
    });

    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return JSON.parse(cleanText) as DietComplianceEvaluation;
  } catch (error) {
    console.error('Text description compliance evaluation error:', error);
    throw new Error('文字描述合规性评估失败：' + (error as Error).message);
  }
}

/**
 * 分析咨询记录
 * 提取关键信息用于更新营养干预方案
 */
export async function analyzeConsultation(
  clientInfo: {
    name: string;
    gender: string;
    age: number;
    healthConcerns: string[];
    currentRecommendations?: any;
  },
  consultationData: {
    sessionNotes: string;
    imageDescriptions?: string[];
    textFiles?: Array<{
      fileName: string;
      content: string;
    }>;
  }
): Promise<ConsultationAnalysis> {
  try {
    const prompt = CONSULTATION_ANALYSIS_PROMPT(clientInfo, consultationData);

    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.5, // 提高温度以获得更有洞察力的分析
    });

    // 清理可能的 markdown 格式
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    console.log('[AI Analysis] Raw response length:', cleanText.length);

    const result = JSON.parse(cleanText) as ConsultationAnalysis;

    console.log('[AI Analysis] Parsed result:', {
      hasSummary: !!result.summary,
      complianceLevel: result.dietChanges?.complianceLevel,
      priority: result.nutritionistActionItems?.priority,
      actionsCount: result.nutritionistActionItems?.followUpActions?.length || 0,
    });

    return result;
  } catch (error) {
    console.error('Consultation analysis error:', error);
    throw new Error('咨询分析失败：' + (error as Error).message);
  }
}

/**
 * 解析营养师计划文本，提取结构化数据
 */
export async function parseNutritionistPlan(
  planText: string
): Promise<ExtractedPlanData> {
  try {
    const prompt = `
请从以下营养师计划中提取结构化信息。

计划内容：
${planText}

请提取：
1. 饮食建议（推荐食物、避免食物、补充剂、餐食安排）
2. 运动建议（运动项目、时长、频率、强度、注意事项）

返回 JSON 格式（不要有 markdown 格式）：
{
  "diet": {
    "recommendations": ["建议1", "建议2"],
    "foods": {
      "recommend": ["推荐食物1", "推荐食物2"],
      "avoid": ["避免食物1", "避免食物2"]
    },
    "supplements": [
      {"name": "补充剂名", "dosage": "剂量", "frequency": "频率"}
    ],
    "meals": [
      {"type": "早餐", "foods": ["食物1", "食物2"]}
    ]
  },
  "exercise": {
    "recommendations": ["建议1", "建议2"],
    "activities": [
      {"type": "跑步", "duration": "30分钟", "frequency": "每周3次", "intensity": "中等"}
    ],
    "precautions": ["注意事项1", "注意事项2"]
  }
}

如果某个部分没有内容，请设为空数组或 null。
`;

    const { text } = await generateText({
      model: visionModel, // 使用 flash 模型，快速且足够准确
      prompt,
      temperature: 0.1,
    });

    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleanText) as ExtractedPlanData;

    console.log('[Parse Plan] Extracted data:', {
      hasDiet: !!result.diet,
      hasExercise: !!result.exercise,
    });

    return result;
  } catch (error) {
    console.error('Parse plan error:', error);
    throw new Error('计划解析失败：' + (error as Error).message);
  }
}

/**
 * 评估营养师计划
 */
export async function evaluateNutritionistPlan(
  clientInfo: {
    name: string;
    gender: string;
    age: number;
    height: number;
    weight: number;
    activityLevel: string;
    allergies: string[];
    medicalHistory: string[];
    healthConcerns: string[];
    preferences?: string;
  },
  healthAnalysis: HealthAnalysis | null,
  extractedPlan: ExtractedPlanData
): Promise<{
  evaluation: PlanEvaluationResult;
  concerns: Concern[];
  suggestions: Suggestion[];
  optimizedPlan?: any;
}> {
  try {
    const prompt = EVALUATE_NUTRITIONIST_PLAN_PROMPT(
      clientInfo,
      healthAnalysis,
      extractedPlan
    );

    const { text } = await generateText({
      model, // 使用 pro 模型，确保评估质量
      prompt,
      temperature: 0.2,
    });

    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleanText);

    console.log('[Evaluate Plan] Result:', {
      status: result.overallStatus,
      score: result.safetyScore,
      concernsCount: result.concerns?.length || 0,
      suggestionsCount: result.suggestions?.length || 0,
      hasOptimizedPlan: !!result.optimizedPlan,
    });

    // 重新组织数据结构以匹配类型定义
    const response: {
      evaluation: {
        overallStatus: 'safe' | 'needs_adjustment' | 'unsafe';
        safetyScore: number;
        summary: string;
        keyFindings: string[];
      };
      concerns: any[];
      suggestions: any[];
      optimizedPlan?: any;
    } = {
      evaluation: {
        overallStatus: result.overallStatus as 'safe' | 'needs_adjustment' | 'unsafe',
        safetyScore: result.safetyScore,
        summary: result.summary,
        keyFindings: result.keyFindings || [],
      },
      concerns: result.concerns || [],
      suggestions: result.suggestions || [],
    };

    // 添加优化后的计划（如果有）
    if (result.optimizedPlan) {
      response.optimizedPlan = result.optimizedPlan;
    }

    return response;
  } catch (error) {
    console.error('Evaluate plan error:', error);
    throw new Error('计划评估失败：' + (error as Error).message);
  }
}

/**
 * 尝试修复常见的JSON解析错误
 * 处理AI生成的不完整数字，如 "score": - 或 "count": -
 */
function tryFixMalformedJson(jsonString: string): string | null {
  // 修复: 数字后面只有减号的情况
  // 将 "score": - 替换为 "score": 0
  let fixed = jsonString.replace(/:\s*-\s*([,\}\]])/g, ': 0$1');

  // 修复: 缺少数值的情况，如 "count": 或 "score": 后面直接是逗号或括号
  fixed = fixed.replace(/:\s*,/g, ': 0,');
  fixed = fixed.replace(/:\s*}/g, ': 0}');
  fixed = fixed.replace(/:\s*]/g, ': 0]');

  // 修复: NaN 值
  fixed = fixed.replace(/:\s*NaN\s*([,\}\]])/gi, ': 0$1');

  // 修复: Infinity 值
  fixed = fixed.replace(/:\s*Infinity\s*([,\}\]])/gi, ': 999$1');
  fixed = fixed.replace(/:\s*-Infinity\s*([,\}\]])/gi, ': -999$1');

  return fixed;
}

/**
 * 生成本周饮食汇总
 * 根据本周的饮食记录、营养干预方案和体检指标，生成综合性评价和改进建议
 */
export async function generateWeeklyDietSummary(
  clientInfo: {
    name: string;
    gender: string;
    age: number;
    healthConcerns: string[];
    userRequirements?: string | null;
    preferences?: string | null;
  },
  weekData: {
    weekRange: string;
    mealGroups: Array<{
      date: string;
      mealType: string;
      totalScore: number;
      combinedAnalysis: any;
    }>;
  },
  recommendation: any, // ComprehensiveRecommendation content
  healthAnalysis: HealthAnalysis | null
): Promise<WeeklyDietSummaryContent> {
  try {
    const prompt = WEEKLY_DIET_SUMMARY_PROMPT(
      clientInfo,
      weekData,
      recommendation,
      healthAnalysis
    );

    console.log('[Weekly Diet Summary] Calling AI with prompt length:', prompt.length);
    console.log('[Weekly Diet Summary] Number of meal groups:', weekData.mealGroups.length);

    // 设置更长的超时时间（15分钟）来处理大型数据集
    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.4, // 平衡创造性和一致性
      maxTokens: 8192, // 限制最大token数，避免生成过长内容导致JSON格式错误
    });

    console.log('[Weekly Diet Summary] AI response length:', text.length);

    // 清理可能的 markdown 格式
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // 尝试解析 JSON
    let result: WeeklyDietSummaryContent;
    let parseError: Error | null = null;

    try {
      result = JSON.parse(cleanText) as WeeklyDietSummaryContent;
    } catch (initialError: any) {
      parseError = initialError;
      console.error('[Weekly Diet Summary] Initial JSON parse failed:', initialError.message);
      console.log('[Weekly Diet Summary] Attempting to fix malformed JSON...');

      // 尝试修复并重新解析
      const fixedText = tryFixMalformedJson(cleanText);
      if (fixedText && fixedText !== cleanText) {
        try {
          result = JSON.parse(fixedText) as WeeklyDietSummaryContent;
          console.log('[Weekly Diet Summary] Successfully fixed and parsed JSON');
        } catch (fixError: any) {
          console.error('[Weekly Diet Summary] Fixed JSON parse also failed:', fixError.message);
          // 输出错误位置附近的文本以便调试
          const match = fixError.message.match(/position (\d+)/);
          if (match) {
            const pos = parseInt(match[1]);
            const context = cleanText.substring(Math.max(0, pos - 100), Math.min(cleanText.length, pos + 100));
            console.error('[Weekly Diet Summary] Error context:', context);
          }
          throw fixError;
        }
      } else {
        throw initialError;
      }
    }

    console.log('[Weekly Diet Summary] Generated summary:', {
      avgScore: result.statistics.avgScore,
      overallRating: result.complianceEvaluation.overallRating,
      improvementCount: Array.isArray(result.improvementRecommendations)
        ? result.improvementRecommendations.filter(r => r.category === 'improve').length
        : result.improvementRecommendations?.improve?.length || 0,
    });

    return result;
  } catch (error) {
    console.error('Weekly diet summary generation error:', error);
    throw new Error('周饮食汇总生成失败：' + (error as Error).message);
  }
}
