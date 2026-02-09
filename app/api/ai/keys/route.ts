/**
 * AI Keys Management API
 *
 * GET - List user's API keys (safe info only)
 * POST - Add new API key (with validation)
 * DELETE - Remove API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { encryptApiKey, validateAPIKey } from '@/lib/ai/crypto';
import type { AddAPIKeyRequest } from '@/types/ai-config';

/**
 * GET /api/ai/keys
 * List user's API keys (safe info only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keys = await prisma.userAIKey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        providerId: true,
        keyLast4: true,
        isValid: true,
        lastValidated: true,
        createdAt: true,
        updatedAt: true,
        provider: {
          select: {
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    logger.debug('Retrieved API keys for user', {
      userId: session.user.id,
      keysCount: keys.length,
    });

    return NextResponse.json({ keys });
  } catch (error) {
    logger.error('Get API keys error', error);
    return NextResponse.json(
      { error: 'Failed to retrieve API keys' },
      { status: 500 }
    );
  }
}

const addKeySchema = z.object({
  providerId: z.string().min(1, 'Provider ID is required'),
  apiKey: z.string().min(1, 'API key is required'),
});

/**
 * POST /api/ai/keys
 * Add new API key (with validation)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { providerId, apiKey } = addKeySchema.parse(body);

    logger.info('Adding API key for user', {
      userId: session.user.id,
      providerId,
      keyLength: apiKey.length,
    });

    // Verify provider exists
    const provider = await prisma.aIProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Validate the API key
    const isValid = await validateAPIKey(provider.name, apiKey);
    if (!isValid) {
      logger.warn('Invalid API key provided', {
        userId: session.user.id,
        providerId: provider.name,
      });
      return NextResponse.json(
        { error: 'Invalid API key. Please verify the key and try again.' },
        { status: 400 }
      );
    }

    // Extract last 4 characters for display
    const keyLast4 = `...${apiKey.slice(-4)}`;

    // Encrypt the key
    const encryptedKey = encryptApiKey(apiKey);

    // Upsert the key
    const key = await prisma.userAIKey.upsert({
      where: {
        userId_providerId: {
          userId: session.user.id,
          providerId,
        },
      },
      create: {
        userId: session.user.id,
        providerId,
        apiKey: encryptedKey,
        keyLast4,
        isValid: true,
        lastValidated: new Date(),
      },
      update: {
        apiKey: encryptedKey,
        keyLast4,
        isValid: true,
        lastValidated: new Date(),
      },
    });

    logger.info('API key saved for user', {
      userId: session.user.id,
      providerId,
      keyId: key.id,
    });

    return NextResponse.json(
      {
        message: 'API key saved successfully',
        key: {
          id: key.id,
          keyLast4: key.keyLast4,
          providerId: key.providerId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('API key validation failed', {
        errors: error.issues,
      });
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    logger.error('Add API key error', error);
    return NextResponse.json(
      { error: 'Failed to save API key' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai/keys?providerId={providerId}
 * Remove API key
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    logger.info('Deleting API key for user', {
      userId: session.user.id,
      providerId,
    });

    // Verify the key exists
    const existingKey = await prisma.userAIKey.findUnique({
      where: {
        userId_providerId: {
          userId: session.user.id,
          providerId,
        },
      },
    });

    if (!existingKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Delete the key
    await prisma.userAIKey.delete({
      where: {
        userId_providerId: {
          userId: session.user.id,
          providerId,
        },
      },
    });

    logger.info('API key deleted for user', {
      userId: session.user.id,
      providerId,
    });

    return NextResponse.json({ message: 'API key removed successfully' });
  } catch (error) {
    logger.error('Delete API key error', error);
    return NextResponse.json(
      { error: 'Failed to remove API key' },
      { status: 500 }
    );
  }
}
