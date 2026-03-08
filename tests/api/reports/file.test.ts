/**
 * Report File API 测试
 * GET /api/reports/[id]/file - 读取报告原始文件（兼容路径与历史Base64）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockAuth = vi.fn();
const mockReportFindFirst = vi.fn();
const mockReadFile = vi.fn();

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    report: {
      findFirst: mockReportFindFirst,
    },
  },
}));
vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  const merged = {
    ...actual,
    readFile: mockReadFile,
  };
  return {
    ...merged,
    default: merged,
  };
});

let GET: (request: Request, context: { params: Promise<{ id: string }> }) => Promise<Response>;

describe('Report File API', () => {
  const reportId = 'report-1';
  const userId = 'user-1';

  beforeAll(async () => {
    const route = await import('@/app/api/reports/[id]/file/route');
    GET = route.GET;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: userId } });
  });

  it('should reject unauthorized user', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new Request(`http://localhost:3000/api/reports/${reportId}/file`);
    const res = await GET(req, { params: Promise.resolve({ id: reportId }) });
    expect(res.status).toBe(401);
  });

  it('should return 404 when report not found', async () => {
    mockReportFindFirst.mockResolvedValue(null);
    const req = new Request(`http://localhost:3000/api/reports/${reportId}/file`);
    const res = await GET(req, { params: Promise.resolve({ id: reportId }) });
    expect(res.status).toBe(404);
  });

  it('should return file bytes for legacy base64 report', async () => {
    mockReportFindFirst.mockResolvedValue({
      id: reportId,
      fileName: 'legacy.pdf',
      fileType: 'application/pdf',
      fileUrl: 'data:application/pdf;base64,dGVzdA==',
    });

    const req = new Request(`http://localhost:3000/api/reports/${reportId}/file`);
    const res = await GET(req, { params: Promise.resolve({ id: reportId }) });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.toString('utf-8')).toBe('test');
  });

  it('should return 400 for malformed legacy base64 report', async () => {
    mockReportFindFirst.mockResolvedValue({
      id: reportId,
      fileName: 'legacy.pdf',
      fileType: 'application/pdf',
      fileUrl: 'data:broken',
    });

    const req = new Request(`http://localhost:3000/api/reports/${reportId}/file`);
    const res = await GET(req, { params: Promise.resolve({ id: reportId }) });
    expect(res.status).toBe(400);
  });

  it('should return file bytes for path-based report', async () => {
    mockReportFindFirst.mockResolvedValue({
      id: reportId,
      fileName: 'new.pdf',
      fileType: 'application/pdf',
      fileUrl: '/uploads/clients/a/reports/new.pdf',
    });
    mockReadFile.mockResolvedValue(Buffer.from('pdf-bytes'));

    const req = new Request(`http://localhost:3000/api/reports/${reportId}/file`);
    const res = await GET(req, { params: Promise.resolve({ id: reportId }) });

    expect(res.status).toBe(200);
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.toString('utf-8')).toBe('pdf-bytes');
  });
});
