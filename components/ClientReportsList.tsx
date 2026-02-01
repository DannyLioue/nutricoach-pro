'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Trash2, Upload, Loader2 } from 'lucide-react';

interface Report {
  id: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  analysis: {
    healthScore?: number;
    summary?: string;
  } | null;
}

interface ClientReportsListProps {
  clientId: string;
}

export default function ClientReportsList({ clientId }: ClientReportsListProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [clientId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/clients/${clientId}/reports`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '获取报告列表失败');
      }

      setReports(data.reports || []);
    } catch (err: any) {
      console.error('获取报告列表失败:', err);
      setError(err.message || '获取报告列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '删除失败');
      }

      setReports(reports.filter(r => r.id !== reportId));
      setDeleteConfirm(null);
    } catch (err: any) {
      alert('删除失败：' + err.message);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={fetchReports}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText size={48} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          暂无体检报告
        </h3>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          上传体检报告后，AI 将自动分析健康状况
        </p>
        <Link
          href={`/analysis/new?clientId=${clientId}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          上传第一份报告
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 头部操作 */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-zinc-700 dark:text-zinc-300">
          已上传报告 ({reports.length})
        </h4>
        <Link
          href={`/analysis/new?clientId=${clientId}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          上传新报告
        </Link>
      </div>

      {/* 报告列表 */}
      <div className="space-y-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              {/* 报告信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {report.fileName}
                  </h5>
                  {report.analysis ? (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getHealthScoreColor(report.analysis.healthScore || 0)}`}>
                      {report.analysis.healthScore}分
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                      待分析
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                  <span>{report.fileType.toUpperCase()}</span>
                  <span>·</span>
                  <span>{formatDate(report.uploadedAt)}</span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/analysis/${report.id}`}
                  className="px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  查看
                </Link>
                {report.analysis && (
                  <Link
                    href={`/recommendations/new?reportId=${report.id}`}
                    className="px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                  >
                    生成建议
                  </Link>
                )}
                {deleteConfirm === report.id ? (
                  <>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      确认删除
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-zinc-200 hover:bg-zinc-300 rounded-lg transition-colors"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(report.id)}
                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="删除报告"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
