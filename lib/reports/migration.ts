import type { Report } from '@prisma/client';

export interface ParsedReportDataUrl {
  mimeType: string;
  buffer: Buffer;
}

export interface ReportMigrationDeps {
  saveReportFile: (clientId: string, fileBuffer: Buffer, filename: string) => Promise<string>;
  updateReport: (reportId: string, nextFileUrl: string, extractedData: Record<string, unknown>) => Promise<void>;
  deleteFile: (filepath: string) => Promise<void>;
}

export interface ReportMigrationOptions {
  dryRun?: boolean;
}

export interface ReportMigrationResult {
  reportId: string;
  status: 'migrated' | 'skipped' | 'failed' | 'dry-run';
  reason?: string;
  filePath?: string;
}

const REPORT_DATA_URL_REGEX = /^data:([^;]+);base64,(.+)$/;

export function isLegacyBase64Report(fileUrl: string): boolean {
  return fileUrl.startsWith('data:');
}

export function parseLegacyReportDataUrl(fileUrl: string): ParsedReportDataUrl {
  const matched = fileUrl.match(REPORT_DATA_URL_REGEX);
  if (!matched) {
    throw new Error('invalid report data url');
  }

  const mimeType = matched[1];
  const base64Payload = matched[2];
  return {
    mimeType,
    buffer: Buffer.from(base64Payload, 'base64'),
  };
}

export function extensionFromMimeType(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'jpg';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'bin';
}

export function buildMigratedReportFilename(
  reportId: string,
  originalFileName: string,
  mimeType: string
): string {
  const safeBaseName = originalFileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .slice(0, 60) || 'report';

  const ext = extensionFromMimeType(mimeType);
  return `${Date.now()}-${reportId}-${safeBaseName}.${ext}`;
}

export async function migrateSingleLegacyReport(
  report: Pick<Report, 'id' | 'clientId' | 'fileUrl' | 'fileName' | 'extractedData'>,
  deps: ReportMigrationDeps,
  options: ReportMigrationOptions = {}
): Promise<ReportMigrationResult> {
  if (!isLegacyBase64Report(report.fileUrl)) {
    return {
      reportId: report.id,
      status: 'skipped',
      reason: 'already migrated',
    };
  }

  const parsed = parseLegacyReportDataUrl(report.fileUrl);
  const filename = buildMigratedReportFilename(report.id, report.fileName, parsed.mimeType);

  if (options.dryRun) {
    return {
      reportId: report.id,
      status: 'dry-run',
      reason: 'preview only',
    };
  }

  let nextFileUrl = '';
  try {
    nextFileUrl = await deps.saveReportFile(report.clientId, parsed.buffer, filename);
    const extractedData =
      report.extractedData && typeof report.extractedData === 'object' && !Array.isArray(report.extractedData)
        ? {
            ...(report.extractedData as Record<string, unknown>),
            storageType: 'file-path',
            migratedAt: new Date().toISOString(),
          }
        : {
            storageType: 'file-path',
            migratedAt: new Date().toISOString(),
          };

    await deps.updateReport(report.id, nextFileUrl, extractedData);
    return {
      reportId: report.id,
      status: 'migrated',
      filePath: nextFileUrl,
    };
  } catch (error) {
    if (nextFileUrl) {
      await deps.deleteFile(nextFileUrl);
    }
    return {
      reportId: report.id,
      status: 'failed',
      reason: error instanceof Error ? error.message : 'unknown error',
    };
  }
}
