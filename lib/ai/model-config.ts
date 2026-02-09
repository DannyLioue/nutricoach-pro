/**
 * AI Model Configuration Service
 *
 * Handles dynamic model selection based on user configuration.
 * Falls back to environment variables when no user configuration is set.
 */

import { prisma } from '@/lib/db/prisma';
import { decryptApiKey } from './crypto';
import type { AITaskType } from '@/types/ai-config';

/**
 * Model configuration result
 */
export interface ModelConfig {
  provider: string;
  modelId: string;
  apiKey: string;
}

/**
 * Get the configured model for a specific task and user
 *
 * Priority:
 * 1. User's configured model for the task
 * 2. User's API key for the provider
 * 3. Environment variable fallback
 *
 * @param userId - The user ID
 * @param taskType - The AI task type
 * @returns Promise with provider, modelId, and apiKey
 * @throws Error if no API key is configured
 */
export async function getModelForTask(
  userId: string,
  taskType: AITaskType
): Promise<ModelConfig> {
  // Check for user-specific configuration
  const config = await prisma.aIModelConfig.findFirst({
    where: {
      userId,
      taskType,
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

  // If user has configured a model for this task
  if (config) {
    // Get user's API key for this provider
    const userKey = await prisma.userAIKey.findUnique({
      where: {
        userId_providerId: {
          userId,
          providerId: config.model.providerId,
        },
      },
    });

    if (userKey && userKey.isValid) {
      // Use user's encrypted key
      const apiKey = decryptApiKey(userKey.apiKey);
      return {
        provider: config.model.provider.name,
        modelId: config.model.modelId,
        apiKey,
      };
    }
  }

  // Fall back to environment variables
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { useEnvFallback: true },
  });

  if (!user || user.useEnvFallback) {
    // Use environment API key
    const envKey = process.env.GEMINI_API_KEY;
    if (!envKey) {
      throw new Error(
        'No API key configured. Please add your API key in Settings, or set GEMINI_API_KEY environment variable.'
      );
    }

    // Return default model for task
    return {
      provider: 'google',
      modelId: getDefaultModelForTask(taskType),
      apiKey: envKey,
    };
  }

  throw new Error(
    'No API key configured. Please add your API key in Settings.'
  );
}

/**
 * Get default model ID for a task type
 *
 * @param taskType - The AI task type
 * @returns Default model ID for the task
 */
export function getDefaultModelForTask(taskType: AITaskType): string {
  const defaults: Record<AITaskType, string> = {
    'health-analysis': 'gemini-2.5-pro',
    'diet-recommendation': 'gemini-2.5-pro',
    'exercise-recommendation': 'gemini-2.5-pro',
    'lifestyle-recommendation': 'gemini-2.5-pro',
    'diet-photo-analysis': 'gemini-2.5-flash',
    'consultation-analysis': 'gemini-2.5-pro',
    'weekly-summary': 'gemini-2.5-pro',
    'general-text': 'gemini-2.5-pro',
  };
  return defaults[taskType] || 'gemini-2.5-pro';
}

/**
 * Get all available models for a specific task
 *
 * @param taskType - The AI task type
 * @returns Promise with array of available models
 */
export async function getAvailableModelsForTask(taskType: AITaskType) {
  const models = await prisma.aIModel.findMany({
    where: { enabled: true },
    include: {
      provider: true,
    },
  });

  // Filter by capability
  return models.filter((model) => {
    const capabilities: string[] = JSON.parse(model.capabilities);

    // Vision tasks require vision capability
    if (taskType === 'diet-photo-analysis') {
      return capabilities.includes('vision');
    }

    // All other tasks require text capability
    return capabilities.includes('text');
  });
}

/**
 * Get all AI providers with their models
 *
 * @returns Promise with array of providers and their models
 */
export async function getAllProviders() {
  return prisma.aIProvider.findMany({
    where: { enabled: true },
    include: {
      models: {
        where: { enabled: true },
      },
    },
  });
}

/**
 * Validate if a model can handle a specific task
 *
 * @param modelId - The model ID
 * @param taskType - The AI task type
 * @returns Promise with true if model can handle the task
 */
export async function canModelHandleTask(
  modelId: string,
  taskType: AITaskType
): Promise<boolean> {
  const model = await prisma.aIModel.findFirst({
    where: { modelId },
    select: { capabilities: true },
  });

  if (!model) {
    return false;
  }

  const capabilities: string[] = JSON.parse(model.capabilities);

  // Vision tasks require vision capability
  if (taskType === 'diet-photo-analysis') {
    return capabilities.includes('vision');
  }

  // All other tasks require text capability
  return capabilities.includes('text');
}
