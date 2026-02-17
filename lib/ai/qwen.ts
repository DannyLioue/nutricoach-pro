import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import {
  DIET_PHOTO_COMPLIANCE_EVALUATION_PROMPT,
  DIET_TEXT_DESCRIPTION_EVALUATION_PROMPT,
  WEEKLY_DIET_SUMMARY_PROMPT,
} from './prompts';

// Qwen (阿里百炼) API 配置
const QWEN_API_KEY = process.env.QWEN_API_KEY;
const QWEN_BASE_URL = process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

// 创建 Qwen 客户端
const createQwenClient = () => {
  if (!QWEN_API_KEY) {
    throw new Error('QWEN_API_KEY is not configured');
  }

  return createOpenAI({
    apiKey: QWEN_API_KEY,
    baseURL: QWEN_BASE_URL,
  });
};

/**
 * Qwen 模型列表
 */
export const QWEN_MODELS = {
  // 多模态模型（支持图片）
  VISION: 'qwen-vl-max-latest',
  VISION_PLUS: 'qwen-vl-plus-latest',

  // 文本模型
  TEXT: 'qwen-plus-latest',
  TEXT_FLASH: 'qwen-turbo-latest',
} as const;

/**
 * 使用 Qwen Vision API 评估饮食照片合规性
 * 当 Gemini 失败时作为备用
 */
export async function evaluateDietPhotoComplianceWithQwen(
  imageUrl: string,
  clientInfo: {
    name: string;
    gender: string;
    age: number;
    healthConcerns: string[];
  },
  recommendationContent: any,
  notes?: string | null
): Promise<any> {
  try {
    const qwen = createQwenClient();
    const model = qwen(QWEN_MODELS.VISION);

    const prompt = DIET_PHOTO_COMPLIANCE_EVALUATION_PROMPT(clientInfo, recommendationContent, notes);

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
              image: imageUrl,
            },
          ],
        },
      ],
      temperature: 0.4,
    });

    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Qwen diet photo evaluation error:', error);
    throw new Error('Qwen 饮食照片评估失败：' + (error as Error).message);
  }
}

/**
 * 使用 Qwen 评估饮食文字描述合规性
 * 当 Gemini 失败时作为备用
 */
export async function evaluateTextDescriptionComplianceWithQwen(
  textDescription: string,
  clientInfo: {
    name: string;
    gender: string;
    age: number;
    healthConcerns: string[];
  },
  recommendationContent: any,
  notes?: string | null
): Promise<any> {
  try {
    const qwen = createQwenClient();
    const model = qwen(QWEN_MODELS.TEXT);

    const prompt = DIET_TEXT_DESCRIPTION_EVALUATION_PROMPT(textDescription, clientInfo, recommendationContent, notes);

    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.4,
    });

    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Qwen text description evaluation error:', error);
    throw new Error('Qwen 文字描述评估失败：' + (error as Error).message);
  }
}

/**
 * 检查 Qwen 是否可用
 */
export function isQwenAvailable(): boolean {
  return !!QWEN_API_KEY;
}

/**
 * 使用 Qwen 生成周饮食汇总
 * 当 Gemini 失败时作为备用
 */
export async function generateWeeklyDietSummaryWithQwen(
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
      redFoods?: string[];
      yellowFoods?: string[];
      greenFoods?: string[];
      totalCount?: number;
      protein?: string;
      vegetables?: string;
      fiber?: string;
      carbs?: string;
      fat?: string;
      recognizedFoods?: Array<{
        food: string;
        category: string;
        healthImpact: string;
      }>;
    }>;
  },
  recommendation: any,
  healthAnalysis: any
): Promise<any> {
  try {
    const qwen = createQwenClient();
    const model = qwen(QWEN_MODELS.TEXT);

    const prompt = WEEKLY_DIET_SUMMARY_PROMPT(clientInfo, weekData, recommendation, healthAnalysis);

    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.4,
    });

    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Qwen weekly diet summary error:', error);
    throw new Error('Qwen 周饮食汇总生成失败：' + (error as Error).message);
  }
}
