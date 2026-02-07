/**
 * AI Models Database Seeding Script
 *
 * This script populates the database with default AI providers and models.
 * Run with: npx tsx prisma/seed-ai-models.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AI providers and models...');

  // Create Google provider
  const google = await prisma.aIProvider.upsert({
    where: { name: 'google' },
    update: {},
    create: {
      name: 'google',
      displayName: 'Google Gemini',
      enabled: true,
    },
  });

  console.log(`✓ Provider: ${google.displayName} (${google.id})`);

  // Define Gemini models
  const geminiModels = [
    {
      providerId: google.id,
      modelId: 'gemini-2.5-pro',
      displayName: 'Gemini 2.5 Pro',
      description: 'Most capable model for complex reasoning and analysis',
      capabilities: JSON.stringify(['text', 'vision', 'json-mode', 'function-calling']),
      maxTokens: 2097152,
      enabled: true,
    },
    {
      providerId: google.id,
      modelId: 'gemini-2.5-flash',
      displayName: 'Gemini 2.5 Flash',
      description: 'Fast and efficient model for quick responses and image analysis',
      capabilities: JSON.stringify(['text', 'vision', 'json-mode']),
      maxTokens: 1048576,
      enabled: true,
    },
  ];

  // Upsert models
  for (const modelData of geminiModels) {
    const model = await prisma.aIModel.upsert({
      where: {
        providerId_modelId: {
          providerId: modelData.providerId,
          modelId: modelData.modelId,
        },
      },
      update: modelData,
      create: modelData,
    });

    const caps = JSON.parse(model.capabilities);
    console.log(
      `  ✓ Model: ${model.displayName} (${model.modelId})` +
      `\n    - Capabilities: ${caps.join(', ')}` +
      `\n    - Max Tokens: ${model.maxTokens?.toLocaleString()}`
    );
  }

  console.log('\n✅ Seeding complete!');
  console.log('\n📊 Summary:');
  const providerCount = await prisma.aIProvider.count();
  const modelCount = await prisma.aIModel.count();
  console.log(`  - Providers: ${providerCount}`);
  console.log(`  - Models: ${modelCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
