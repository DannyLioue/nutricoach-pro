'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import { Trash2 } from 'lucide-react';

function AnalysisListContent() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClientId, setFilterClientId] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
    fetchClients();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (res.ok) {
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('获取报告列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (res.ok) {
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error('获取客户列表失败:', err);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || '未知';
  };

  const getHealthScoreColor = (score: number | null) => {
    if (score === null) return 'text-zinc-400';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreBg = (score: number | null) => {
    if (score === null) return 'bg-zinc-100 dark:bg-zinc-800';
    if (score >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  // 删除报告
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setReports(reports.filter(r => r.id !== id));
        setDeleteConfirm(null);
      } else {
        const data = await res.json();
        alert(data.error || '删除失败');
      }
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败，请重试');
    }
  };

  const filteredReports = reports.filter(report => {
    if (!filterClientId) return true;
    return report.clientId === filterClientId;
  });

  const stats = {
    total: reports.length,
    analyzed: reports.filter(r => r.analysis && !r.analysis.error).length,
    pending: reports.filter(r => !r.analysis || r.analysis.error).length,
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardNavbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              体检报告
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              查看和管理所有客户的体检报告
            </p>
          </div>
          <Link
            href="/analysis/new"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
          >
            上传新报告
          </Link>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">总报告数</p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">已完成分析</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">
                  {stats.analyzed}
                </p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">待分析</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  {stats.pending}
                </p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
        </div>

        {/* 筛选 */}
        {clients.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-6">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              筛选客户
            </label>
            <select
              value={filterClientId}
              onChange={(e) => setFilterClientId(e.target.value)}
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
            >
              <option value="">全部客户</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 报告列表 */}
        {loading ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-8 text-center">
            <div className="text-zinc-500">加载中...</div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              {filterClientId ? '该客户还没有体检报告' : '还没有体检报告'}
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              {filterClientId
                ? '为客户上传第一份体检报告开始分析'
                : '上传客户的体检报告开始使用 AI 分析'}
            </p>
            {!filterClientId && (
              <Link
                href="/analysis/new"
                className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
              >
                上传第一份报告
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      客户
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      报告名称
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      上传时间
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      分析状态
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {getClientName(report.clientId)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-zinc-700 dark:text-zinc-300">
                          {report.fileName}
                        </div>
                        <div className="text-sm text-zinc-500">
                          {report.fileType}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-zinc-700 dark:text-zinc-300">
                          {new Date(report.uploadedAt).toLocaleDateString('zh-CN')}
                        </div>
                        <div className="text-sm text-zinc-500">
                          {new Date(report.uploadedAt).toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {report.analysis && !report.analysis.error ? (
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium">
                              已分析
                            </span>
                            {report.analysis.healthScore && (
                              <span
                                className={`px-3 py-1 ${getHealthScoreBg(
                                  report.analysis.healthScore
                                )} ${getHealthScoreColor(
                                  report.analysis.healthScore
                                )} rounded-lg text-sm font-bold`}
                              >
                                {report.analysis.healthScore}分
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium">
                            待分析
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/analysis/${report.id}`}
                            className="px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            查看
                          </Link>
                          {report.analysis && !report.analysis.error && (
                            <>
                              <Link
                                href={`/recommendations/new?reportId=${report.id}`}
                                className="px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                              >
                                生成建议
                              </Link>
                              <Link
                                href={`/analysis/${report.id}/edit`}
                                className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              >
                                重新分析
                              </Link>
                            </>
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
                              className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1"
                              title="删除报告"
                            >
                              <Trash2 className="w-4 h-4" />
                              删除
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
          <DashboardNavbar />
          <main className="max-w-7xl mx-auto px-6 py-8">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-8 text-center">
              <div className="text-zinc-500">加载中...</div>
            </div>
          </main>
        </div>
      }
    >
      <AnalysisListContent />
    </Suspense>
  );
}
