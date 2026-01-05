import { NextRequest, NextResponse } from 'next/server';
import {
  generateDietRecommendation,
  generateExerciseRecommendation,
  generateLifestyleRecommendation,
} from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, healthAnalysis, preferences, allergies, activityLevel } = body;

    if (!type || !healthAnalysis) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'diet':
        result = await generateDietRecommendation(
          healthAnalysis,
          preferences || '',
          allergies || []
        );
        break;

      case 'exercise':
        result = await generateExerciseRecommendation(
          healthAnalysis,
          activityLevel || 'MODERATE'
        );
        break;

      case 'lifestyle':
        result = await generateLifestyleRecommendation(healthAnalysis);
        break;

      default:
        return NextResponse.json(
          { error: '不支持的建议类型' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Recommendation API error:', error);
    return NextResponse.json(
      { error: '生成建议失败：' + (error as Error).message },
      { status: 500 }
    );
  }
}
