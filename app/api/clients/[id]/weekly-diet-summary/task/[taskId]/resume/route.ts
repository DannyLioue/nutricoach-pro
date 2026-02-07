import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { getTask } from '@/lib/task-progress/manager';
import { createExecutor } from '@/lib/task-progress/executor';
import { prisma } from '@/lib/db/prisma';
import { TaskStatus } from '@/types';
import type { TaskOperationResponse } from '@/types';

/**
 * POST /api/clients/[id]/weekly-diet-summary/task/[taskId]/resume
 *
 * 恢复暂停的任务
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const clientId = (await params).id;
  const taskId = (await params).taskId;

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

    // 获取任务
    const task = await getTask(taskId);

    if (!task) {
      return Response.json({ success: false, error: '任务不存在' }, { status: 404 });
    }

    // 验证任务归属
    if (task.clientId !== clientId) {
      return Response.json({ success: false, error: '无权访问此任务' }, { status: 403 });
    }

    // 检查任务状态
    if (task.status !== TaskStatus.PAUSED && task.status !== TaskStatus.FAILED) {
      return Response.json({
        success: false,
        message: `任务状态为 ${task.status}，无法恢复`,
        canResume: false,
      } satisfies TaskOperationResponse, { status: 400 });
    }

    // 更新任务状态为运行中
    await prisma.taskProgress.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.RUNNING,
      },
    });

    return Response.json({
      success: true,
      message: '任务已恢复',
      canResume: false,
    } satisfies TaskOperationResponse);

  } catch (error: any) {
    console.error('[Task Resume] Error:', error);
    return Response.json({ success: false, error: error.message || '恢复任务失败' }, { status: 500 });
  }
}
