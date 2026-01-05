import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import {
  HEALTH_ANALYSIS_PROMPT,
  DIET_RECOMMENDATION_PROMPT,
  EXERCISE_RECOMMENDATION_PROMPT,
  LIFESTYLE_RECOMMENDATION_PROMPT,
} from './prompts';
import type { HealthAnalysis, DietRecommendation, ExerciseRecommendation, LifestyleRecommendation } from '@/types';

// 使用 Gemini 3.0 Pro 模型
const model = google('gemini-3.0-pro');

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
    const { google } = await import('@ai-sdk/google');
    const visionModel = google('gemini-3.0-pro');

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
