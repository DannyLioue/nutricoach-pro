import { describe, expect, it, vi } from 'vitest';
import {
  buildMigratedReportFilename,
  extensionFromMimeType,
  isLegacyBase64Report,
  migrateSingleLegacyReport,
  parseLegacyReportDataUrl,
} from '@/lib/reports/migration';

describe('report migration helpers', () => {
  it('should detect legacy base64 report url', () => {
    expect(isLegacyBase64Report('data:application/pdf;base64,abcd')).toBe(true);
    expect(isLegacyBase64Report('/uploads/clients/a/reports/test.pdf')).toBe(false);
  });

  it('should parse legacy report data url', () => {
    const parsed = parseLegacyReportDataUrl('data:text/plain;base64,dGVzdA==');
    expect(parsed.mimeType).toBe('text/plain');
    expect(parsed.buffer.toString('utf-8')).toBe('test');
  });

  it('should map mime type to extension', () => {
    expect(extensionFromMimeType('application/pdf')).toBe('pdf');
    expect(extensionFromMimeType('image/png')).toBe('png');
    expect(extensionFromMimeType('image/jpeg')).toBe('jpg');
    expect(extensionFromMimeType('application/octet-stream')).toBe('bin');
  });

  it('should build migrated filename with report id and sanitized name', () => {
    const filename = buildMigratedReportFilename('rpt123', '报告-2026/03.pdf', 'application/pdf');
    expect(filename).toContain('-rpt123-');
    expect(filename.endsWith('.pdf')).toBe(true);
    expect(filename).toContain('__-2026_03');
  });
});

describe('migrateSingleLegacyReport', () => {
  const baseReport = {
    id: 'rpt_1',
    clientId: 'client_1',
    fileUrl: 'data:application/pdf;base64,dGVzdA==',
    fileName: 'report.pdf',
    extractedData: { source: 'legacy' },
  };

  it('should return dry-run result without side effects', async () => {
    const deps = {
      saveReportFile: vi.fn(),
      updateReport: vi.fn(),
      deleteFile: vi.fn(),
    };

    const result = await migrateSingleLegacyReport(baseReport, deps, { dryRun: true });
    expect(result.status).toBe('dry-run');
    expect(deps.saveReportFile).not.toHaveBeenCalled();
    expect(deps.updateReport).not.toHaveBeenCalled();
    expect(deps.deleteFile).not.toHaveBeenCalled();
  });

  it('should skip non-legacy report', async () => {
    const deps = {
      saveReportFile: vi.fn(),
      updateReport: vi.fn(),
      deleteFile: vi.fn(),
    };

    const result = await migrateSingleLegacyReport(
      { ...baseReport, fileUrl: '/uploads/clients/client_1/reports/a.pdf' },
      deps,
      {}
    );
    expect(result.status).toBe('skipped');
    expect(deps.saveReportFile).not.toHaveBeenCalled();
  });

  it('should migrate legacy report successfully', async () => {
    const deps = {
      saveReportFile: vi.fn().mockResolvedValue('/uploads/clients/client_1/reports/new.pdf'),
      updateReport: vi.fn().mockResolvedValue(undefined),
      deleteFile: vi.fn().mockResolvedValue(undefined),
    };

    const result = await migrateSingleLegacyReport(baseReport, deps, {});
    expect(result.status).toBe('migrated');
    expect(deps.saveReportFile).toHaveBeenCalledTimes(1);
    expect(deps.updateReport).toHaveBeenCalledTimes(1);
    expect(deps.deleteFile).not.toHaveBeenCalled();
  });

  it('should rollback written file when db update fails', async () => {
    const deps = {
      saveReportFile: vi.fn().mockResolvedValue('/uploads/clients/client_1/reports/new.pdf'),
      updateReport: vi.fn().mockRejectedValue(new Error('db down')),
      deleteFile: vi.fn().mockResolvedValue(undefined),
    };

    const result = await migrateSingleLegacyReport(baseReport, deps, {});
    expect(result.status).toBe('failed');
    expect(deps.deleteFile).toHaveBeenCalledWith('/uploads/clients/client_1/reports/new.pdf');
  });
});
