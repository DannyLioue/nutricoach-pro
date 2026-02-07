import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { getTask } from '@/lib/task-progress/manager';
import { createExecutor } from '@/lib/task-progress/executor';
import { TaskStatus } from '@/types';
import type { TaskStatusResponse, TaskOperationResponse } from '@/types';

/**
 * GET /api/clients/[id]/weekly-diet-summary/task/[taskId]/status
 *
 * 获取任务状态
 */
export async function GET(
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

    // 获取任务状态
    const task = await getTask(taskId);

    if (!task) {
      return Response.json({ success: false, error: '任务不存在' }, { status: 404 });
    }

    // 验证任务归属
    if (task.clientId !== clientId) {
      return Response.json({ success: false, error: '无权访问此任务' }, { status: 403 });
    }

    return Response.json({
      success: true,
      task,
    } satisfies TaskStatusResponse);

  } catch (error: any) {
    console.error('[Task Status] Error:', error);
    return Response.json({ success: false, error: error.message || '获取任务状态失败' }, { status: 500 });
  }
}

/**
 * POST /api/clients/[id]/weekly-diet-summary/task/[taskId]/pause
 *
 * 暂停任务
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
    if (task.status !== TaskStatus.RUNNING && task.status !== TaskStatus.PENDING) {
      return Response.json({
        success: false,
        message: `任务状态为 ${task.status}，无法暂停`,
        canResume: false,
      } satisfies TaskOperationResponse, { status: 400 });
    }

    // 执行暂停
    const executor = createExecutor('weekly-summary');
    await executor.pause(taskId);

    return Response.json({
      success: true,
      message: '任务已暂停，可稍后继续',
      canResume: true,
    } satisfies TaskOperationResponse);

  } catch (error: any) {
    console.error('[Task Pause] Error:', error);
    return Response.json({ success: false, error: error.message || '暂停任务失败' }, { status: 500 });
  }
}
