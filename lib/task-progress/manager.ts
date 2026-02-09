/**
 * 任务进度管理器
 * 负责创建、查询、更新任务进度状态
 */

import { prisma } from '@/lib/db/prisma';
import { TaskStatus, TaskType } from '@/types';
import type {
  TaskProgressResponse,
  TaskParameters,
  WeeklySummaryTaskParameters,
  WeeklySummaryIntermediateData,
} from '@/types';
import { Prisma } from '@prisma/client';

/**
 * 创建新任务
 */
export async function createTask(
  taskType: TaskType,
  clientId: string,
  parameters: TaskParameters
): Promise<TaskProgressResponse> {
  const task = await prisma.taskProgress.create({
    data: {
      taskType,
      clientId,
      status: TaskStatus.PENDING,
      progress: 0,
      parameters: parameters as unknown as Prisma.InputJsonValue,
      completedSteps: '[]',
      startedAt: new Date(),
    },
  });

  return mapToResponse(task);
}

/**
 * 获取任务状态
 */
export async function getTask(taskId: string): Promise<TaskProgressResponse | null> {
  const task = await prisma.taskProgress.findUnique({
    where: { id: taskId },
  });

  if (!task) return null;

  // 检查是否超时（超过5分钟无心跳）
  if (task.status === TaskStatus.RUNNING && task.lastHeartbeatAt) {
    const heartbeatAge = Date.now() - new Date(task.lastHeartbeatAt).getTime();
    if (heartbeatAge > 5 * 60 * 1000) { // 5分钟
      // 标记为失败
      await updateTaskStatus(taskId, TaskStatus.FAILED, '任务超时');
      task.status = TaskStatus.FAILED;
      task.error = '任务超时';
    }
  }

  return mapToResponse(task);
}

/**
 * 获取客户的进行中任务
 */
export async function getActiveTask(
  clientId: string,
  taskType: TaskType
): Promise<TaskProgressResponse | null> {
  const task = await prisma.taskProgress.findFirst({
    where: {
      clientId,
      taskType,
      status: {
        in: [TaskStatus.PENDING, TaskStatus.RUNNING, TaskStatus.PAUSED],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return task ? mapToResponse(task) : null;
}

/**
 * 更新任务状态
 */
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  error?: string
): Promise<void> {
  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === TaskStatus.RUNNING && !updateData.startedAt) {
    updateData.startedAt = new Date();
  } else if (status === TaskStatus.PAUSED) {
    updateData.pausedAt = new Date();
  } else if (status === TaskStatus.COMPLETED) {
    updateData.completedAt = new Date();
  } else if (status === TaskStatus.CANCELLED) {
    updateData.cancelledAt = new Date();
  } else if (status === TaskStatus.FAILED && error) {
    updateData.error = error;
  }

  await prisma.taskProgress.update({
    where: { id: taskId },
    data: updateData,
  });
}

/**
 * 更新任务进度
 */
export async function updateTaskProgress(
  taskId: string,
  progress: number,
  currentStep: string,
  completedSteps: string[],
  intermediateData?: WeeklySummaryIntermediateData
): Promise<void> {
  await prisma.taskProgress.update({
    where: { id: taskId },
    data: {
      progress,
      currentStep,
      completedSteps: JSON.stringify(completedSteps),
      intermediateData: intermediateData ? JSON.stringify(intermediateData) : undefined,
      lastHeartbeatAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * 保存任务结果
 */
export async function saveTaskResult(
  taskId: string,
  resultData: any
): Promise<void> {
  await prisma.taskProgress.update({
    where: { id: taskId },
    data: {
      resultData: JSON.stringify(resultData),
      progress: 100,
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
    },
  });
}

/**
 * 发送心跳
 */
export async function sendHeartbeat(taskId: string): Promise<void> {
  await prisma.taskProgress.update({
    where: { id: taskId },
    data: {
      lastHeartbeatAt: new Date(),
    },
  });
}

/**
 * 清理旧任务
 */
export async function cleanupOldTasks(daysOld: number = 7): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.taskProgress.deleteMany({
    where: {
      status: {
        in: [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED],
      },
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

/**
 * 映射到响应格式
 */
function mapToResponse(task: any): TaskProgressResponse {
  return {
    id: task.id,
    clientId: task.clientId,
    taskType: task.taskType as TaskType,
    status: task.status,
    currentStep: task.currentStep,
    progress: task.progress,
    completedSteps: JSON.parse(task.completedSteps || '[]'),
    error: task.error,
    startedAt: task.startedAt?.toISOString(),
    completedAt: task.completedAt?.toISOString(),
    pausedAt: task.pausedAt?.toISOString(),
    cancelledAt: task.cancelledAt?.toISOString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
