/**
 * AI Configuration API
 *
 * GET - Retrieve user's AI configuration
 * PUT - Update user's AI configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import type { UserAIConfigResponse, UpdateAIConfigRequest } from '@/types/ai-config';

/**
 * GET /api/ai/config
 * Retrieve user's AI configuration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's AI keys (only last 4 digits)
    const aiKeys = await prisma.userAIKey.findMany({
      where: { userId: session.user.id },
      include: {
        provider: {
          select: {
            name: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch user's model configurations
    const modelConfigs = await prisma.aIModelConfig.findMany({
      where: { userId: session.user.id },
      include: {
        model: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch available models and providers
    const providers = await prisma.aIProvider.findMany({
      where: { enabled: true },
      include: {
        models: {
          where: { enabled: true },
          orderBy: { displayName: 'asc' },
        },
      },
      orderBy: { displayName: 'asc' },
    });

    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        defaultProvider: true,
        useEnvFallback: true,
      },
    });

    const response: UserAIConfigResponse = {
      keys: aiKeys.map((k) => ({
        id: k.id,
        providerId: k.providerId,
        providerName: k.provider.name,
        displayName: k.provider.displayName,
        keyLast4: k.keyLast4,
        isValid: k.isValid,
        lastValidated: k.lastValidated || undefined,
      })),
      configs: modelConfigs.map((c) => ({
        id: c.id,
        userId: c.userId,
        modelId: c.modelId,
        taskType: c.taskType as any,
        enabled: c.enabled,
        model: {
          id: c.model.id,
          modelId: c.model.modelId,
          displayName: c.model.displayName,
          provider: {
            id: c.model.provider.id,
            name: c.model.provider.name,
            displayName: c.model.provider.displayName,
          },
        },
      })),
      providers: providers.map((p) => ({
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        enabled: p.enabled,
        models: p.models.map((m) => ({
          id: m.id,
          modelId: m.modelId,
          displayName: m.displayName,
          capabilities: JSON.parse(m.capabilities),
          enabled: m.enabled,
        })),
      })),
      preferences: {
        defaultProvider: user?.defaultProvider || undefined,
        useEnvFallback: user?.useEnvFallback ?? true,
      },
    };

    logger.debug('AI config retrieved for user', {
      userId: session.user.id,
      keysCount: response.keys.length,
      configsCount: response.configs.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Get AI config error', error);
    return NextResponse.json(
      { error: 'Failed to retrieve AI configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ai/config
 * Update user's AI configuration
 */
const updateConfigSchema = z.object({
  defaultProvider: z.string().optional(),
  useEnvFallback: z.boolean().optional(),
  modelConfigs: z
    .array(
      z.object({
        taskType: z.string(),
        modelId: z.string(),
        enabled: z.boolean().optional(),
      })
    )
    .optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateConfigSchema.parse(body);

    logger.debug('Updating AI config for user', {
      userId: session.user.id,
      data: validatedData,
    });

    // Update user preferences
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        defaultProvider: validatedData.defaultProvider,
        useEnvFallback: validatedData.useEnvFallback,
      },
    });

    // Update model configurations
    if (validatedData.modelConfigs && validatedData.modelConfigs.length > 0) {
      // Delete existing configs for these task types
      const taskTypes = validatedData.modelConfigs.map((c) => c.taskType);
      await prisma.aIModelConfig.deleteMany({
        where: {
          userId: session.user.id,
          taskType: { in: taskTypes },
        },
      });

      // Create new configs
      await prisma.aIModelConfig.createMany({
        data: validatedData.modelConfigs.map((config) => ({
          userId: session.user.id,
          taskType: config.taskType,
          modelId: config.modelId,
          enabled: config.enabled ?? true,
        })),
      });
    }

    logger.info('AI config updated for user', {
      userId: session.user.id,
      configsCount: validatedData.modelConfigs?.length || 0,
    });

    return NextResponse.json({ message: 'Configuration updated' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('AI config validation failed', {
        errors: error.issues,
      });
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    logger.error('Update AI config error', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}
