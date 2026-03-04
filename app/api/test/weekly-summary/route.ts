import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateWeeklyDietSummary } from '@/lib/ai/gemini';

export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 简单测试数据
    const clientInfo = {
      name: '测试客户',
      gender: 'FEMALE',
      age: 30,
      healthConcerns: ['减重'],
    };

    const weekData = {
      weekRange: '2026-02-01 至 2026-02-07',
      mealGroups: [
        {
          date: '2026-02-01',
          mealType: '早餐',
          totalScore: 85,
          combinedAnalysis: {
            recognizedFoods: [
              { food: '燕麦', category: '主食', healthImpact: 'positive' },
              { food: '鸡蛋', category: '蛋白质', healthImpact: 'positive' },
            ],
            complianceEvaluation: {
              overallScore: 85,
              overallRating: '良好',
              nutritionBalance: 'good',
            },
            nutritionSummary: {
              protein: '充足',
              vegetables: '适中',
              fiber: '适中',
              carbs: '适中',
              fat: '适中',
            },
            summary: {
              greenFoods: ['燕麦', '鸡蛋'],
              yellowFoods: [],
              redFoods: [],
              totalCount: 0,
            },
          },
        },
      ],
    };

    const recommendation = {
      dailyTargets: {
        calories: 1800,
        macros: {
          protein: { grams: 80 },
        },
      },
      trafficLightFoods: {
        green: [
          { food: '燕麦', reason: '高纤维' },
          { food: '鸡蛋', reason: '优质蛋白' },
        ],
        red: [],
      },
    };

    const healthAnalysis = null; // Optional for test

    console.log('[Test] Calling generateWeeklyDietSummary...');

    const result = await generateWeeklyDietSummary(
      clientInfo,
      weekData,
      recommendation,
      healthAnalysis
    );

    console.log('[Test] Result:', JSON.stringify(result).slice(0, 200));

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
