import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { logger } from '@/lib/logger';
import { generateWeeklyDietSummary, evaluateDietPhotoCompliance, evaluateTextDescriptionCompliance } from '@/lib/ai/gemini';
import { z } from 'zod';
import type { HealthAnalysis } from '@/types';

// 请求验证 schema
const createWeeklySummarySchema = z.object({
  weekStartDate: z.string().optional(), // 可选，默认本周
  forceRegenerate: z.boolean().optional().default(false), // 是否强制重新生成
});

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

    // 确定要生成汇总的周
    const targetDate = validatedData.weekStartDate
      ? new Date(validatedData.weekStartDate)
      : new Date();
    const weekRange = getWeekRange(targetDate);

    // 检查是否已存在该周的汇总
    if (!validatedData.forceRegenerate) {
      const existingSummary = await prisma.weeklyDietSummary.findFirst({
        where: {
          clientId,
          weekStartDate: weekRange.startDate,
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

    // 获取本周的食谱组（按日期排序），包含照片数据
    const mealGroups = await prisma.dietPhotoMealGroup.findMany({
      where: {
        clientId,
        date: {
          gte: weekRange.startDate,
          lte: weekRange.endDate,
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
        { error: '本周暂无饮食记录，请先上传本周的饮食照片' },
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

          const hasPhotos = mealGroup.photos && mealGroup.photos.length > 0;
          const hasTextDescription = mealGroup.textDescription && mealGroup.textDescription.trim().length > 0;

          console.log(`[Weekly Summary] [${i + 1}/${unanalyzedGroups.length}] 正在分析食谱组: ${mealGroup.name}`);
          console.log(`[Weekly Summary]   - 照片: ${hasPhotos ? mealGroup.photos.length + '张' : '无'}`);
          console.log(`[Weekly Summary]   - 文字描述: ${hasTextDescription ? '有' : '无'}`);

          let combinedAnalysis: any = null;

          // 如果有照片，分析照片
          if (hasPhotos) {
            // 分析所有照片
            const analysisResults = [];
            for (let j = 0; j < mealGroup.photos.length; j++) {
              const photo = mealGroup.photos[j];
              try {
                console.log(`[Weekly Summary]   [${j + 1}/${mealGroup.photos.length}] 分析照片 ${photo.id}...`);
                const evaluation = await evaluateDietPhotoCompliance(
                  photo.imageUrl,
                  {
                    name: client.name || '',
                    gender: client.gender || 'FEMALE',
                    age: calculateAge(client.birthDate),
                    healthConcerns: parseHealthConcerns(client.healthConcerns || '[]'),
                  },
                  latestRecommendation.content
                );
                console.log(`[Weekly Summary]   [${j + 1}/${mealGroup.photos.length}] 照片分析完成，评分: ${evaluation.complianceEvaluation?.overallScore}`);

                // 保存单张照片的分析结果
                await prisma.dietPhoto.update({
                  where: { id: photo.id },
                  data: {
                    analysis: JSON.stringify(evaluation),
                    analyzedAt: new Date(),
                  },
                });

                analysisResults.push({
                  photoId: photo.id,
                  evaluation,
                });
              } catch (error) {
                console.error(`Failed to analyze photo ${photo.id}:`, error);
              }
            }

            // 计算照片的综合分析结果
            if (analysisResults.length === 0 && !hasTextDescription) {
              logger.warn(`[Weekly Summary] Failed to analyze any photos for meal group: ${mealGroup.name}`);
              continue;
            }

            // 如果有成功的照片分析结果
            if (analysisResults.length > 0) {
              const avgScore = Math.round(
                analysisResults.reduce((sum, r) => sum + (r as any).evaluation.complianceEvaluation.overallScore, 0) /
                analysisResults.length
              );

              const getRating = (score: number) => {
                if (score >= 90) return '优秀';
                if (score >= 75) return '良好';
                if (score >= 60) return '一般';
                return '需改善';
              };

              // 汇总建议和食物统计
              const allGreenFoods = new Set<string>();
              const allYellowFoods = new Set<string>();
              const allRedFoods = new Set<string>();

              analysisResults.forEach((r: any) => {
                const compliance = r.evaluation.complianceEvaluation?.foodTrafficLightCompliance;
                if (compliance) {
                  compliance.greenFoods?.forEach((food: string) => allGreenFoods.add(food));
                  compliance.yellowFoods?.forEach((food: string) => allYellowFoods.add(food));
                  compliance.redFoods?.forEach((food: string) => allRedFoods.add(food));
                }
              });

              combinedAnalysis = {
                analysisSource: hasTextDescription ? 'both' : 'photos',
                totalPhotos: mealGroup.photos.length,
                analyzedPhotos: analysisResults.length,
                avgScore,
                overallRating: getRating(avgScore),
                summary: {
                  greenFoods: Array.from(allGreenFoods),
                  yellowFoods: Array.from(allYellowFoods),
                  redFoods: Array.from(allRedFoods),
                  totalCount: allRedFoods.size,
                },
              };
            }
          }

          // 如果有文字描述（没有照片或需要合并）
          if (hasTextDescription && (!hasPhotos || combinedAnalysis === null)) {
            console.log(`[Weekly Summary]   使用文字描述分析...`);
            const textEvaluation = await evaluateTextDescriptionCompliance(
              mealGroup.textDescription!,
              {
                name: client.name || '',
                gender: client.gender || 'FEMALE',
                age: calculateAge(client.birthDate),
                healthConcerns: parseHealthConcerns(client.healthConcerns || '[]'),
              },
              latestRecommendation.content
            );
            console.log(`[Weekly Summary]   文字描述分析完成，评分: ${textEvaluation.complianceEvaluation?.overallScore}`);

            combinedAnalysis = {
              analysisSource: 'text',
              totalPhotos: 0,
              hasTextDescription: true,
              ...textEvaluation,
              totalScore: textEvaluation.complianceEvaluation.overallScore,
              overallRating: textEvaluation.complianceEvaluation.overallRating,
            };
          }

          // 如果既有照片又有文字描述，合并结果
          if (hasPhotos && hasTextDescription && combinedAnalysis && combinedAnalysis.analysisSource === 'photos') {
            console.log(`[Weekly Summary]   合并照片和文字描述分析...`);
            try {
              const textEvaluation = await evaluateTextDescriptionCompliance(
                mealGroup.textDescription!,
                {
                  name: client.name || '',
                  gender: client.gender || 'FEMALE',
                  age: calculateAge(client.birthDate),
                  healthConcerns: parseHealthConcerns(client.healthConcerns || '[]'),
                },
                latestRecommendation.content
              );

              // 合并评分
              const photoScore = combinedAnalysis.avgScore;
              const textScore = textEvaluation.complianceEvaluation.overallScore;
              const avgScore = Math.round((photoScore + textScore) / 2);

              const getRating = (score: number) => {
                if (score >= 90) return '优秀';
                if (score >= 75) return '良好';
                if (score >= 60) return '一般';
                return '需改善';
              };

              combinedAnalysis = {
                ...combinedAnalysis,
                analysisSource: 'both',
                hasTextDescription: true,
                totalScore: avgScore,
                overallRating: getRating(avgScore),
                avgScore,
              };

              console.log(`[Weekly Summary]   合并后评分: ${avgScore}`);
            } catch (error) {
              console.error(`[Weekly Summary]   文字描述分析失败，仅使用照片分析:`, error);
            }
          }

          if (!combinedAnalysis) {
            logger.warn(`[Weekly Summary] Failed to analyze meal group: ${mealGroup.name}`);
            continue;
          }

          // 更新食谱组的综合分析结果
          await prisma.dietPhotoMealGroup.update({
            where: { id: mealGroup.id },
            data: {
              combinedAnalysis: JSON.stringify(combinedAnalysis),
              totalScore: combinedAnalysis.totalScore || combinedAnalysis.avgScore,
              overallRating: combinedAnalysis.overallRating,
            },
          });

          logger.info(`[Weekly Summary] Successfully analyzed meal group: ${mealGroup.name}, score: ${combinedAnalysis.totalScore || combinedAnalysis.avgScore}`);
          console.log(`[Weekly Summary] ✓ 食谱组 "${mealGroup.name}" 分析完成，评分: ${combinedAnalysis.totalScore || combinedAnalysis.avgScore}`);
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
            gte: weekRange.startDate,
            lte: weekRange.endDate,
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

    // 准备本周数据
    // 检查本周是否已完整记录
    const today = new Date().toISOString().split('T')[0];
    const isWeekComplete = today > weekRange.endDate; // 今天是否已过周日

    // 计算实际记录的天数
    const recordedDates = new Set(mealGroups.map(g => g.date));
    const recordedDays = recordedDates.size;

    // 本周已过的天数（包括今天）
    const daysSoFar = Math.min(
      new Date().getDay() === 0 ? 7 : new Date().getDay(), // 今天是周几（1-7）
      7
    );

    const weekData = {
      weekRange: `${weekRange.startDate} 至 ${weekRange.endDate}`,
      isPartial: !isWeekComplete, // 标记是否为部分数据
      recordedDays,
      totalDaysInWeek: isWeekComplete ? 7 : daysSoFar, // 如果是部分数据，只计算已过的天数
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
      weekRange: weekRange.startDate,
      mealGroupCount: mealGroups.length,
      totalPhotos,
    });

    // 调用 AI 生成汇总
    logger.info('[Weekly Summary] Calling AI to generate summary...');
    console.log('[Weekly Summary] 准备调用AI生成周汇总');
    console.log('[Weekly Summary] 客户:', clientInfo.name);
    console.log('[Weekly Summary] 周范围:', weekRange.startDate, '至', weekRange.endDate);
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
      isPartialWeek: weekData.isPartial, // 标记是否为部分周数据
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

    // 如果是强制重新生成，先删除旧的
    if (validatedData.forceRegenerate) {
      await prisma.weeklyDietSummary.deleteMany({
        where: {
          clientId,
          weekStartDate: weekRange.startDate,
        },
      });
    }

    // 使用 upsert 来避免并发冲突
    const newSummary = await prisma.weeklyDietSummary.upsert({
      where: {
        clientId_weekStartDate: {
          clientId,
          weekStartDate: weekRange.startDate,
        },
      },
      create: {
        clientId,
        weekStartDate: weekRange.startDate,
        weekEndDate: weekRange.endDate,
        weekNumber: weekRange.weekNumber,
        year: weekRange.year,
        mealGroupIds: JSON.stringify(mealGroups.map((g) => g.id)),
        summary: JSON.stringify(summaryData),
        recommendationId: latestRecommendation.id,
      },
      update: {
        weekEndDate: weekRange.endDate,
        weekNumber: weekRange.weekNumber,
        year: weekRange.year,
        mealGroupIds: JSON.stringify(mealGroups.map((g) => g.id)),
        summary: JSON.stringify(summaryData),
        recommendationId: latestRecommendation.id,
      },
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
    const year = searchParams.get('year');

    const whereClause: any = { clientId };
    if (year) {
      whereClause.year = parseInt(year);
    }

    const summaries = await prisma.weeklyDietSummary.findMany({
      where: whereClause,
      orderBy: [
        { year: 'desc' },
        { weekNumber: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
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
      ...s,
      summary: JSON.parse(s.summary),
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
