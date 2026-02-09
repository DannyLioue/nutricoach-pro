import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { logger } from '@/lib/logger';
import { generateWeeklyDietSummary, evaluateDietPhotoCompliance, evaluateTextDescriptionCompliance } from '@/lib/ai/gemini';
import type { HealthAnalysis } from '@/types';

/**
 * SSE Helper: Send event to client
 */
function sendEvent(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  data: { type: string; step?: string; progress?: number; message: string; data?: any; error?: string }
) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

/**
 * 计算年龄的辅助函数
 */
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

/**
 * 解析健康问题
 */
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
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const firstDayOfYear = new Date(monday.getFullYear(), 0, 1);
  const days = Math.floor((monday.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + firstDayOfYear.getDay() + 1) / 7);

  return {
    startDate: monday.toISOString().split('T')[0],
    endDate: sunday.toISOString().split('T')[0],
    weekNumber,
    year: monday.getFullYear(),
  };
}

/**
 * GET - SSE stream for generating weekly diet summary with progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const clientId = (await params).id;
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const summaryName = searchParams.get('summaryName') || '';
  const summaryType = searchParams.get('summaryType') || 'custom';

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Step 1: 验证权限
        send({ type: 'progress', step: 'auth', progress: 5, message: '验证用户权限...' });

        const session = await auth();
        if (!session?.user?.id) {
          send({ type: 'error', error: '未授权' });
          controller.close();
          return;
        }

        const accessResult = await verifyClientAccess(clientId, session.user.id);
        if (!accessResult.exists) {
          send({ type: 'error', error: accessResult.error || '无权限访问' });
          controller.close();
          return;
        }

        const client = accessResult.client!;

        // Step 2: 获取饮食记录
        send({ type: 'progress', step: 'fetch', progress: 10, message: '获取饮食记录...' });

        const mealGroups = await prisma.dietPhotoMealGroup.findMany({
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
            name: true,
            date: true,
            mealType: true,
            notes: true,
            textDescription: true,
            combinedAnalysis: true,
            totalScore: true,
            overallRating: true,
            photos: {
              select: {
                id: true,
                imageUrl: true,
                mealType: true,
                notes: true,
                analysis: true,
              },
            },
          },
        });

        if (mealGroups.length === 0) {
          send({ type: 'error', error: `所选日期范围（${startDate} 至 ${endDate}）暂无饮食记录` });
          controller.close();
          return;
        }

        // 检查是否已有本周汇总
        const existingSummary = await prisma.weeklyDietSummary.findFirst({
          where: { clientId, startDate, endDate },
          select: { id: true, summaryName: true },
        });

        send({
          type: 'progress',
          step: 'validate',
          progress: 15,
          message: `找到 ${mealGroups.length} 条饮食记录${existingSummary ? '（本周已有汇总，将重新生成）' : ''}`,
          data: {
            mealCount: mealGroups.length,
            hasExistingSummary: !!existingSummary,
            existingSummaryId: existingSummary?.id
          }
        });

        // 检查是否有食谱组既没有照片也没有文字描述
        const mealGroupsWithoutData = mealGroups.filter(g =>
          (!g.photos || g.photos.length === 0) && (!g.textDescription || g.textDescription.trim().length === 0)
        );
        if (mealGroupsWithoutData.length > 0) {
          send({ type: 'error', error: `有 ${mealGroupsWithoutData.length} 个食谱组既没有照片也没有文字描述，请先添加数据` });
          controller.close();
          return;
        }

        // Step 3: 获取营养干预方案
        send({ type: 'progress', step: 'recommendation', progress: 20, message: '获取营养干预方案...' });

        const latestRecommendation = await prisma.recommendation.findFirst({
          where: { clientId, type: 'COMPREHENSIVE' },
          orderBy: { generatedAt: 'desc' },
        });

        if (!latestRecommendation) {
          send({ type: 'error', error: '请先生成营养干预方案，再进行周饮食汇总' });
          controller.close();
          return;
        }

        // Step 4: 检查并分析未分析的食谱组
        // 更严格的判断：combinedAnalysis 必须存在且不为空
        logger.info('[Summary] Checking meal groups for analysis...', {
          total: mealGroups.length,
          sampleGroups: mealGroups.slice(0, 3).map(g => ({
            name: g.name,
            hasCombinedAnalysis: !!g.combinedAnalysis,
            combinedAnalysisType: typeof g.combinedAnalysis,
            combinedAnalysisLength: g.combinedAnalysis?.length || 0,
            combinedAnalysisPreview: g.combinedAnalysis ? (typeof g.combinedAnalysis === 'string' ? g.combinedAnalysis.slice(0, 50) : JSON.stringify(g.combinedAnalysis).slice(0, 50)) : null
          }))
        });

        const analyzedGroups = mealGroups.filter(g => {
          if (!g.combinedAnalysis) {
            logger.info(`[Summary] Group "${g.name}" has NO combinedAnalysis`);
            return false;
          }
          // 如果是字符串，检查是否为空
          if (typeof g.combinedAnalysis === 'string') {
            const isEmpty = g.combinedAnalysis.trim().length === 0;
            if (isEmpty) {
              logger.info(`[Summary] Group "${g.name}" has EMPTY combinedAnalysis string`);
            } else {
              logger.info(`[Summary] Group "${g.name}" has VALID combinedAnalysis string (${g.combinedAnalysis.length} chars)`);
            }
            return !isEmpty;
          }
          // 如果是对象，检查是否有内容
          logger.info(`[Summary] Group "${g.name}" has OBJECT combinedAnalysis`);
          return true;
        });
        const unanalyzedGroups = mealGroups.filter(g => !analyzedGroups.includes(g));

        // 调试日志
        logger.info('[Summary Generation] Analysis status:', {
          total: mealGroups.length,
          analyzed: analyzedGroups.length,
          unanalyzed: unanalyzedGroups.length,
          analyzedNames: analyzedGroups.map(g => ({ name: g.name, hasAnalysis: !!g.combinedAnalysis })),
          unanalyzedNames: unanalyzedGroups.map(g => g.name),
        });

        // 通知用户分析状态
        send({
          type: 'progress',
          step: 'check',
          progress: 20,
          message: `📋 扫描完成：共 ${mealGroups.length} 个食谱组`,
          data: {
            total: mealGroups.length,
            analyzed: analyzedGroups.length,
            unanalyzed: unanalyzedGroups.length,
            analyzedGroups: analyzedGroups.map(g => g.name),
            unanalyzedGroups: unanalyzedGroups.map(g => g.name)
          }
        });

        if (analyzedGroups.length > 0) {
          send({
            type: 'progress',
            step: 'skip',
            progress: 22,
            message: `⚡ 已跳过 ${analyzedGroups.length} 个已分析的食谱组（节省 ${Math.round(analyzedGroups.length * 0.5)} 分钟）`,
            data: { skippedCount: analyzedGroups.length, skippedGroups: analyzedGroups.map(g => g.name) }
          });
        }

        if (unanalyzedGroups.length > 0) {
          send({
            type: 'progress',
            step: 'analyze',
            progress: 25,
            message: `🔍 开始分析 ${unanalyzedGroups.length} 个食谱组...`,
            data: { needAnalysisCount: unanalyzedGroups.length, needAnalysisGroups: unanalyzedGroups.map(g => g.name) }
          });

          // 分析每个未分析的食谱组
          for (let i = 0; i < unanalyzedGroups.length; i++) {
            const mealGroup = unanalyzedGroups[i];
            const analyzeProgress = 25 + Math.floor((i / unanalyzedGroups.length) * 40); // 25-65%
            send({ type: 'progress', step: 'analyzing', progress: analyzeProgress, message: `分析食谱组 ${i + 1}/${unanalyzedGroups.length}: ${mealGroup.name}`, data: { current: i + 1, total: unanalyzedGroups.length, mealName: mealGroup.name } });

            try {
              const hasPhotos = mealGroup.photos && mealGroup.photos.length > 0;
              const hasTextDescription = mealGroup.textDescription && mealGroup.textDescription.trim().length > 0;

              let combinedAnalysis: any = null;

              // 分析照片
              if (hasPhotos) {
                const analysisResults = [];
                for (let j = 0; j < mealGroup.photos.length; j++) {
                  const photo = mealGroup.photos[j];
                  try {
                    const evaluation = await evaluateDietPhotoCompliance(
                      photo.imageUrl,
                      {
                        name: client.name || '',
                        gender: client.gender || 'FEMALE',
                        age: calculateAge(client.birthDate),
                        healthConcerns: parseHealthConcerns(client.healthConcerns || '[]'),
                      },
                      latestRecommendation.content,
                      photo.notes // 传递备注信息，对照片的补充说明
                    );

                    await prisma.dietPhoto.update({
                      where: { id: photo.id },
                      data: {
                        analysis: JSON.stringify(evaluation),
                        analyzedAt: new Date(),
                      },
                    });

                    analysisResults.push({ photoId: photo.id, evaluation });
                  } catch (error) {
                    logger.error(`Failed to analyze photo ${photo.id}:`, error);
                  }
                }

                if (analysisResults.length > 0) {
                  const avgScore = Math.round(
                    analysisResults.reduce((sum, r) => sum + r.evaluation.complianceEvaluation.overallScore, 0) /
                    analysisResults.length
                  );

                  const getRating = (score: number) => {
                    if (score >= 90) return '优秀';
                    if (score >= 75) return '良好';
                    if (score >= 60) return '一般';
                    return '需改善';
                  };

                  const allGreenFoods = new Set<string>();
                  const allYellowFoods = new Set<string>();
                  const allRedFoods = new Set<string>();

                  analysisResults.forEach((r) => {
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

              // 分析文字描述
              if (hasTextDescription && (!hasPhotos || combinedAnalysis === null)) {
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

                combinedAnalysis = {
                  analysisSource: 'text',
                  totalPhotos: 0,
                  hasTextDescription: true,
                  ...textEvaluation,
                  totalScore: textEvaluation.complianceEvaluation.overallScore,
                  overallRating: textEvaluation.complianceEvaluation.overallRating,
                };
              }

              // 合并照片和文字分析
              if (hasPhotos && hasTextDescription && combinedAnalysis && combinedAnalysis.analysisSource === 'photos') {
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
                } catch (error) {
                  logger.error(`Failed to merge text description for meal group ${mealGroup.id}:`, error);
                }
              }

              if (combinedAnalysis) {
                await prisma.dietPhotoMealGroup.update({
                  where: { id: mealGroup.id },
                  data: {
                    combinedAnalysis: JSON.stringify(combinedAnalysis),
                    totalScore: combinedAnalysis.totalScore || combinedAnalysis.avgScore,
                    overallRating: combinedAnalysis.overallRating,
                  },
                });

                // 发送食谱组更新事件，让前端实时显示
                send({
                  type: 'mealGroupUpdated',
                  data: {
                    mealGroupId: mealGroup.id,
                    totalScore: combinedAnalysis.totalScore || combinedAnalysis.avgScore,
                    overallRating: combinedAnalysis.overallRating,
                    combinedAnalysis,
                  },
                });
              }
            } catch (error) {
              logger.error(`Failed to analyze meal group ${mealGroup.id}:`, error);
            }
          }

          // 重新加载已更新的食谱组
          const updatedMealGroups = await prisma.dietPhotoMealGroup.findMany({
            where: {
              clientId,
              date: { gte: startDate, lte: endDate },
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

          mealGroups.length = 0;
          mealGroups.push(...updatedMealGroups as any);
        } else {
          // 所有食谱组都已有分析，直接跳到汇总
          send({
            type: 'progress',
            step: 'skip',
            progress: 65,
            message: `✨ 所有食谱组都已有分析，直接生成汇总报告`,
            data: { totalGroups: mealGroups.length, allAnalyzed: true }
          });
        }

        // Step 5: 获取体检数据
        send({ type: 'progress', step: 'health', progress: 70, message: '获取体检数据...' });

        const latestReport = await prisma.report.findFirst({
          where: { clientId },
          orderBy: { uploadedAt: 'desc' },
          select: { analysis: true },
        });

        const healthAnalysis = latestReport?.analysis as HealthAnalysis | null;

        // Step 6: 准备数据
        send({ type: 'progress', step: 'prepare', progress: 75, message: '准备生成数据...' });

        const clientInfo = {
          name: client.name || '',
          gender: client.gender || 'FEMALE',
          age: calculateAge(client.birthDate),
          healthConcerns: parseHealthConcerns(client.healthConcerns || '[]'),
          userRequirements: client.userRequirements || null,
          preferences: client.preferences || null,
        };

        const today = new Date().toISOString().split('T')[0];
        const isRangeComplete = today > endDate;
        const recordedDates = new Set(mealGroups.map(g => g.date));
        const recordedDays = recordedDates.size;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const totalDaysInRange = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
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

        const totalPhotos = mealGroups.reduce((sum, g) => {
          if (g.combinedAnalysis) {
            const analysis = JSON.parse(g.combinedAnalysis);
            return sum + (analysis.totalPhotos || 0);
          }
          return sum;
        }, 0);

        // Step 7: AI 生成汇总
        send({
          type: 'progress',
          step: 'generate',
          progress: 80,
          message: `🤖 AI 正在生成汇总分析（${mealGroups.length}个食谱组，${totalPhotos}张照片）...`,
          data: {
            mealCount: mealGroups.length,
            photoCount: totalPhotos,
            info: '此步骤会调用AI生成整体周报，分析所有饮食数据的趋势和建议'
          }
        });

        let summary;
        try {
          summary = await generateWeeklyDietSummary(
            clientInfo,
            weekData,
            latestRecommendation.content,
            healthAnalysis
          );
        } catch (aiError: any) {
          logger.error('[Weekly Summary] AI generation failed:', aiError);
          send({ type: 'error', error: `AI生成失败: ${aiError.message}`, details: aiError.message });
          controller.close();
          return;
        }

        // Step 8: 保存汇总
        send({ type: 'progress', step: 'save', progress: 95, message: '保存汇总结果...' });

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

        // 删除旧的汇总（如果存在）
        await prisma.weeklyDietSummary.deleteMany({
          where: { clientId, startDate, endDate },
        });

        // 创建新汇总
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

        const newSummary = await prisma.weeklyDietSummary.create({ data: summaryInput });

        // 完成
        send({ type: 'progress', step: 'complete', progress: 100, message: '生成完成！', data: { summaryId: newSummary.id, summary: summaryData } });
        send({ type: 'done', data: { summaryId: newSummary.id, summary: summaryData } });

        controller.close();
      } catch (error: any) {
        logger.error('[Weekly Summary Stream] Error:', error);
        send({ type: 'error', error: error.message || '生成失败' });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
