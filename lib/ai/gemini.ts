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
  EXERCISE_SCREENSHOT_ANALYSIS_PROMPT,
} from './prompts';
import { getModelForTask, getDefaultModelForTask } from './model-config';
import type { AITaskType } from '@/types/ai-config';
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
import { auth } from '@/lib/auth';

// 设置全局环境变量（确保在动态导入时可用）
process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * Get dynamically configured AI model for a specific task
 *
 * This function retrieves the user's configured model for the given task type,
 * or falls back to the default model if no user configuration exists.
 *
 * @param taskType - The AI task type (e.g., 'health-analysis', 'diet-photo-analysis')
 * @returns Promise with configured Google AI model
 */
async function getModel(taskType: AITaskType) {
  const session = await auth();
  if (!session?.user?.id) {
    // If no session, fall back to environment variable with default model
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY || '';
    return google(getDefaultModelForTask(taskType));
  }

  const { provider, modelId, apiKey } = await getModelForTask(
    session.user.id,
    taskType
  );

  // Set API key for this request
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;

  return google(modelId);
}

/**
 * Analyzes health report data using AI (Gemini 2.5 Pro)
 *
 * Takes extracted health report data and client information to generate a comprehensive
 * health analysis including BMI, BMR, TDEE, macro targets, and abnormal indicator analysis.
 * Based on medical nutrition therapy (MNT) standards and evidence-based medicine.
 *
 * @param clientInfo - Client demographic and health information
 * @param clientInfo.name - Client's name
 * @param clientInfo.gender - Client's gender
 * @param clientInfo.age - Client's age in years
 * @param clientInfo.height - Height in centimeters
 * @param clientInfo.weight - Weight in kilograms
 * @param clientInfo.activityLevel - Activity level (sedentary/light/moderate/active/very_active)
 * @param clientInfo.allergies - List of food allergies
 * @param clientInfo.medicalHistory - List of medical conditions
 * @param reportData - Extracted health report data with indicators
 * @returns Promise resolving to HealthAnalysis with BMI, macro targets, and recommendations
 * @throws Error if AI analysis fails
 *
 * @example
 * const analysis = await analyzeHealthReport(
 *   { name: "John", gender: "male", age: 35, height: 175, weight: 70, ... },
 *   { indicators: [{ name: "Hemoglobin", value: "140", unit: "g/L", ... }] }
 * );
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

    // Use dynamic model loading for health analysis
    const model = await getModel('health-analysis');

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

    const model = await getModel('diet-recommendation');

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

    const model = await getModel('exercise-recommendation');

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

    const model = await getModel('lifestyle-recommendation');

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
    const model = await getModel('diet-photo-analysis');

    const { text } = await generateText({
      model,
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

    const model = await getModel('diet-photo-analysis');

    const { text } = await generateText({
      model,
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
 * Evaluates diet photo compliance against nutrition intervention plan using Vision AI
 *
 * Analyzes a food photo using Gemini 2.5 Flash (vision model) to recognize foods
 * and evaluate compliance with the client's personalized nutrition intervention plan.
 * Returns detailed nutrition analysis, compliance score, and improvement suggestions.
 *
 * @param imageBase64 - Base64 encoded image data of the meal photo
 * @param clientInfo - Client demographic and health context
 * @param clientInfo.name - Client's name for personalized response
 * @param clientInfo.gender - Client's gender (affects nutritional needs)
 * @param clientInfo.age - Client's age in years
 * @param clientInfo.healthConcerns - Array of health concerns/diagnoses
 * @param recommendation - Full nutrition intervention plan content with traffic light foods, meal plans, etc.
 * @param notes - Optional notes/annotations that provide additional context about the photo (e.g., "午餐：米饭、青菜、红烧肉")
 * @returns Promise resolving to DietComplianceEvaluation with:
 *   - recognizedFoods: Array of identified foods in the photo
 *   - complianceEvaluation: Overall score (0-100), rating, and nutrition balance
 *   - nutritionAnalysis: Detailed breakdown of protein, vegetables, carbs, fat, fiber
 *   - improvementSuggestions: Specific recommendations for improvements
 *   - summary: Human-readable summary
 * @throws Error if image analysis fails
 *
 * @example
 * const evaluation = await evaluateDietPhotoCompliance(
 *   'data:image/jpeg;base64,/9j/4AAQ...',
 *   { name: "Mary", gender: "female", age: 42, healthConcerns: ["高血脂"] },
 *   { trafficLightFoods: { green: [...], red: [...] }, ... },
 *   "午餐：公司食堂，两荤一素"
 * );
 */
export async function evaluateDietPhotoCompliance(
  imageBase64: string,
  clientInfo: {
    name: string;
    gender: string;
    age: number;
    healthConcerns: string[];
  },
  recommendation: any, // ComprehensiveRecommendation content
  notes?: string | null // 备注信息，对照片的补充说明
): Promise<DietComplianceEvaluation> {
  try {
    // 调试日志：确认备注是否传递
    if (notes) {
      console.log(`[evaluateDietPhotoCompliance] 备注已传递，长度: ${notes.length}, 内容: "${notes}"`);
    } else {
      console.log(`[evaluateDietPhotoCompliance] 无备注信息`);
    }

    const prompt = DIET_PHOTO_COMPLIANCE_EVALUATION_PROMPT(clientInfo, recommendation, notes);

    const model = await getModel('diet-photo-analysis');

    const { text } = await generateText({
      model,
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
 * Evaluates diet compliance from text description when no photo is available
 *
 * Analyzes a written description of a meal using Gemini 2.5 Pro (text model)
 * to evaluate compliance with the client's personalized nutrition intervention plan.
 * Used when clients prefer to describe their meals in text instead of taking photos.
 *
 * @param textDescription - User's written description of what they ate (Chinese text)
 * @param clientInfo - Client demographic and health context
 * @param clientInfo.name - Client's name for personalized response
 * @param clientInfo.gender - Client's gender (affects nutritional needs)
 * @param clientInfo.age - Client's age in years
 * @param clientInfo.healthConcerns - Array of health concerns/diagnoses
 * @param recommendation - Full nutrition intervention plan content to compare against
 * @returns Promise resolving to DietComplianceEvaluation with:
 *   - recognizedFoods: Array of foods mentioned in the description
 *   - complianceEvaluation: Overall score (0-100), rating, and nutrition balance
 *   - nutritionAnalysis: Detailed breakdown of protein, vegetables, carbs, fat, fiber
 *   - improvementSuggestions: Specific recommendations for improvements
 *   - summary: Human-readable summary
 * @throws Error if text analysis fails
 *
 * @example
 * const evaluation = await evaluateTextDescriptionCompliance(
 *   '早上吃了一碗燕麦谷物碗+一包坚果+一颗鸡蛋',
 *   { name: "John", gender: "male", age: 35, healthConcerns: ["高血压"] },
 *   { trafficLightFoods: { ... }, ... }
 * );
 */
export async function evaluateTextDescriptionCompliance(
  textDescription: string,
  clientInfo: {
    name: string;
    gender: string;
    age: number;
    healthConcerns: string[];
  },
  recommendation: any, // ComprehensiveRecommendation content
  notes?: string | null // 备注信息，对文字描述的补充说明
): Promise<DietComplianceEvaluation> {
  try {
    const prompt = DIET_TEXT_DESCRIPTION_EVALUATION_PROMPT(textDescription, clientInfo, recommendation, notes);

    const model = await getModel('diet-photo-analysis');

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

    const model = await getModel('consultation-analysis');

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

    const model = await getModel('general-text');

    const { text } = await generateText({
      model,
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

    const model = await getModel('health-analysis');

    const { text } = await generateText({
      model,
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
 * Generates comprehensive weekly diet summary using AI (Gemini 2.5 Pro)
 *
 * Analyzes all meal records from a given week, compares against the nutrition intervention plan
 * and health indicators, and generates a comprehensive evaluation including:
 * - Compliance scoring for each meal (excellent/good/fair/poor)
 * - Nutrition intake analysis (protein, vegetables, carbs, fat, fiber)
 * - Food intake tracking (all green/yellow/red light foods consumed)
 * - Personalized improvement recommendations with SMART goals
 *
 * Features robust JSON parsing with error recovery for malformed AI responses.
 *
 * @param clientInfo - Client demographic and health context
 * @param clientInfo.name - Client's name for personalized response
 * @param clientInfo.gender - Client's gender (affects nutritional needs)
 * @param clientInfo.age - Client's age in years
 * @param clientInfo.healthConcerns - Array of health concerns/diagnoses
 * @param clientInfo.userRequirements - Optional special dietary requirements
 * @param clientInfo.preferences - Optional food preferences
 * @param weekData - Weekly meal data for analysis
 * @param weekData.weekRange - Date range string (e.g., "2026-01-26")
 * @param weekData.mealGroups - Array of meal groups with scores and analysis results
 * @param recommendation - Full nutrition intervention plan content
 * @param healthAnalysis - Optional health analysis data with indicators
 * @returns Promise resolving to WeeklyDietSummaryContent with:
 *   - statistics: Average score, total meals, score distribution
 *   - complianceEvaluation: Overall rating and week-by-week breakdown
 *   - nutritionAnalysis: Detailed nutrient intake assessment
 *   - foodIntakeAnalysis: Complete list of foods consumed by category
 *   - improvementRecommendations: SMART goals for next week
 *   - summary: Human-readable weekly summary
 * @throws Error if AI generation fails or JSON cannot be parsed
 *
 * @example
 * const summary = await generateWeeklyDietSummary(
 *   { name: "Sarah", gender: "female", age: 38, healthConcerns: ["糖尿病", "高血压"] },
 *   { weekRange: "2026-01-26", mealGroups: [{ date: "1/15", mealType: "午餐", ... }] },
 *   { trafficLightFoods: { ... }, ... },
 *   { indicators: [...] }
 * );
 */
/**
 * Compress week data to reduce context window usage
 * Extracts only essential information needed for weekly summary
 */
function compressWeekData(weekData: {
  weekRange: string;
  mealGroups: Array<{
    date: string;
    mealType: string;
    totalScore: number;
    combinedAnalysis: any;
  }>;
}) {
  return {
    weekRange: weekData.weekRange,
    mealGroups: weekData.mealGroups.map(g => {
      const summary = g.combinedAnalysis?.summary || {};
      const nutrition = g.combinedAnalysis?.nutritionSummary;
      const recognizedFoods = g.combinedAnalysis?.recognizedFoods || [];

      return {
        date: g.date,
        mealType: g.mealType,
        totalScore: g.totalScore,
        // Only include essential summary data
        redFoods: (summary.redFoods || []).slice(0, 10), // Limit to 10
        yellowFoods: (summary.yellowFoods || []).slice(0, 10),
        greenFoods: (summary.greenFoods || []).slice(0, 5),
        totalCount: summary.totalCount || 0,
        // Nutrition summary (short format)
        protein: nutrition?.protein || '-',
        vegetables: nutrition?.vegetables || '-',
        fiber: nutrition?.fiber || '-',
        carbs: nutrition?.carbs || '-',
        fat: nutrition?.fat || '-',
        // Key foods (limit to top 5 each)
        recognizedFoods: recognizedFoods.slice(0, 5).map((f: any) => ({
          food: f.food,
          category: f.category,
          healthImpact: f.healthImpact,
        })),
      };
    }),
  };
}

/**
 * Compress recommendation to reduce context window usage
 * Extracts only essential information needed for weekly summary
 */
function compressRecommendation(recommendation: any) {
  return {
    dailyTargets: recommendation.dailyTargets || {},
    trafficLightFoods: {
      green: (recommendation.trafficLightFoods?.green || []).slice(0, 15),
      yellow: (recommendation.trafficLightFoods?.yellow || []).slice(0, 10),
      red: (recommendation.trafficLightFoods?.red || []).slice(0, 10),
    },
  };
}

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
    // Compress data to reduce context window usage
    const compressedWeekData = compressWeekData(weekData);
    const compressedRecommendation = compressRecommendation(recommendation);

    const prompt = WEEKLY_DIET_SUMMARY_PROMPT(
      clientInfo,
      compressedWeekData,
      compressedRecommendation,
      healthAnalysis
    );

    console.log('[Weekly Diet Summary] Calling AI with prompt length:', prompt.length);
    console.log('[Weekly Diet Summary] Number of meal groups:', weekData.mealGroups.length);
    console.log('[Weekly Diet Summary] Compressed data size:', JSON.stringify(compressedWeekData).length);

    // Use dynamic model loading for weekly summary
    const model = await getModel('weekly-summary');

    // 设置更长的超时时间来处理大型数据集
    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.4, // 平衡创造性和一致性
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

/**
 * Analyzes exercise screenshot using Vision AI
 *
 * Takes a screenshot from a fitness app (GARMIN, Keep, etc.) and extracts exercise data
 * including exercise type, duration, intensity, distance, calories, heart rate, and pace.
 *
 * @param imageBase64 - Base64 encoded image data of the exercise screenshot
 * @param notes - Optional notes/annotations about the exercise
 * @returns Promise resolving to exercise analysis with type, duration, intensity, etc.
 * @throws Error if image analysis fails
 *
 * @example
 * const analysis = await analyzeExerciseScreenshot(
 *   'data:image/jpeg;base64,/9j/4AAQ...',
 *   '晨跑，状态不错'
 * );
 */
export async function analyzeExerciseScreenshot(
  imageBase64: string,
  notes?: string | null
): Promise<{
  exerciseType: string | null;
  duration?: { minutes: number };
  intensity?: string;
  distance?: number;
  calories?: number;
  heartRate?: { average?: number; max?: number };
  pace?: { minKm?: string; speed?: number };
  description?: string;
  error?: string;
}> {
  try {
    const prompt = EXERCISE_SCREENSHOT_ANALYSIS_PROMPT(notes);

    const model = await getModel('diet-photo-analysis');

    const { text } = await generateText({
      model,
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

    const result = JSON.parse(cleanText);

    console.log('[Exercise Screenshot Analysis] Result:', {
      exerciseType: result.exerciseType,
      duration: result.duration?.minutes,
      intensity: result.intensity,
    });

    return result;
  } catch (error) {
    console.error('Exercise screenshot analysis error:', error);
    throw new Error('运动截图分析失败：' + (error as Error).message);
  }
}
