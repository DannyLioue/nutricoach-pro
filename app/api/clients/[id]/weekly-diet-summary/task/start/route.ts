import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { createTask, getActiveTask } from '@/lib/task-progress/manager';
import type { TaskCreateResponse, WeeklySummaryTaskParameters } from '@/types';

/**
 * POST /api/clients/[id]/weekly-diet-summary/task/start
 *
 * 启动新的周饮食汇总生成任务
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const clientId = (await params).id;

  try {
    // 验证权限
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const accessResult = await verifyClientAccess(clientId, session.user.id);
    if (!accessResult.exists) {
      return Response.json({ success: false, error: accessResult.error || '无权限访问' }, { status: 403 });
    }

    // 检查是否已有进行中的任务
    const existingTask = await getActiveTask(clientId, 'weekly-summary');
    if (existingTask && existingTask.status !== 'CANCELLED' && existingTask.status !== 'FAILED' && existingTask.status !== 'COMPLETED') {
      return Response.json({
        success: true,
        taskId: existingTask.id,
        status: existingTask.status,
        sseUrl: `/api/clients/${clientId}/weekly-diet-summary/task/${existingTask.id}/stream`,
      } satisfies TaskCreateResponse);
    }

    // 解析请求参数
    const body = await request.json();
    const { startDate, endDate, summaryName, summaryType, forceRegenerate } = body;

    // 验证参数
    if (!startDate || !endDate) {
      return Response.json({ success: false, error: '缺少必要参数: startDate, endDate' }, { status: 400 });
    }

    // 验证日期范围
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (daysDiff > 7) {
      return Response.json({ success: false, error: '日期范围不能超过7天' }, { status: 400 });
    }

    if (start > end) {
      return Response.json({ success: false, error: '开始日期不能晚于结束日期' }, { status: 400 });
    }

    // 创建任务参数
    const parameters: WeeklySummaryTaskParameters = {
      clientId,
      startDate,
      endDate,
      summaryName: summaryName || undefined,
      summaryType: summaryType || 'custom',
      forceRegenerate: forceRegenerate || false, // 是否强制重新生成所有食谱组
    };

    // 创建任务
    const task = await createTask('weekly-summary', clientId, parameters);

    return Response.json({
      success: true,
      taskId: task.id,
      status: task.status,
      sseUrl: `/api/clients/${clientId}/weekly-diet-summary/task/${task.id}/stream`,
    } satisfies TaskCreateResponse);

  } catch (error: any) {
    console.error('[Task Start] Error:', error);
    return Response.json({ success: false, error: error.message || '启动任务失败' }, { status: 500 });
  }
}
