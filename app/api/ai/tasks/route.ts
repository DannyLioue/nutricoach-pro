/**
 * AI Tasks Visualization API
 *
 * GET - Get current AI model usage per task
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { getDefaultModelForTask } from '@/lib/ai/model-config';
import type { TaskConfiguration, TaskDefinition } from '@/types/ai-config';

/**
 * Task definitions with human-readable names
 */
const TASK_DEFINITIONS: TaskDefinition[] = [
  {
    taskType: 'health-analysis',
    taskName: '健康报告分析',
    description: '体检报告数据分析和健康评估，包括BMI、BMR、TDEE计算及异常指标分析',
  },
  {
    taskType: 'diet-recommendation',
    taskName: '饮食建议生成',
    description: '基于健康数据和体检结果生成个性化饮食干预方案',
  },
  {
    taskType: 'exercise-recommendation',
    taskName: '运动建议生成',
    description: '根据体能状况和健康目标制定个性化运动处方',
  },
  {
    taskType: 'lifestyle-recommendation',
    taskName: '生活方式建议',
    description: '基于健康状况提供生活方式改善建议（睡眠、饮水、压力管理等）',
  },
  {
    taskType: 'diet-photo-analysis',
    taskName: '饮食照片识别',
    description: '食物图片OCR识别和营养成分分析',
  },
  {
    taskType: 'consultation-analysis',
    taskName: '咨询记录分析',
    description: '客户咨询记录的智能分析和关键信息提取',
  },
  {
    taskType: 'weekly-summary',
    taskName: '周饮食汇总',
    description: '一周饮食记录的综合评估和改进建议',
  },
];

/**
 * GET /api/ai/tasks
 * Get current AI model usage per task
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current configurations
    const userConfigs = await prisma.aIModelConfig.findMany({
      where: {
        userId: session.user.id,
        enabled: true,
      },
      include: {
        model: {
          include: {
            provider: true,
          },
        },
      },
    });

    // Get all available models
    const allModels = await prisma.aIModel.findMany({
      where: { enabled: true },
      include: {
        provider: true,
      },
      orderBy: { displayName: 'asc' },
    });

    // Build task configurations
    const tasks: TaskConfiguration[] = TASK_DEFINITIONS.map((task) => {
      const config = userConfigs.find((c) => c.taskType === task.taskType);

      // Default models if no user config
      const defaultModelId = getDefaultModelForTask(task.taskType);
      const currentModel = config?.model || allModels.find((m) => m.modelId === defaultModelId);

      // Filter available models by task capability
      const availableModels = allModels.filter((m) => {
        const capabilities: string[] = JSON.parse(m.capabilities);

        // Vision tasks require vision capability
        if (task.taskType === 'diet-photo-analysis') {
          return capabilities.includes('vision');
        }

        // All other tasks require text capability
        return capabilities.includes('text');
      });

      return {
        taskType: task.taskType,
        taskName: task.taskName,
        description: task.description,
        currentModel: currentModel
          ? {
              modelId: currentModel.modelId,
              displayName: currentModel.displayName,
              provider: currentModel.provider.displayName,
              providerName: currentModel.provider.name,
            }
          : null,
        availableModels: availableModels.map((m) => ({
          modelId: m.modelId,
          displayName: m.displayName,
          provider: m.provider.displayName,
          providerName: m.provider.name,
        })),
        isCustomConfigured: !!config,
      };
    });

    logger.debug('Retrieved AI tasks for user', {
      userId: session.user.id,
      tasksCount: tasks.length,
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    logger.error('Get AI tasks error', error);
    return NextResponse.json(
      { error: 'Failed to retrieve task configurations' },
      { status: 500 }
    );
  }
}
