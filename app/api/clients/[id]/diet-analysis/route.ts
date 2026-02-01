import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db/prisma';

// GET - 获取客户的饮食分析汇总
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id = '';
  try {
    id = (await params).id;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户访问权限
    const accessResult = await verifyClientAccess(id, session.user.id);
    if (!accessResult.exists) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.statusCode || 404 });
    }

    // 获取所有已分析的饮食照片
    const photos = await prisma.dietPhoto.findMany({
      where: {
        clientId: id,
        analysis: { not: null },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    const totalPhotos = photos.length;
    const analyzedPhotos = photos.filter(p => p.analysis !== null).length;

    // 计算平均分
    let totalScore = 0;
    const allAnalyses = photos.map(photo => {
      if (photo.analysis) {
        try {
          const analysis = JSON.parse(photo.analysis);
          // 修复：从正确的路径读取分数
          totalScore += analysis.complianceEvaluation?.overallScore || 0;
          return analysis;
        } catch {
          return null;
        }
      }
      return null;
    }).filter(Boolean);

    const overallScore = allAnalyses.length > 0 ? Math.round(totalScore / allAnalyses.length) : 0;

    // 汇总饮食偏好
    const preferences = {
      preferredFoods: [] as string[],
      avoidedFoods: [] as string[],
      cookingMethods: [] as string[],
      mealPatterns: [] as string[],
    };

    // 统计所有照片中的食物和烹饪方式
    const foodCount = new Map<string, number>();
    const cookingMethodCount = new Map<string, number>();
    const mealTypeCount = new Map<string, number>();

    allAnalyses.forEach((analysis: any) => {
      // 统计食物
      analysis.foods?.forEach((food: any) => {
        const count = foodCount.get(food.name) || 0;
        foodCount.set(food.name, count + 1);

        // 统计烹饪方式
        if (food.cookingMethod) {
          const cmCount = cookingMethodCount.get(food.cookingMethod) || 0;
          cookingMethodCount.set(food.cookingMethod, cmCount + 1);
        }
      });

      // 统计餐型
      if (analysis.mealType) {
        const mtCount = mealTypeCount.get(analysis.mealType) || 0;
        mealTypeCount.set(analysis.mealType, mtCount + 1);
      }
    });

    // 提取常吃的食物（出现2次及以上）
    preferences.preferredFoods = Array.from(foodCount.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([food]) => food);

    // 提取常用烹饪方式
    preferences.cookingMethods = Array.from(cookingMethodCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([method]) => method);

    // 提取用餐模式
    preferences.mealPatterns = Array.from(mealTypeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type);

    // 汇总饮食习惯
    const habits = {
      issues: [] as string[],
      strengths: [] as string[],
      recommendations: [] as string[],
    };

    // 统计问题
    const issueCount = new Map<string, number>();
    allAnalyses.forEach((analysis: any) => {
      analysis.issues?.forEach((issue: any) => {
        const count = issueCount.get(issue.type) || 0;
        issueCount.set(issue.type, count + 1);
      });
    });

    // 提取高频问题
    habits.issues = Array.from(issueCount.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue]) => issue);

    // 统计优点（基于营养均衡情况）
    const balanceCount = {
      protein: { 充足: 0, 不足: 0, 缺乏: 0 },
      vegetables: { 充足: 0, 不足: 0, 缺乏: 0 },
      fiber: { 充足: 0, 不足: 0, 缺乏: 0 },
    };

    allAnalyses.forEach((analysis: any) => {
      if (analysis.complianceEvaluation?.nutritionBalance) {
        const nb = analysis.complianceEvaluation.nutritionBalance;
        if (nb.protein) balanceCount.protein[nb.protein as keyof typeof balanceCount.protein]++;
        if (nb.vegetables) balanceCount.vegetables[nb.vegetables as keyof typeof balanceCount.vegetables]++;
        if (nb.fiber) balanceCount.fiber[nb.fiber as keyof typeof balanceCount.fiber]++;
      }
    });

    // 提取优点
    if (balanceCount.protein.充足 >= 2) habits.strengths.push('蛋白质摄入充足');
    if (balanceCount.vegetables.充足 >= 2) habits.strengths.push('蔬菜摄入量良好');
    if (balanceCount.fiber.充足 >= 2) habits.strengths.push('膳食纤维摄入充足');

    // 统计建议
    const suggestionCount = new Map<string, number>();
    allAnalyses.forEach((analysis: any) => {
      analysis.suggestions?.forEach((suggestion: any) => {
        const key = `${suggestion.category}: ${suggestion.content}`;
        const count = suggestionCount.get(key) || 0;
        suggestionCount.set(key, count + 1);
      });
    });

    // 提取高频建议
    habits.recommendations = Array.from(suggestionCount.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([suggestion]) => suggestion);

    return NextResponse.json({
      summary: {
        totalPhotos,
        analyzedPhotos,
        overallScore,
      },
      preferences,
      habits,
    });
  } catch (error) {
    logger.apiError('GET', `/api/clients/${id}/diet-analysis`, error);
    return NextResponse.json({ error: '获取饮食分析汇总失败' }, { status: 500 });
  }
}
