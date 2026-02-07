import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { getTask } from '@/lib/task-progress/manager';
import { createExecutor } from '@/lib/task-progress/executor';
import { TaskStatus } from '@/types';
import type { TaskOperationResponse } from '@/types';

/**
 * DELETE /api/clients/[id]/weekly-diet-summary/task/[taskId]/cancel
 *
 * 取消任务
 */
export async function DELETE(
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
    if (task.status === TaskStatus.COMPLETED) {
      return Response.json({
        success: false,
        message: '任务已完成，无法取消',
      } satisfies TaskOperationResponse, { status: 400 });
    }

    if (task.status === TaskStatus.CANCELLED) {
      return Response.json({
        success: true,
        message: '任务已被取消',
        cleanupData: false,
      } satisfies TaskOperationResponse);
    }

    // 执行取消
    const executor = createExecutor('weekly-summary');
    await executor.cancel(taskId);

    return Response.json({
      success: true,
      message: '任务已取消',
      cleanupData: false,
    } satisfies TaskOperationResponse);

  } catch (error: any) {
    console.error('[Task Cancel] Error:', error);
    return Response.json({ success: false, error: error.message || '取消任务失败' }, { status: 500 });
  }
}
