import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { getTask, updateTaskStatus, sendHeartbeat } from '@/lib/task-progress/manager';
import { createExecutor } from '@/lib/task-progress/executor';
import { TaskStatus } from '@/types';
import type { TaskSSEEvent } from '@/types';

/**
 * GET /api/clients/[id]/weekly-diet-summary/task/[taskId]/stream
 *
 * SSE 流端点，用于实时推送任务进度
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const clientId = (await params).id;
  const taskId = (await params).taskId;

  // 创建 SSE 流
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (data: TaskSSEEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // 验证权限
        const session = await auth();
        if (!session?.user?.id) {
          send({ type: 'error', message: '未授权' });
          controller.close();
          return;
        }

        const accessResult = await verifyClientAccess(clientId, session.user.id);
        if (!accessResult.exists) {
          send({ type: 'error', message: accessResult.error || '无权限访问' });
          controller.close();
          return;
        }

        // 获取任务
        const task = await getTask(taskId);

        if (!task) {
          send({ type: 'error', message: '任务不存在' });
          controller.close();
          return;
        }

        // 验证任务归属
        if (task.clientId !== clientId) {
          send({ type: 'error', message: '无权访问此任务' });
          controller.close();
          return;
        }

        // 检查任务状态
        if (task.status === TaskStatus.COMPLETED) {
          send({ type: 'done', taskId, message: '任务已完成' });
          controller.close();
          return;
        }

        if (task.status === TaskStatus.CANCELLED) {
          send({ type: 'cancelled', message: '任务已取消' });
          controller.close();
          return;
        }

        if (task.status === TaskStatus.FAILED) {
          send({
            type: 'error',
            message: task.error || '任务执行失败',
            recoverable: true,
          });
          controller.close();
          return;
        }

        // 如果任务已暂停，发送暂停事件
        if (task.status === TaskStatus.PAUSED) {
          send({
            type: 'paused',
            message: '任务已暂停',
            canResume: true,
          });
          controller.close();
          return;
        }

        // 更新任务状态为运行中
        if (task.status === TaskStatus.PENDING) {
          await updateTaskStatus(taskId, TaskStatus.RUNNING);
        }

        // 创建并执行任务 - 使用任务的实际类型
        const executor = createExecutor(task.taskType);

        // 在后台执行任务
        executor.execute(taskId, controller).catch((error) => {
          console.error('[Task Stream] Execution error:', error);
          send({
            type: 'error',
            message: error.message || '任务执行出错',
            recoverable: true,
          });
          controller.close();
        });

        // 设置心跳（每30秒）
        const heartbeatInterval = setInterval(async () => {
          try {
            const currentTask = await getTask(taskId);

            if (!currentTask || currentTask.status === TaskStatus.CANCELLED) {
              clearInterval(heartbeatInterval);
              return;
            }

            if (currentTask.status === TaskStatus.PAUSED) {
              clearInterval(heartbeatInterval);
              send({
                type: 'paused',
                message: '任务已暂停',
                canResume: true,
              });
              controller.close();
              return;
            }

            await sendHeartbeat(taskId);
          } catch (error) {
            clearInterval(heartbeatInterval);
          }
        }, 30000);

        // 清理函数
        return () => {
          clearInterval(heartbeatInterval);
        };

      } catch (error: any) {
        console.error('[Task Stream] Error:', error);
        send({
          type: 'error',
          message: error.message || '流处理失败',
          recoverable: false,
        });
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
