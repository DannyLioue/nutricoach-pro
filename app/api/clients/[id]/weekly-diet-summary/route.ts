import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { logger } from '@/lib/logger';
import { generateWeeklyDietSummary } from '@/lib/ai/gemini';
import { analyzeMealGroup } from '@/lib/services/mealGroupAnalysis';
import { z } from 'zod';
import type { HealthAnalysis } from '@/types';

// 请求验证 schema
const createWeeklySummarySchema = z.object({
  startDate: z.string().optional(), // 新增：自定义开始日期 YYYY-MM-DD
  endDate: z.string().optional(), // 新增：自定义结束日期 YYYY-MM-DD
  summaryName: z.string().max(100).nullable().optional(), // 新增：自定义汇总名称 (允许 null)
  summaryType: z.enum(['week', 'custom']).default('custom'), // 新增：汇总类型
  weekStartDate: z.string().optional(), // 保留向后兼容
  forceRegenerate: z.boolean().optional().default(false),
});

// 验证日期范围（最多7天）
function validateDateRange(startDate: string, endDate: string): { valid: boolean; error?: string; days?: number } {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: '日期格式无效' };
  }

  if (start > end) {
    return { valid: false, error: '开始日期不能晚于结束日期' };
  }

  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (daysDiff > 7) {
    return { valid: false, error: `日期范围不能超过7天（当前选择：${daysDiff}天）` };
  }

  if (daysDiff < 1) {
    return { valid: false, error: '日期范围至少需要1天' };
  }

  return { valid: true, days: daysDiff };
}

// 计算年龄的辅助函数
function calculateAge(birthDate: Date | string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// 解析健康问题
function parseHealthConcerns(healthConcernsStr: string): string[] {
  try {
    const parsed = JSON.parse(healthConcernsStr || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * 获取本周的周一和周日日期
 */
function getWeekRange(date: Date): { startDate: string; endDate: string; weekNumber: number; year: number } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 调整到周一
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // 计算周数
  const firstDayOfYear = new Date(monday.getFullYear(), 0, 1);
  const days = Math.floor((monday.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + firstDayOfYear.getDay() + 1) / 7);

  return {
    startDate: monday.toISOString().split('T')[0], // YYYY-MM-DD
    endDate: sunday.toISOString().split('T')[0],
    weekNumber,
    year: monday.getFullYear(),
  };
}

// POST - 生成本周饮食汇总
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let clientId = '';
  try {
    clientId = (await params).id;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户访问权限
    const accessResult = await verifyClientAccess(clientId, session.user.id);
    if (!accessResult.exists) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.statusCode || 404 });
    }

    const client = accessResult.client!;
    const body = await request.json();
    logger.apiRequest('POST', `/api/clients/${clientId}/weekly-diet-summary`, clientId);

    const validatedData = createWeeklySummarySchema.parse(body);

    // 确定日期范围
    let startDate: string;
    let endDate: string;
    let summaryType: string;
    let summaryName: string | undefined;

    if (validatedData.startDate && validatedData.endDate) {
      // 使用自定义日期范围
      const validation = validateDateRange(validatedData.startDate, validatedData.endDate);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      startDate = validatedData.startDate;
      endDate = validatedData.endDate;
      summaryType = validatedData.summaryType || 'custom';
      summaryName = validatedData.summaryName || undefined;

      logger.info('[Weekly Summary] Using custom date range', { startDate, endDate, days: validation.days });
    } else {
      // 向后兼容：使用周范围
      const targetDate = validatedData.weekStartDate
        ? new Date(validatedData.weekStartDate)
        : new Date();
      const weekRange = getWeekRange(targetDate);
      startDate = weekRange.startDate;
      endDate = weekRange.endDate;
      summaryType = 'week';
      summaryName = validatedData.summaryName || undefined;

      logger.info('[Weekly Summary] Using week range', { startDate, endDate, weekNumber: weekRange.weekNumber });
    }

    // 检查是否已存在相同日期范围的汇总（仅当不强制重新生成时）
    if (!validatedData.forceRegenerate) {
      const existingSummary = await prisma.weeklyDietSummary.findFirst({
        where: {
          clientId,
          startDate,
          endDate,
        },
      });

      if (existingSummary) {
        logger.apiSuccess('POST', `/api/clients/${clientId}/weekly-diet-summary`, 'Summary already exists, returning existing');
        return NextResponse.json({
          success: true,
          summary: JSON.parse(existingSummary.summary),
          summaryId: existingSummary.id,
          alreadyExisted: true,
        });
      }
    }

    // 如果是强制重新生成，先清除旧的分析数据
    if (validatedData.forceRegenerate) {
      // 清除旧的同范围汇总
      await prisma.weeklyDietSummary.deleteMany({
        where: {
          clientId,
          startDate,
          endDate,
        },
      });

      // 清除日期范围内所有食谱组的旧分析数据，强制重新分析
      await prisma.dietPhotoMealGroup.updateMany({
        where: {
          clientId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        data: {
          combinedAnalysis: null,
          totalScore: null,
          overallRating: null,
        },
      });

      // 清除照片的分析数据和分析时间
      const mealGroupsToClear = await prisma.dietPhotoMealGroup.findMany({
        where: {
          clientId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: { id: true },
      });

      if (mealGroupsToClear.length > 0) {
        await prisma.dietPhoto.updateMany({
          where: {
            mealGroupId: {
              in: mealGroupsToClear.map(g => g.id),
            },
          },
          data: {
            analysis: null,
            analyzedAt: null,
          },
        });
      }

      logger.info('[Weekly Summary] 强制重新生成：已清除旧的分析数据');
      console.log('[Weekly Summary] 强制重新生成：已清除食谱组和照片的旧分析数据');
    }

    // 获取日期范围内的食谱组（按日期排序），包含照片数据
    // 注意：如果在forceRegenerate模式下，这里获取的是已清除分析数据的新鲜数据
    const mealGroups = await prisma.dietPhotoMealGroup.findMany({
      where: {
        clientId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
      include: {
        photos: true,
      },
    });

    if (mealGroups.length === 0) {
      return NextResponse.json(
        { error: `所选日期范围（${startDate} 至 ${endDate}）暂无饮食记录` },
        { status: 400 }
      );
    }

    // 检查是否有食谱组既没有照片也没有文字描述
    const mealGroupsWithoutData = mealGroups.filter(g =>
      (!g.photos || g.photos.length === 0) && (!g.textDescription || g.textDescription.trim().length === 0)
    );
    if (mealGroupsWithoutData.length > 0) {
      return NextResponse.json(
        { error: `有 ${mealGroupsWithoutData.length} 个食谱组既没有照片也没有文字描述，请先添加数据` },
        { status: 400 }
      );
    }

    // 获取客户的最新营养干预方案（需要用于分析食谱组和生成汇总）
    const latestRecommendation = await prisma.recommendation.findFirst({
      where: {
        clientId,
        type: 'COMPREHENSIVE',
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });

    if (!latestRecommendation) {
      return NextResponse.json(
        { error: '请先生成营养干预方案，再进行周饮食汇总' },
        { status: 400 }
      );
    }

    // 检查是否所有食谱组都已分析
    const unanalyzedGroups = mealGroups.filter(g => !g.combinedAnalysis);

    if (unanalyzedGroups.length > 0) {
      // 自动分析未分析的食谱组
      logger.info(`[Weekly Summary] Found ${unanalyzedGroups.length} unanalyzed meal groups, analyzing them first...`);
      console.log(`[Weekly Summary] 发现 ${unanalyzedGroups.length} 个未分析的食谱组，开始自动分析...`);

      // 分析每个未分析的食谱组
      for (let i = 0; i < unanalyzedGroups.length; i++) {
        const mealGroup = unanalyzedGroups[i];
        try {
          logger.info(`[Weekly Summary] Analyzing meal group: ${mealGroup.name}`);
          console.log(`[Weekly Summary] [${i + 1}/${unanalyzedGroups.length}] 正在分析食谱组: ${mealGroup.name}`);

          // 使用共享的分析函数
          const result = await analyzeMealGroup(
            mealGroup.id,
            clientId,
            latestRecommendation.content
          );

          if (!result.success) {
            console.error(`[Weekly Summary] ✗ 食谱组 "${mealGroup.name}" 分析失败: ${result.error}`);
            continue;
          }

          console.log(`[Weekly Summary] ✓ 食谱组 "${mealGroup.name}" 分析完成，评分: ${result.totalScore}`);
        } catch (error) {
          console.error(`[Weekly Summary] ✗ 食谱组 "${mealGroup.name}" 分析失败:`, error);
        }
      }

      console.log(`[Weekly Summary] 所有未分析的食谱组分析完成`);

      // 重新加载食谱组数据
      const updatedMealGroups = await prisma.dietPhotoMealGroup.findMany({
        where: {
          clientId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'asc' },
        select: {
          id: true,
          date: true,
          name: true,
          mealType: true,
          totalScore: true,
          overallRating: true,
          combinedAnalysis: true,
        },
      });

      // 检查是否仍然有没有分析的食谱组
      const stillUnanalyzed = updatedMealGroups.filter(g => !g.combinedAnalysis);
      if (stillUnanalyzed.length === updatedMealGroups.length) {
        return NextResponse.json(
          { error: '无法分析食谱组，请确保已生成营养干预方案' },
          { status: 400 }
        );
      }

      // 使用更新后的数据继续
      mealGroups.length = 0;
      mealGroups.push(...updatedMealGroups as any);
    }

    // 获取最新的体检报告分析（如果有）
    const latestReport = await prisma.report.findFirst({
      where: {
        clientId,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
      select: {
        analysis: true,
      },
    });

    const healthAnalysis = latestReport?.analysis as HealthAnalysis | null;

    // 准备客户信息
    const clientInfo = {
      name: client.name || '',
      gender: client.gender || 'FEMALE',
      age: calculateAge(client.birthDate),
      healthConcerns: parseHealthConcerns(client.healthConcerns || '[]'),
      userRequirements: client.userRequirements || null,
      preferences: client.preferences || null,
    };

    // 准备饮食数据
    const today = new Date().toISOString().split('T')[0];
    const isRangeComplete = today > endDate; // 今天是否已过结束日期

    // 计算实际记录的天数
    const recordedDates = new Set(mealGroups.map(g => g.date));
    const recordedDays = recordedDates.size;

    // 计算日期范围的总天数
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDaysInRange = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // 如果日期范围未完成，计算已过的天数
    const daysSoFar = isRangeComplete ? totalDaysInRange : Math.min(
      Math.ceil((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      totalDaysInRange
    );

    const weekData = {
      weekRange: `${startDate} 至 ${endDate}`,
      isPartial: !isRangeComplete,
      recordedDays,
      totalDaysInWeek: isRangeComplete ? totalDaysInRange : daysSoFar,
      today,
      mealGroups: mealGroups.map((g) => ({
        date: g.date,
        mealType: g.mealType || '未分类',
        totalScore: g.totalScore || 0,
        combinedAnalysis: g.combinedAnalysis ? JSON.parse(g.combinedAnalysis) : null,
      })),
    };

    // 计算统计数据
    const totalPhotos = mealGroups.reduce((sum, g) => {
      if (g.combinedAnalysis) {
        const analysis = JSON.parse(g.combinedAnalysis);
        return sum + (analysis.totalPhotos || 0);
      }
      return sum;
    }, 0);

    logger.info('[Weekly Summary] Generating summary for client', {
      clientId,
      dateRange: `${startDate} 至 ${endDate}`,
      summaryType,
      mealGroupCount: mealGroups.length,
      totalPhotos,
    });

    // 调用 AI 生成汇总
    logger.info('[Weekly Summary] Calling AI to generate summary...');
    console.log('[Weekly Summary] 准备调用AI生成饮食汇总');
    console.log('[Weekly Summary] 客户:', clientInfo.name);
    console.log('[Weekly Summary] 日期范围:', startDate, '至', endDate);
    console.log('[Weekly Summary] 汇总类型:', summaryType);
    if (summaryName) console.log('[Weekly Summary] 汇总名称:', summaryName);
    console.log('[Weekly Summary] 食谱组数量:', mealGroups.length);
    console.log('[Weekly Summary] 总照片数:', totalPhotos);
    const startTime = Date.now();

    let summary;
    try {
      summary = await generateWeeklyDietSummary(
        clientInfo,
        weekData,
        latestRecommendation.content,
        healthAnalysis
      );
      const duration = Date.now() - startTime;
      logger.info(`[Weekly Summary] AI generation completed in ${duration}ms`);
    } catch (aiError: any) {
      logger.error('[Weekly Summary] AI generation failed:', aiError);
      return NextResponse.json(
        {
          error: 'AI生成汇总失败',
          details: aiError.message || '未知错误',
          suggestion: '请检查数据是否完整，或稍后重试'
        },
        { status: 500 }
      );
    }

    // 保存到数据库
    const summaryData = {
      ...summary,
      weekRange: weekData.weekRange,
      isPartialWeek: weekData.isPartial,
      recordedDays: weekData.recordedDays,
      totalDaysExpected: weekData.totalDaysInWeek,
      statistics: {
        ...summary.statistics,
        totalMeals: mealGroups.length,
        totalPhotos,
        recordedDays: weekData.recordedDays,
        totalDaysInWeek: weekData.totalDaysInWeek,
      },
    };

    // 准备数据库记录数据
    const summaryInput: any = {
      clientId,
      startDate,
      endDate,
      summaryType,
      summaryName,
      mealGroupIds: JSON.stringify(mealGroups.map((g) => g.id)),
      summary: JSON.stringify(summaryData),
      recommendationId: latestRecommendation.id,
      // 为了前端显示统一，始终设置 weekStartDate 和 weekEndDate
      weekStartDate: startDate,
      weekEndDate: endDate,
    };

    // 如果是周类型，添加周相关信息
    if (summaryType === 'week' && validatedData.weekStartDate) {
      const targetDate = new Date(validatedData.weekStartDate);
      const weekRange = getWeekRange(targetDate);
      // 覆盖为周范围（周类型使用计算出的周范围）
      summaryInput.weekStartDate = weekRange.startDate;
      summaryInput.weekEndDate = weekRange.endDate;
      summaryInput.weekNumber = weekRange.weekNumber;
      summaryInput.year = weekRange.year;
    }

    // 创建新的汇总记录（不再使用 upsert，改为直接 create）
    const newSummary = await prisma.weeklyDietSummary.create({
      data: summaryInput,
    });

    logger.apiSuccess('POST', `/api/clients/${clientId}/weekly-diet-summary`, 'Weekly diet summary generated');

    return NextResponse.json({
      success: true,
      summary: summaryData,
      summaryId: newSummary.id,
      alreadyExisted: false,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('[WEEKLY SUMMARY POST] Validation error', error.issues);
      return NextResponse.json({ error: '数据验证失败', details: error.issues }, { status: 400 });
    }
    logger.apiError('POST', `/api/clients/${clientId}/weekly-diet-summary`, error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: '生成本周饮食汇总失败', details: errorMessage }, { status: 500 });
  }
}

// GET - 获取周饮食汇总列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let clientId = '';
  try {
    clientId = (await params).id;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户访问权限
    const accessResult = await verifyClientAccess(clientId, session.user.id);
    if (!accessResult.exists) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.statusCode || 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const summaries = await prisma.weeklyDietSummary.findMany({
      where: { clientId },
      orderBy: [
        { startDate: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        summaryName: true,
        summaryType: true,
        weekStartDate: true,
        weekEndDate: true,
        weekNumber: true,
        year: true,
        summary: true,
        generatedAt: true,
        updatedAt: true,
      },
    });

    // 解析 summary JSON
    const summariesWithParsedData = summaries.map((s) => ({
      id: s.id,
      startDate: s.startDate,
      endDate: s.endDate,
      summaryName: s.summaryName,
      summaryType: s.summaryType,
      weekStartDate: s.weekStartDate,
      weekEndDate: s.weekEndDate,
      weekNumber: s.weekNumber,
      year: s.year,
      summary: JSON.parse(s.summary),
      generatedAt: s.generatedAt,
      updatedAt: s.updatedAt,
    }));

    logger.apiSuccess('GET', `/api/clients/${clientId}/weekly-diet-summary`, `Found ${summaries.length} summaries`);

    return NextResponse.json({
      success: true,
      summaries: summariesWithParsedData,
    });
  } catch (error) {
    logger.apiError('GET', `/api/clients/${clientId}/weekly-diet-summary`, error);
    return NextResponse.json({ error: '获取周饮食汇总列表失败' }, { status: 500 });
  }
}
