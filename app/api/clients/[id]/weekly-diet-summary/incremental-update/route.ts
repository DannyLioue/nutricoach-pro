import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { logger } from '@/lib/logger';
import { createTask } from '@/lib/task-progress/manager';
import type { IncrementalUpdateTaskParameters } from '@/types/task-progress';

/**
 * POST /api/clients/[id]/weekly-diet-summary/incremental-update
 *
 * 增量更新饮食汇总
 * 只重新分析有变化的食谱组，跳过未变化的
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let clientId = '';
  try {
    clientId = (await params).id;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    // 验证客户访问权限
    const access = await verifyClientAccess(clientId, session.user.id);
    if (!access.exists) {
      return NextResponse.json({ success: false, error: '客户不存在或无权访问' }, { status: 404 });
    }

    // 解析请求体
    const body = await request.json();
    const { summaryId } = body as { summaryId: string };

    if (!summaryId) {
      return NextResponse.json(
        { success: false, error: '缺少 summaryId 参数' },
        { status: 400 }
      );
    }

    // 获取汇总记录
    const summary = await prisma.weeklyDietSummary.findFirst({
      where: {
        id: summaryId,
        clientId,
      },
    });

    if (!summary) {
      return NextResponse.json(
        { success: false, error: '汇总不存在' },
        { status: 404 }
      );
    }

    // 解析 mealGroupIds
    let mealGroupIds: string[] = [];
    try {
      mealGroupIds = JSON.parse(summary.mealGroupIds);
    } catch {
      mealGroupIds = [];
    }

    if (mealGroupIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '汇总没有关联的食谱组' },
        { status: 400 }
      );
    }

    // 获取所有关联的食谱组
    const mealGroups = await prisma.dietPhotoMealGroup.findMany({
      where: {
        id: { in: mealGroupIds },
        clientId,
      },
      select: {
        id: true,
        name: true,
        date: true,
        combinedAnalysis: true,
        updatedAt: true,
      },
      orderBy: { date: 'asc' },
    });

    // 对比时间戳，分类需要跳过和需要分析的食谱组
    const summaryUpdateTime = new Date(summary.updatedAt).getTime();

    const skippedGroups: Array<{ id: string; name: string }> = [];
    const needAnalysisGroups: Array<{ id: string; name: string }> = [];

    for (const group of mealGroups) {
      const groupUpdateTime = new Date(group.updatedAt).getTime();
      if (groupUpdateTime > summaryUpdateTime) {
        needAnalysisGroups.push({ id: group.id, name: group.name });
      } else {
        skippedGroups.push({ id: group.id, name: group.name });
      }
    }

    // 如果没有需要更新的食谱组，直接返回
    if (needAnalysisGroups.length === 0) {
      return NextResponse.json({
        success: true,
        alreadyUpToDate: true,
        message: '所有食谱组都是最新的，无需更新',
        updatePlan: {
          skippedGroups,
          needAnalysisGroups: [],
        },
      });
    }

    // 检查是否有正在运行的任务
    const activeTask = await prisma.taskProgress.findFirst({
      where: {
        clientId,
        taskType: 'incremental-summary-update',
        status: { in: ['PENDING', 'RUNNING'] },
      },
    });

    if (activeTask) {
      return NextResponse.json({
        success: false,
        error: '已有更新任务正在运行',
        activeTaskId: activeTask.id,
      }, { status: 409 });
    }

    // 创建增量更新任务
    const taskParameters: IncrementalUpdateTaskParameters = {
      summaryId,
      clientId,
      skipGroupIds: skippedGroups.map((g) => g.id),
      analyzeGroupIds: needAnalysisGroups.map((g) => g.id),
    };

    const task = await createTask('incremental-summary-update', clientId, taskParameters);

    logger.info('创建增量更新任务', {
      taskId: task.id,
      clientId,
      summaryId,
      skippedCount: skippedGroups.length,
      analyzeCount: needAnalysisGroups.length,
    });

    return NextResponse.json({
      success: true,
      taskId: task.id,
      status: task.status,
      sseUrl: `/api/clients/${clientId}/weekly-diet-summary/task/${task.id}/stream`,
      updatePlan: {
        skippedGroups,
        needAnalysisGroups,
      },
    });
  } catch (error) {
    logger.error('创建增量更新任务失败', { clientId, error });
    return NextResponse.json(
      { success: false, error: '创建更新任务失败' },
      { status: 500 }
    );
  }
}
