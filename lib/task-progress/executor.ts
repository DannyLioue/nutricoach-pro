/**
 * 任务执行器
 * 负责执行任务，支持暂停和恢复
 */

import { prisma } from '@/lib/db/prisma';
import { TaskStatus } from '@/types';
import type {
  TaskType,
  TaskSSEEvent,
  WeeklySummaryTaskParameters,
  WeeklySummaryIntermediateData,
} from '@/types';
import type {
  IncrementalUpdateTaskParameters,
  IncrementalUpdateIntermediateData,
} from '@/types/task-progress';
import {
  evaluateDietPhotoCompliance,
  evaluateTextDescriptionCompliance,
  generateWeeklyDietSummary,
} from '@/lib/ai/gemini';
import type { HealthAnalysis } from '@/types';

/**
 * 执行器接口
 */
export interface TaskExecutor {
  execute(taskId: string, controller: ReadableStreamDefaultController): Promise<void>;
  pause(taskId: string): Promise<void>;
  resume(taskId: string, controller: ReadableStreamDefaultController): Promise<void>;
  cancel(taskId: string): Promise<void>;
}

/**
 * 发送 SSE 事件
 */
function sendEvent(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  data: TaskSSEEvent
) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

/**
 * 检查任务是否需要暂停
 */
async function checkPauseRequest(taskId: string): Promise<boolean> {
  const task = await prisma.taskProgress.findUnique({
    where: { id: taskId },
    select: { status: true },
  });
  return task?.status === TaskStatus.PAUSED;
}

/**
 * 计算年龄
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
 * 周饮食汇总任务执行器
 */
export class WeeklySummaryExecutor implements TaskExecutor {
  private pauseRequested = false;
  private cancelRequested = false;

  /**
   * 执行任务
   */
  async execute(
    taskId: string,
    controller: ReadableStreamDefaultController
  ): Promise<void> {
    const encoder = new TextEncoder();

    try {
      // 获取任务信息
      const task = await prisma.taskProgress.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        sendEvent(controller, encoder, {
          type: 'error',
          message: '任务不存在',
        });
        return;
      }

      const parameters = task.parameters as unknown as WeeklySummaryTaskParameters;
      const clientId = task.clientId;

      // 获取客户信息
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        sendEvent(controller, encoder, {
          type: 'error',
          message: '客户不存在',
        });
        return;
      }

      // 恢复中间数据（如果有）
      let intermediateData: WeeklySummaryIntermediateData = {};
      if (task.intermediateData) {
        try {
          intermediateData = JSON.parse(task.intermediateData);
        } catch (e) {
          console.error('Failed to parse intermediate data:', e);
        }
      }

      // 获取已完成的步骤
      const completedSteps = JSON.parse(task.completedSteps || '[]');

      // 执行任务
      await this.runTask(
        taskId,
        client.id,
        parameters,
        intermediateData,
        completedSteps,
        controller,
        encoder
      );

    } catch (error: any) {
      console.error('[Task Executor] Error:', error);
      await prisma.taskProgress.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.FAILED,
          error: error.message,
        },
      });

      sendEvent(controller, encoder, {
        type: 'error',
        message: error.message || '任务执行失败',
        recoverable: true,
      });
    }
  }

  /**
   * 运行任务主逻辑
   */
  protected async runTask(
    taskId: string,
    clientId: string,
    parameters: WeeklySummaryTaskParameters,
    intermediateData: WeeklySummaryIntermediateData,
    completedSteps: string[],
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder
  ): Promise<void> {
    const { startDate, endDate } = parameters;

    // 定义所有步骤
    const allSteps = [
      { key: 'auth', progress: 5, message: '验证权限...' },
      { key: 'fetch', progress: 10, message: '获取记录...' },
      { key: 'validate', progress: 15, message: '验证数据...' },
      { key: 'recommendation', progress: 20, message: '获取方案...' },
      { key: 'analyze', progress: 25, message: '分析食谱...' },
      { key: 'health', progress: 70, message: '获取体检数据...' },
      { key: 'prepare', progress: 75, message: '准备数据...' },
      { key: 'generate', progress: 80, message: 'AI生成中...' },
      { key: 'save', progress: 95, message: '保存结果...' },
    ];

    // 执行未完成的步骤
    for (const step of allSteps) {
      // 检查是否已完成
      if (completedSteps.includes(step.key)) {
        continue;
      }

      // 检查是否需要暂停
      if (await checkPauseRequest(taskId)) {
        sendEvent(controller, encoder, {
          type: 'paused',
          message: '任务已暂停',
          canResume: true,
        });
        return;
      }

      // 更新当前步骤
      await prisma.taskProgress.update({
        where: { id: taskId },
        data: {
          currentStep: step.key,
          progress: step.progress,
        },
      });

      sendEvent(controller, encoder, {
        type: 'progress',
        step: step.key,
        progress: step.progress,
        message: step.message,
      });

      // 执行步骤
      const result = await this.executeStep(
        step.key,
        taskId,
        clientId,
        parameters,
        intermediateData,
        controller,
        encoder
      );

      // 如果是 generate 步骤，保存结果到中间数据
      if (step.key === 'generate' && result) {
        intermediateData.resultData = result;
      }

      // 更新已完成的步骤
      completedSteps.push(step.key);
      await prisma.taskProgress.update({
        where: { id: taskId },
        data: {
          completedSteps: JSON.stringify(completedSteps),
          intermediateData: JSON.stringify(intermediateData),
        },
      });

      sendEvent(controller, encoder, {
        type: 'stepComplete',
        step: step.key,
        message: `${step.message}完成`,
        completedSteps,
      });
    }

    // 任务完成
    await prisma.taskProgress.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        progress: 100,
        completedAt: new Date(),
      },
    });

    sendEvent(controller, encoder, {
      type: 'done',
      taskId,
      message: '生成完成！',
    });
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(
    stepKey: string,
    taskId: string,
    clientId: string,
    parameters: WeeklySummaryTaskParameters,
    intermediateData: WeeklySummaryIntermediateData,
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder
  ): Promise<any> {
    switch (stepKey) {
      case 'auth':
        return await this.stepAuth(clientId);

      case 'fetch':
        return await this.stepFetch(clientId, parameters, intermediateData);

      case 'validate':
        return await this.stepValidate(intermediateData);

      case 'recommendation':
        return await this.stepRecommendation(clientId, intermediateData);

      case 'analyze':
        return await this.stepAnalyze(
          taskId,
          clientId,
          parameters,
          intermediateData,
          controller,
          encoder
        );

      case 'health':
        return await this.stepHealth(clientId, intermediateData);

      case 'prepare':
        return await this.stepPrepare(parameters, intermediateData);

      case 'generate':
        return await this.stepGenerate(
          clientId,
          intermediateData,
          controller,
          encoder
        );

      case 'save':
        return await this.stepSave(
          taskId,
          clientId,
          parameters,
          intermediateData
        );

      default:
        throw new Error(`未知步骤: ${stepKey}`);
    }
  }

  /**
   * 步骤: 验证权限
   */
  private async stepAuth(clientId: string): Promise<void> {
    // 这里简化处理，实际应该验证用户权限
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new Error('客户不存在');
    }
  }

  /**
   * 步骤: 获取记录
   */
  protected async stepFetch(
    clientId: string,
    parameters: WeeklySummaryTaskParameters,
    intermediateData: WeeklySummaryIntermediateData
  ): Promise<void> {
    const { startDate, endDate, forceRegenerate } = parameters;

    const mealGroups = await prisma.dietPhotoMealGroup.findMany({
      where: {
        clientId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
      include: { photos: true },
    });

    if (mealGroups.length === 0) {
      throw new Error(`所选日期范围（${startDate} 至 ${endDate}）暂无饮食记录`);
    }

    // 初始化已分析列表
    if (!intermediateData.analyzedGroupIds) {
      intermediateData.analyzedGroupIds = [];
    }
    const analyzedIds = intermediateData.analyzedGroupIds; // 非空断言

    // 保存到中间数据
    // 只有在非强制重新生成模式下，才标记已分析的食谱组
    intermediateData.mealGroups = mealGroups.map(g => {
      const analysisStr = g.combinedAnalysis || '';
      const hasAnalysis = analysisStr.trim() !== '' && analysisStr !== '{}';
      // 如果不是强制重新生成，且已有分析数据，则标记为已分析
      if (!forceRegenerate && hasAnalysis && !analyzedIds.includes(g.id)) {
        analyzedIds.push(g.id);
      }
      return {
        id: g.id,
        date: g.date,
        name: g.name,
        mealType: g.mealType || '未分类',
        totalScore: g.totalScore || undefined,
        overallRating: g.overallRating || undefined,
        combinedAnalysis: hasAnalysis ? JSON.parse(analysisStr) : undefined,
      };
    });
  }

  /**
   * 步骤: 验证数据
   */
  private async stepValidate(intermediateData: WeeklySummaryIntermediateData): Promise<void> {
    if (!intermediateData.mealGroups || intermediateData.mealGroups.length === 0) {
      throw new Error('没有找到饮食记录');
    }

    const mealGroupsWithoutData = intermediateData.mealGroups.filter(g => {
      const hasAnalysis = g.combinedAnalysis !== null;
      return !hasAnalysis;
    });

    if (mealGroupsWithoutData.length === intermediateData.mealGroups.length) {
      throw new Error('所有食谱组都没有数据，请先添加数据');
    }
  }

  /**
   * 步骤: 获取营养干预方案
   */
  private async stepRecommendation(
    clientId: string,
    intermediateData: WeeklySummaryIntermediateData
  ): Promise<void> {
    const latestRecommendation = await prisma.recommendation.findFirst({
      where: { clientId, type: 'COMPREHENSIVE' },
      orderBy: { generatedAt: 'desc' },
    });

    if (!latestRecommendation) {
      throw new Error('请先生成营养干预方案，再进行周饮食汇总');
    }

    intermediateData.recommendationId = latestRecommendation.id;
  }

  /**
   * 步骤: 分析食谱
   */
  protected async stepAnalyze(
    taskId: string,
    clientId: string,
    parameters: WeeklySummaryTaskParameters,
    intermediateData: WeeklySummaryIntermediateData,
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder
  ): Promise<void> {
    const { startDate, endDate } = parameters;

    // 获取最新的营养方案
    const recommendation = await prisma.recommendation.findFirst({
      where: { clientId, type: 'COMPREHENSIVE' },
      orderBy: { generatedAt: 'desc' },
    });

    if (!recommendation) {
      throw new Error('请先生成营养干预方案');
    }

    // 获取客户信息
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new Error('客户不存在');
    }

    const clientInfo = {
      name: client.name || '',
      gender: client.gender || 'FEMALE',
      age: calculateAge(client.birthDate),
      healthConcerns: parseHealthConcerns(client.healthConcerns || '[]'),
    };

    // 获取所有食谱组
    const mealGroups = await prisma.dietPhotoMealGroup.findMany({
      where: {
        clientId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
      include: { photos: true },
    });

    // 初始化已分析列表
    if (!intermediateData.analyzedGroupIds) {
      intermediateData.analyzedGroupIds = [];
    }

    // 找出未分析的食谱组
    const unanalyzedGroups = mealGroups.filter(
      g => !g.combinedAnalysis || !intermediateData.analyzedGroupIds?.includes(g.id)
    );

    const skippedCount = intermediateData.analyzedGroupIds.length;
    const totalGroups = mealGroups.length;

    // 发送跳过提示
    if (skippedCount > 0) {
      sendEvent(controller, encoder, {
        type: 'progress',
        step: 'skip',
        progress: 25,
        message: `⚡ 已跳过 ${skippedCount} 个已分析的食谱组`,
        data: { skippedCount, totalGroups },
      });
    }

    if (unanalyzedGroups.length === 0) {
      // 所有都分析过了
      sendEvent(controller, encoder, {
        type: 'stepComplete',
        step: 'analyze',
        message: `✓ 所有 ${totalGroups} 个食谱组已分析完成`,
        completedSteps: ['analyze'],
      });
      return;
    }

    // 分析每个未分析的食谱组
    const needAnalysisCount = unanalyzedGroups.length;
    for (let i = 0; i < needAnalysisCount; i++) {
      // 检查是否需要暂停
      if (await checkPauseRequest(taskId)) {
        // 保存当前进度
        const progress = 25 + Math.floor((i / needAnalysisCount) * 40);
        await prisma.taskProgress.update({
          where: { id: taskId },
          data: {
            progress,
            intermediateData: JSON.stringify(intermediateData),
          },
        });
        return;
      }

      const mealGroup = unanalyzedGroups[i];
      const progress = 25 + Math.floor((i / needAnalysisCount) * 40);

      sendEvent(controller, encoder, {
        type: 'progress',
        step: 'analyzing',
        progress,
        message: `分析食谱组 ${i + 1}/${needAnalysisCount}: ${mealGroup.name}`,
        data: { current: i + 1, total: needAnalysisCount, mealName: mealGroup.name },
      });

      // 分析食谱组
      const hasPhotos = mealGroup.photos && mealGroup.photos.length > 0;
      const hasTextDescription = mealGroup.textDescription && mealGroup.textDescription.trim().length > 0;

      if (!hasPhotos && !hasTextDescription) {
        console.log(`Skipping meal group ${mealGroup.id}: no data`);
        continue;
      }

      let combinedAnalysis: any = null;

      // 分析照片
      if (hasPhotos) {
        const analysisResults = [];

        for (const photo of mealGroup.photos) {
          try {
            // 合并备注：照片备注 + 食谱组备注（如果有）
            const photoNotes = photo.notes?.trim() || '';
            const groupNotes = mealGroup.notes?.trim() || '';
            const combinedNotes = [photoNotes, groupNotes].filter(Boolean).join('；') || null;
            const evaluation = await evaluateDietPhotoCompliance(
              photo.imageUrl,
              clientInfo,
              recommendation.content,
              combinedNotes
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
            console.error(`Failed to analyze photo ${photo.id}:`, error);
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
          clientInfo,
          recommendation.content,
          (mealGroup as any).notes || null // 传递备注信息
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
            clientInfo,
            recommendation.content,
            (mealGroup as any).notes || null // 传递备注信息
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
          console.error(`Failed to merge text description for meal group ${mealGroup.id}:`, error);
        }
      }

      // 保存分析结果
      if (combinedAnalysis) {
        await prisma.dietPhotoMealGroup.update({
          where: { id: mealGroup.id },
          data: {
            combinedAnalysis: JSON.stringify(combinedAnalysis),
            totalScore: combinedAnalysis.totalScore || combinedAnalysis.avgScore,
            overallRating: combinedAnalysis.overallRating,
          },
        });

        // 添加到已分析列表
        intermediateData.analyzedGroupIds.push(mealGroup.id);
      }
    }
  }

  /**
   * 步骤: 获取体检数据
   */
  private async stepHealth(
    clientId: string,
    intermediateData: WeeklySummaryIntermediateData
  ): Promise<void> {
    const latestReport = await prisma.report.findFirst({
      where: { clientId },
      orderBy: { uploadedAt: 'desc' },
      select: { analysis: true },
    });

    intermediateData.healthAnalysis = latestReport?.analysis as HealthAnalysis | null;
  }

  /**
   * 步骤: 准备数据
   */
  private async stepPrepare(
    parameters: WeeklySummaryTaskParameters,
    intermediateData: WeeklySummaryIntermediateData
  ): Promise<void> {
    const { startDate, endDate } = parameters;

    // 重新加载已更新的食谱组
    const mealGroups = await prisma.dietPhotoMealGroup.findMany({
      where: {
        clientId: parameters.clientId,
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

    intermediateData.mealGroups = mealGroups.map(g => ({
      id: g.id,
      date: g.date,
      name: g.name,
      mealType: g.mealType || '未分类',
      totalScore: g.totalScore,
      overallRating: g.overallRating,
      combinedAnalysis: g.combinedAnalysis ? JSON.parse(g.combinedAnalysis) : null,
    }));

    // 计算总照片数
    intermediateData.totalPhotos = 0;
    intermediateData.mealGroups.forEach(g => {
      if (g.combinedAnalysis) {
        intermediateData.totalPhotos += (g.combinedAnalysis.totalPhotos || 0);
      }
    });
  }

  /**
   * 步骤: AI 生成
   */
  private async stepGenerate(
    clientId: string,
    intermediateData: WeeklySummaryIntermediateData,
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder
  ): Promise<any> {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new Error('客户不存在');
    }

    // 获取营养方案
    const recommendation = await prisma.recommendation.findFirst({
      where: { clientId, id: intermediateData.recommendationId },
    });

    if (!recommendation) {
      throw new Error('营养方案不存在');
    }

    const clientInfo = {
      name: client.name || '',
      gender: client.gender || 'FEMALE',
      age: calculateAge(client.birthDate),
      healthConcerns: parseHealthConcerns(client.healthConcerns || '[]'),
      userRequirements: client.userRequirements || null,
      preferences: client.preferences || null,
    };

    // 准备周数据
    const today = new Date().toISOString().split('T')[0];
    const weekData = {
      weekRange: `${intermediateData.mealGroups?.[0]?.date} 至 ${intermediateData.mealGroups?.[intermediateData.mealGroups.length - 1]?.date}`,
      isPartial: false,
      recordedDays: intermediateData.mealGroups?.length || 0,
      totalDaysInWeek: 7,
      today,
      mealGroups: intermediateData.mealGroups?.map(g => {
        // 从 combinedAnalysis 中提取红绿灯食物数据
        const analysis = g.combinedAnalysis;
        const trafficLight = analysis?.foodTrafficLightCompliance || analysis?.trafficLightCompliance || {};
        const nutrition = analysis?.nutritionBalance || analysis?.nutritionAnalysis || {};

        return {
          date: g.date,
          mealType: g.mealType,
          totalScore: g.totalScore || 0,
          // 红绿灯食物（提取到顶层）
          redFoods: trafficLight.redFoods || [],
          yellowFoods: trafficLight.yellowFoods || [],
          greenFoods: trafficLight.greenFoods || [],
          // 营养素评估（提取到顶层）
          protein: nutrition.protein || nutrition.proteinStatus || '-',
          vegetables: nutrition.vegetables || nutrition.vegetableStatus || '-',
          fiber: nutrition.fiber || '-',
          carbs: nutrition.carbs || '-',
          fat: nutrition.fat || '-',
          // 完整分析数据（用于详细分析）
          combinedAnalysis: g.combinedAnalysis,
        };
      }) || [],
    };

    sendEvent(controller, encoder, {
      type: 'progress',
      step: 'generate',
      progress: 85,
      message: `分析 ${intermediateData.mealGroups?.length || 0} 餐记录，${intermediateData.totalPhotos || 0} 张照片`,
      data: {
        mealCount: intermediateData.mealGroups?.length || 0,
        photoCount: intermediateData.totalPhotos || 0,
      },
    });

    // 调用 AI 生成
    const summary = await generateWeeklyDietSummary(
      clientInfo,
      weekData,
      recommendation.content,
      intermediateData.healthAnalysis
    );

    return summary;
  }

  /**
   * 步骤: 保存结果
   */
  private async stepSave(
    taskId: string,
    clientId: string,
    parameters: WeeklySummaryTaskParameters,
    intermediateData: WeeklySummaryIntermediateData
  ): Promise<void> {
    const summary = intermediateData.resultData;

    if (!summary) {
      throw new Error('没有生成汇总结果');
    }

    const { startDate, endDate, summaryName, summaryType } = parameters;

    const summaryData = {
      ...summary,
      weekRange: `${startDate} 至 ${endDate}`,
      isPartialWeek: false,
      recordedDays: intermediateData.mealGroups?.length || 0,
      totalDaysExpected: 7,
      statistics: {
        ...summary.statistics,
        totalMeals: intermediateData.mealGroups?.length || 0,
        totalPhotos: intermediateData.totalPhotos || 0,
        recordedDays: intermediateData.mealGroups?.length || 0,
        totalDaysInWeek: 7,
      },
    };

    // 调用保存结果方法（子类可以重写）
    await this.saveResult(
      clientId,
      startDate,
      endDate,
      summaryType,
      summaryName,
      intermediateData,
      summaryData
    );
  }

  /**
   * 保存汇总结果（可被子类重写）
   * 默认实现：删除旧汇总并创建新汇总
   */
  protected async saveResult(
    clientId: string,
    startDate: string,
    endDate: string,
    summaryType: 'week' | 'custom',
    summaryName: string | undefined,
    intermediateData: WeeklySummaryIntermediateData,
    summaryData: any
  ): Promise<void> {
    // 删除旧的汇总
    await prisma.weeklyDietSummary.deleteMany({
      where: { clientId, startDate, endDate },
    });

    // 创建新汇总
    await prisma.weeklyDietSummary.create({
      data: {
        clientId,
        startDate,
        endDate,
        summaryType,
        summaryName,
        mealGroupIds: JSON.stringify(intermediateData.mealGroups?.map(g => g.id) || []),
        summary: JSON.stringify(summaryData),
        recommendationId: intermediateData.recommendationId,
        weekStartDate: startDate,
        weekEndDate: endDate,
      },
    });
  }

  /**
   * 暂停任务
   */
  async pause(taskId: string): Promise<void> {
    this.pauseRequested = true;
    await prisma.taskProgress.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.PAUSED,
        pausedAt: new Date(),
      },
    });
  }

  /**
   * 恢复任务（由外部调用 execute 实现）
   */
  async resume(
    taskId: string,
    controller: ReadableStreamDefaultController
  ): Promise<void> {
    this.pauseRequested = false;
    await prisma.taskProgress.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.RUNNING,
      },
    });

    // 重新执行任务
    await this.execute(taskId, controller);
  }

  /**
   * 取消任务
   */
  async cancel(taskId: string): Promise<void> {
    this.cancelRequested = true;
    await prisma.taskProgress.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  }
}

// 创建执行器实例
export function createExecutor(taskType: TaskType): TaskExecutor {
  switch (taskType) {
    case 'weekly-summary':
      return new WeeklySummaryExecutor();
    case 'incremental-summary-update':
      return new IncrementalUpdateExecutor();
    default:
      throw new Error(`不支持的任务类型: ${taskType}`);
  }
}

/**
 * 增量更新饮食汇总任务执行器
 * 复用 WeeklySummaryExecutor，但跳过未变化的食谱组
 */
export class IncrementalUpdateExecutor extends WeeklySummaryExecutor {
  // 存储增量更新的额外信息
  private incrementalOptions: {
    isIncrementalUpdate: boolean;
    existingSummaryId: string;
    skippedGroups: any[];
  } = {
    isIncrementalUpdate: false,
    existingSummaryId: '',
    skippedGroups: [],
  };

  /**
   * 执行增量更新任务
   */
  async execute(
    taskId: string,
    controller: ReadableStreamDefaultController
  ): Promise<void> {
    const encoder = new TextEncoder();

    try {
      // 获取任务信息
      const task = await prisma.taskProgress.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        sendEvent(controller, encoder, {
          type: 'error',
          message: '任务不存在',
        });
        return;
      }

      const parameters = task.parameters as unknown as IncrementalUpdateTaskParameters;
      const { summaryId, skipGroupIds, analyzeGroupIds } = parameters;
      const clientId = task.clientId;

      // 获取客户信息
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        sendEvent(controller, encoder, {
          type: 'error',
          message: '客户不存在',
        });
        return;
      }

      // 获取汇总信息
      const summary = await prisma.weeklyDietSummary.findFirst({
        where: { id: summaryId, clientId },
      });

      if (!summary) {
        sendEvent(controller, encoder, {
          type: 'error',
          message: '汇总不存在',
        });
        return;
      }

      // 恢复中间数据（如果有）
      let intermediateData: IncrementalUpdateIntermediateData = {};
      if (task.intermediateData) {
        try {
          intermediateData = JSON.parse(task.intermediateData);
        } catch (e) {
          console.error('Failed to parse intermediate data:', e);
        }
      }

      // 获取已完成的步骤
      const completedSteps = JSON.parse(task.completedSteps || '[]');

      // 获取跳过的食谱组的分析结果
      const skippedGroupsResults = await prisma.dietPhotoMealGroup.findMany({
        where: { id: { in: skipGroupIds } },
        include: { photos: true },
      });

      // 设置增量更新选项
      this.incrementalOptions = {
        isIncrementalUpdate: true,
        existingSummaryId: summaryId,
        skippedGroups: skippedGroupsResults,
      };

      // 将跳过的食谱组数据添加到中间数据
      if (!intermediateData.skippedGroups) {
        intermediateData.skippedGroups = skippedGroupsResults.map(g => ({
          id: g.id,
          combinedAnalysis: g.combinedAnalysis,
        }));
      }

      // 执行任务（复用 WeeklySummaryExecutor 的逻辑）
      await this.runTask(
        taskId,
        client.id,
        {
          clientId,
          startDate: summary.startDate,
          endDate: summary.endDate,
          summaryName: summary.summaryName || undefined,
          summaryType: (summary.summaryType as 'week' | 'custom') || 'custom',
          mealGroupIds: analyzeGroupIds, // 只分析有变化的食谱组
        },
        intermediateData,
        completedSteps,
        controller,
        encoder
      );

    } catch (error: any) {
      console.error('[Incremental Update Executor] Error:', error);

      // 更新任务状态为失败
      await prisma.taskProgress.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.FAILED,
          error: error.message || '增量更新失败',
          completedAt: new Date(),
        },
      });

      sendEvent(controller, encoder, {
        type: 'error',
        error: error.message || '增量更新失败',
        message: '增量更新失败',
        recoverable: false,
      });
    }
  }

  /**
   * 重写 stepFetch - 增量更新版本
   * 只获取需要分析的食谱组，跳过已更新的食谱组
   */
  protected async stepFetch(
    clientId: string,
    parameters: WeeklySummaryTaskParameters,
    intermediateData: WeeklySummaryIntermediateData
  ): Promise<void> {
    // 如果是增量更新，使用特殊的逻辑
    if (this.incrementalOptions.isIncrementalUpdate) {
      const { mealGroupIds: analyzeGroupIds } = parameters;

      // 获取需要分析的食谱组
      const needAnalysisGroups = await prisma.dietPhotoMealGroup.findMany({
        where: {
          id: { in: analyzeGroupIds },
        },
        orderBy: { date: 'asc' },
        include: { photos: true },
      });

      // 合并跳过的食谱组（已有数据）和需要分析的食谱组
      const allMealGroups = [
        ...this.incrementalOptions.skippedGroups.map(g => ({
          id: g.id,
          date: g.date,
          name: g.name,
          mealType: g.mealType || '未分类',
          totalScore: g.totalScore || undefined,
          overallRating: g.overallRating || undefined,
          combinedAnalysis: g.combinedAnalysis ? JSON.parse(g.combinedAnalysis) : undefined,
        })),
        ...needAnalysisGroups.map(g => ({
          id: g.id,
          date: g.date,
          name: g.name,
          mealType: g.mealType || '未分类',
          totalScore: g.totalScore || undefined,
          overallRating: g.overallRating || undefined,
          combinedAnalysis: g.combinedAnalysis ? JSON.parse(g.combinedAnalysis) : undefined,
        })),
      ];

      // 按日期排序
      allMealGroups.sort((a, b) => a.date.localeCompare(b.date));

      if (allMealGroups.length === 0) {
        throw new Error('没有找到饮食记录');
      }

      // 保存到中间数据
      intermediateData.mealGroups = allMealGroups;

      // 标记跳过的食谱组为已分析
      if (!intermediateData.analyzedGroupIds) {
        intermediateData.analyzedGroupIds = [];
      }
      this.incrementalOptions.skippedGroups.forEach(g => {
        if (!intermediateData.analyzedGroupIds!.includes(g.id)) {
          intermediateData.analyzedGroupIds!.push(g.id);
        }
      });
    } else {
      // 如果不是增量更新，使用父类逻辑
      return super.stepFetch(clientId, parameters, intermediateData);
    }
  }

  /**
   * 重写 stepAnalyze - 增量更新版本
   * 只分析需要更新的食谱组，跳过已更新的
   */
  protected async stepAnalyze(
    taskId: string,
    clientId: string,
    parameters: WeeklySummaryTaskParameters,
    intermediateData: WeeklySummaryIntermediateData,
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder
  ): Promise<void> {
    // 如果是增量更新，只分析需要更新的食谱组
    if (this.incrementalOptions.isIncrementalUpdate) {
      const { mealGroupIds: analyzeGroupIds } = parameters;

      // 获取最新的营养方案
      const recommendation = await prisma.recommendation.findFirst({
        where: { clientId, type: 'COMPREHENSIVE' },
        orderBy: { generatedAt: 'desc' },
      });

      if (!recommendation) {
        throw new Error('请先生成营养干预方案');
      }

      // 获取客户信息
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new Error('客户不存在');
      }

      const clientInfo = {
        name: client.name || '',
        gender: client.gender || 'FEMALE',
        age: calculateAge(client.birthDate),
        healthConcerns: parseHealthConcerns(client.healthConcerns || '[]'),
      };

      // 只获取需要分析的食谱组
      const needAnalysisGroups = await prisma.dietPhotoMealGroup.findMany({
        where: {
          id: { in: analyzeGroupIds },
        },
        orderBy: { date: 'asc' },
        include: { photos: true },
      });

      // 初始化已分析列表（包含跳过的食谱组）
      if (!intermediateData.analyzedGroupIds) {
        intermediateData.analyzedGroupIds = [];
      }
      this.incrementalOptions.skippedGroups.forEach(g => {
        if (!intermediateData.analyzedGroupIds!.includes(g.id)) {
          intermediateData.analyzedGroupIds!.push(g.id);
        }
      });

      // 过滤出真正需要分析的食谱组
      const unanalyzedGroups = needAnalysisGroups.filter(
        g => !intermediateData.analyzedGroupIds?.includes(g.id)
      );

      if (unanalyzedGroups.length === 0) {
        // 所有都已分析，直接返回
        return;
      }

      const totalGroups = unanalyzedGroups.length;

      // 分析每个需要分析的食谱组
      for (let i = 0; i < totalGroups; i++) {
        const group = unanalyzedGroups[i];

        // 检查是否需要暂停
        if (await checkPauseRequest(taskId)) {
          const progress = 25 + Math.floor((i / totalGroups) * 40);
          await prisma.taskProgress.update({
            where: { id: taskId },
            data: {
              progress,
              intermediateData: JSON.stringify(intermediateData),
            },
          });
          return;
        }

        // 发送进度更新
        const currentProgress = 25 + Math.floor((i / totalGroups) * 40);
        sendEvent(controller, encoder, {
          type: 'progress',
          step: 'analyzing',
          progress: currentProgress,
          message: `正在分析 ${group.name}`,
          data: {
            mealName: group.name,
            current: i + 1,
            total: totalGroups,
          },
        });

        // 分析食谱组
        const hasPhotos = group.photos && group.photos.length > 0;
        const hasTextDescription = group.textDescription && group.textDescription.trim().length > 0;

        let combinedAnalysis: any = null;

        // 分析照片
        if (hasPhotos) {
          const analysisResults = [];

          for (const photo of group.photos) {
            try {
              // 合并备注：照片备注 + 食谱组备注（如果有）
              const photoNotes = photo.notes?.trim() || '';
              const groupNotes = group.notes?.trim() || '';
              const combinedNotes = [photoNotes, groupNotes].filter(Boolean).join('；') || null;
              const evaluation = await evaluateDietPhotoCompliance(
                photo.imageUrl,
                clientInfo,
                recommendation.content,
                combinedNotes
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
              console.error(`Failed to analyze photo ${photo.id}:`, error);
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
              totalPhotos: group.photos.length,
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
            group.textDescription!,
            clientInfo,
            recommendation.content,
            group.notes || null // 传递备注信息
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
              group.textDescription!,
              clientInfo,
              recommendation.content,
              group.notes || null // 传递备注信息
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
            console.error(`Failed to merge text description for meal group ${group.id}:`, error);
          }
        }

        // 保存分析结果
        if (combinedAnalysis) {
          await prisma.dietPhotoMealGroup.update({
            where: { id: group.id },
            data: {
              combinedAnalysis: JSON.stringify(combinedAnalysis),
              totalScore: combinedAnalysis.totalScore || combinedAnalysis.avgScore,
              overallRating: combinedAnalysis.overallRating,
              updatedAt: new Date(),
            },
          });
        }

        // 标记为已分析
        intermediateData.analyzedGroupIds!.push(group.id);

        // 更新任务进度
        await prisma.taskProgress.update({
          where: { id: taskId },
          data: {
            progress: currentProgress,
            intermediateData: JSON.stringify(intermediateData),
            completedSteps: JSON.stringify(['auth', 'fetch', 'validate', 'recommendation', ...intermediateData.analyzedGroupIds.slice(0, i + 1).map(() => 'analyze')]),
          },
        });

        sendEvent(controller, encoder, {
          type: 'stepComplete',
          step: 'analyzing',
          message: `已完成 ${group.name} 的分析`,
          completedSteps: ['auth', 'fetch', 'validate', 'recommendation', ...intermediateData.analyzedGroupIds],
        });
      }

      // 更新 intermediateData 中的 mealGroups，包含最新的分析结果
      const allMealGroups = await prisma.dietPhotoMealGroup.findMany({
        where: {
          clientId,
          id: { in: [...(this.incrementalOptions.skippedGroups || []).map(g => g.id), ...(analyzeGroupIds || [])] },
        },
        orderBy: { date: 'asc' },
      });

      intermediateData.mealGroups = allMealGroups.map(g => ({
        id: g.id,
        date: g.date,
        name: g.name,
        mealType: g.mealType || '未分类',
        totalScore: g.totalScore || undefined,
        overallRating: g.overallRating || undefined,
        combinedAnalysis: g.combinedAnalysis ? JSON.parse(g.combinedAnalysis) : undefined,
      }));
    } else {
      // 如果不是增量更新，使用父类逻辑
      return super.stepAnalyze(taskId, clientId, parameters, intermediateData, controller, encoder);
    }
  }

  /**
   * 重写保存结果方法，更新现有汇总而不是创建新的
   */
  protected async saveResult(
    clientId: string,
    startDate: string,
    endDate: string,
    summaryType: 'week' | 'custom',
    summaryName: string | undefined,
    intermediateData: IncrementalUpdateIntermediateData,
    summaryData: any
  ): Promise<void> {
    // 如果是增量更新且有现有汇总ID，更新现有汇总
    if (this.incrementalOptions.isIncrementalUpdate && this.incrementalOptions.existingSummaryId) {
      // 更新现有汇总
      await prisma.weeklyDietSummary.update({
        where: { id: this.incrementalOptions.existingSummaryId },
        data: {
          summary: JSON.stringify(summaryData),
          updatedAt: new Date(),
          // mealGroupIds 保持不变，因为食谱组列表没有变化
        },
      });
    } else {
      // 如果不是增量更新，创建新汇总（父类行为）
      return super.saveResult(
        clientId,
        startDate,
        endDate,
        summaryType,
        summaryName,
        intermediateData,
        summaryData
      );
    }
  }
}
