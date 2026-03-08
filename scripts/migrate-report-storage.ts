/**
 * 报告存储迁移脚本
 *
 * 将 Report.fileUrl 中的历史 Base64 数据迁移为文件路径存储。
 *
 * 用法：
 *   npx tsx scripts/migrate-report-storage.ts
 *   npx tsx scripts/migrate-report-storage.ts --dry-run
 *   npx tsx scripts/migrate-report-storage.ts --limit=100
 */

import { prisma } from '@/lib/db/prisma';
import { deleteFile, saveReportFile } from '@/lib/storage/file-storage';
import { migrateSingleLegacyReport } from '@/lib/reports/migration';
import { Prisma } from '@prisma/client';

interface CliOptions {
  dryRun: boolean;
  limit?: number;
}

function parseCliOptions(argv: string[]): CliOptions {
  const dryRun = argv.includes('--dry-run');
  const limitArg = argv.find((item) => item.startsWith('--limit='));
  if (!limitArg) {
    return { dryRun };
  }

  const raw = Number(limitArg.split('=')[1]);
  if (!Number.isInteger(raw) || raw <= 0) {
    throw new Error('invalid --limit, must be a positive integer');
  }

  return { dryRun, limit: raw };
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));

  console.log('🚀 开始迁移历史报告存储...');
  if (options.dryRun) {
    console.log('🧪 Dry-run 模式，不会写入数据库或文件系统');
  }
  if (options.limit) {
    console.log(`🔢 本次最多处理 ${options.limit} 条记录`);
  }
  console.log('');

  const reports = await prisma.report.findMany({
    where: {
      fileUrl: {
        startsWith: 'data:',
      },
    },
    select: {
      id: true,
      clientId: true,
      fileUrl: true,
      fileName: true,
      extractedData: true,
      uploadedAt: true,
    },
    orderBy: {
      uploadedAt: 'asc',
    },
    take: options.limit,
  });

  if (reports.length === 0) {
    console.log('✅ 没有需要迁移的历史 Base64 报告');
    return;
  }

  console.log(`📦 待处理记录：${reports.length}`);

  let migrated = 0;
  let failed = 0;
  let skipped = 0;
  let dryRunCount = 0;

  for (const report of reports) {
    const result = await migrateSingleLegacyReport(
      report,
      {
        saveReportFile,
        updateReport: async (reportId, nextFileUrl, extractedData) => {
          await prisma.report.update({
            where: { id: reportId },
            data: {
              fileUrl: nextFileUrl,
              extractedData: extractedData as Prisma.InputJsonValue,
            },
          });
        },
        deleteFile,
      },
      { dryRun: options.dryRun }
    );

    if (result.status === 'migrated') {
      migrated++;
      console.log(`✅ ${result.reportId} -> ${result.filePath}`);
      continue;
    }

    if (result.status === 'dry-run') {
      dryRunCount++;
      console.log(`🧪 ${result.reportId} (dry-run)`);
      continue;
    }

    if (result.status === 'skipped') {
      skipped++;
      console.log(`⏭️ ${result.reportId} (${result.reason})`);
      continue;
    }

    failed++;
    console.error(`❌ ${result.reportId} (${result.reason})`);
  }

  console.log('');
  console.log('📊 迁移结果：');
  console.log(`  - migrated: ${migrated}`);
  console.log(`  - dry-run: ${dryRunCount}`);
  console.log(`  - skipped: ${skipped}`);
  console.log(`  - failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ 迁移失败:', error);
  process.exit(1);
});
