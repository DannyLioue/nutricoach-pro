/**
 * Client Reports API 测试
 * GET /api/clients/[id]/reports - 获取客户的报告列表
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock functions
const mockAuth = vi.fn();
const mockReportFindMany = vi.fn();

// Mock modules
vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    report: {
      findMany: mockReportFindMany,
    },
  },
}));

// Dynamic import
let GET: any;

describe('Client Reports API', () => {
  const mockUserId = 'test-user-id';
  const mockClientId = 'test-client-id';
  const mockAnotherClientId = 'another-client-id';

  const mockReports = [
    {
      id: 'report-1',
      clientId: mockClientId,
      fileName: '体检报告2024.pdf',
      fileType: 'pdf',
      uploadedAt: new Date('2024-03-15T10:00:00Z'),
      analysis: {
        healthScore: 75,
        summary: '整体健康状况良好',
      },
    },
    {
      id: 'report-2',
      clientId: mockClientId,
      fileName: '血常规检查.jpg',
      fileType: 'image',
      uploadedAt: new Date('2024-02-20T14:30:00Z'),
      analysis: null,
    },
    {
      id: 'report-3',
      clientId: mockClientId,
      fileName: '肝功能检查.pdf',
      fileType: 'pdf',
      uploadedAt: new Date('2024-01-10T09:15:00Z'),
      analysis: {
        healthScore: 60,
        summary: '肝功能指标异常',
      },
    },
  ];

  beforeAll(async () => {
    const route = await import('@/app/api/clients/[id]/reports/route');
    GET = route.GET;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com', name: 'Test User' },
    });
  });

  describe('GET /api/clients/[id]/reports', () => {
    it('应该成功返回指定客户的报告列表', async () => {
      mockReportFindMany.mockResolvedValue(mockReports);

      const request = new Request(`http://localhost:3000/api/clients/${mockClientId}/reports`);

      const response = await GET(request, { params: Promise.resolve({ id: mockClientId }) });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.reports).toBeDefined();
      expect(data.reports).toHaveLength(3);
      expect(data.reports[0].fileName).toBe('体检报告2024.pdf');
    });

    it('应该按上传时间倒序排列报告', async () => {
      mockReportFindMany.mockResolvedValue(mockReports);

      const request = new Request(`http://localhost:3000/api/clients/${mockClientId}/reports`);

      const response = await GET(request, { params: Promise.resolve({ id: mockClientId }) });

      expect(response.status).toBe(200);
      const data = await response.json();

      // 验证顺序：最新在上
      const dates = data.reports.map((r: any) => new Date(r.uploadedAt));
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i + 1].getTime());
      }
    });

    it('应该只返回属于当前用户的报告', async () => {
      mockReportFindMany.mockResolvedValue(mockReports);

      const request = new Request(`http://localhost:3000/api/clients/${mockClientId}/reports`);

      await GET(request, { params: Promise.resolve({ id: mockClientId }) });

      expect(mockReportFindMany).toHaveBeenCalledWith({
        where: {
          client: {
            id: mockClientId,
            userId: mockUserId,
          },
        },
        orderBy: {
          uploadedAt: 'desc',
        },
      });
    });

    it('应该返回空数组当客户没有报告时', async () => {
      mockReportFindMany.mockResolvedValue([]);

      const request = new Request(`http://localhost:3000/api/clients/${mockClientId}/reports`);

      const response = await GET(request, { params: Promise.resolve({ id: mockClientId }) });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.reports).toEqual([]);
      expect(data.reports).toHaveLength(0);
    });

    it('未授权用户应该被拒绝', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new Request(`http://localhost:3000/api/clients/${mockClientId}/reports`);

      const response = await GET(request, { params: Promise.resolve({ id: mockClientId }) });

      expect(response.status).toBe(401);
    });

    it('其他用户的报告不应该被访问', async () => {
      // 返回空数组因为客户不属于当前用户
      mockReportFindMany.mockResolvedValue([]);

      const request = new Request(`http://localhost:3000/api/clients/${mockAnotherClientId}/reports`);

      const response = await GET(request, { params: Promise.resolve({ id: mockAnotherClientId }) });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.reports).toEqual([]);
    });

    it('应该正确处理报告的 analysis 字段（可能是 null）', async () => {
      mockReportFindMany.mockResolvedValue(mockReports);

      const request = new Request(`http://localhost:3000/api/clients/${mockClientId}/reports`);

      const response = await GET(request, { params: Promise.resolve({ id: mockClientId }) });

      expect(response.status).toBe(200);
      const data = await response.json();

      // 验证有分析的报告
      const analyzedReports = data.reports.filter((r: any) => r.analysis !== null);
      expect(analyzedReports.length).toBeGreaterThan(0);

      // 验证没有分析的报告
      const pendingReports = data.reports.filter((r: any) => r.analysis === null);
      expect(pendingReports.length).toBeGreaterThan(0);
    });
  });
});
