/**
 * Prisma Seed Script: Alibaba Qwen Provider and Models
 *
 * This script inserts the Alibaba Qwen provider and its models into the database.
 * Run with: npx prisma db seed
 *
 * Or execute directly with:
 * npx tsx prisma/seed-alibaba-qwen.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Main seed function
 */
async function main() {
  console.log('🌱 Seeding Alibaba Qwen provider and models...');

  // Check if Alibaba provider already exists
  const existingProvider = await prisma.aIProvider.findUnique({
    where: { name: 'alibaba' },
  });

  let providerId: string;

  if (existingProvider) {
    console.log('✅ Alibaba provider already exists, skipping creation.');
    providerId = existingProvider.id;

    // Update existing provider
    await prisma.aIProvider.update({
      where: { id: providerId },
      data: {
        displayName: 'Alibaba Qwen (通义千问)',
        enabled: true,
      },
    });
  } else {
    // Create Alibaba provider
    const provider = await prisma.aIProvider.create({
      data: {
        name: 'alibaba',
        displayName: 'Alibaba Qwen (通义千问)',
        enabled: true,
      },
    });

    providerId = provider.id;
    console.log('✅ Created Alibaba provider:', provider.displayName);
  }

  // Define Qwen models
  const qwenModels = [
    {
      modelId: 'qwen-turbo',
      displayName: 'Qwen Turbo',
      description: 'Fast and cost-effective model for simple text tasks',
      capabilities: JSON.stringify(['text', 'json-mode']),
      maxTokens: 8192,
    },
    {
      modelId: 'qwen-plus',
      displayName: 'Qwen Plus',
      description: 'Balanced performance for most tasks',
      capabilities: JSON.stringify(['text', 'json-mode', 'function-calling']),
      maxTokens: 32768,
    },
    {
      modelId: 'qwen-max',
      displayName: 'Qwen Max',
      description: 'Most powerful model for complex reasoning',
      capabilities: JSON.stringify(['text', 'json-mode', 'function-calling']),
      maxTokens: 32768,
    },
    {
      modelId: 'qwen-vl-plus',
      displayName: 'Qwen VL Plus',
      description: 'Vision-language model for image analysis',
      capabilities: JSON.stringify(['text', 'vision', 'json-mode']),
      maxTokens: 32768,
    },
  ];

  // Insert or update models
  for (const modelData of qwenModels) {
    const existingModel = await prisma.aIModel.findFirst({
      where: {
        providerId,
        modelId: modelData.modelId,
      },
    });

    if (existingModel) {
      // Update existing model
      await prisma.aIModel.update({
        where: { id: existingModel.id },
        data: {
          displayName: modelData.displayName,
          description: modelData.description,
          capabilities: modelData.capabilities,
          maxTokens: modelData.maxTokens,
          enabled: true,
        },
      });
      console.log(`✅ Updated model: ${modelData.modelId}`);
    } else {
      // Create new model
      await prisma.aIModel.create({
        data: {
          providerId,
          ...modelData,
          enabled: true,
        },
      });
      console.log(`✅ Created model: ${modelData.modelId}`);
    }
  }

  console.log('✨ Seeding completed successfully!');
}

/**
 * Handle errors
 */
main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
