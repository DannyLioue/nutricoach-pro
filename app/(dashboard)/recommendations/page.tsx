'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import { Trash2, AlertTriangle } from 'lucide-react';

function RecommendationsListContent() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClientId, setFilterClientId] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
    fetchClients();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/recommendations');
      const data = await res.json();
      if (res.ok) {
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error('获取建议列表失败:', err);
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

  const getDietaryCount = (content: any) => {
    return content?.dietaryRecommendations?.length || 0;
  };

  const getExerciseCount = (content: any) => {
    return content?.exerciseRecommendations?.length || 0;
  };

  const getSupplementCount = (content: any) => {
    return content?.supplements?.length || 0;
  };

  // 检查建议是否有错误
  const hasError = (content: any) => {
    return content?.error || !content?.dailyTargets;
  };

  // 删除建议
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/recommendations/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setRecommendations(recommendations.filter(r => r.id !== id));
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

  // 批量删除有错误的建议
  const handleDeleteErrors = async () => {
    const errorIds = recommendations
      .filter(r => hasError(r.content))
      .map(r => r.id);

    if (errorIds.length === 0) {
      alert('没有发现错误的建议');
      return;
    }

    if (!confirm(`确定要删除 ${errorIds.length} 条错误的建议吗？`)) {
      return;
    }

    try {
      await Promise.all(
        errorIds.map(id =>
          fetch(`/api/recommendations/${id}`, { method: 'DELETE' })
        )
      );

      setRecommendations(recommendations.filter(r => !errorIds.includes(r.id)));
      alert(`已删除 ${errorIds.length} 条错误的建议`);
    } catch (err) {
      console.error('批量删除失败:', err);
      alert('批量删除失败，请重试');
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (!filterClientId) return true;
    return rec.clientId === filterClientId;
  });

  const stats = {
    total: recommendations.length,
    thisMonth: recommendations.filter(r => {
      const date = new Date(r.generatedAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardNavbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              健康建议
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              查看和管理所有客户的健康建议
            </p>
          </div>
          <Link
            href="/recommendations/new"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
          >
            生成新建议
          </Link>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 总建议数 */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">总建议数</p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>

          {/* 本月生成 */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">本月生成</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">
                  {stats.thisMonth}
                </p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>
        </div>

        {/* 批量删除错误建议按钮 */}
        {recommendations.some(r => hasError(r.content)) && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  发现 {recommendations.filter(r => hasError(r.content)).length} 条错误的建议
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  这些建议在生成过程中出现了问题，建议删除
                </p>
              </div>
            </div>
            <button
              onClick={handleDeleteErrors}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              删除所有错误
            </button>
          </div>
        )}

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

        {/* 建议列表 */}
        {loading ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-8 text-center">
            <div className="text-zinc-500">加载中...</div>
          </div>
        ) : filteredRecommendations.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">💡</div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              {filterClientId ? '该客户还没有健康建议' : '还没有健康建议'}
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              {filterClientId
                ? '先为客户的体检报告完成分析，然后生成健康建议'
                : '分析客户的体检报告并生成个性化健康建议'}
            </p>
            {!filterClientId && (
              <Link
                href="/analysis"
                className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors mr-4"
              >
                查看报告
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecommendations.map((rec) => {
              const isError = hasError(rec.content);
              return (
                <div
                  key={rec.id}
                  className={`bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow ${
                    isError ? 'border-red-300 dark:border-red-800' : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                          {rec.client?.name || '未知客户'}
                        </h3>
                        {isError ? (
                          <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            有错误
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium">
                            已完成
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {new Date(rec.generatedAt).toLocaleDateString('zh-CN')} ·
                        {' '}基于报告：{rec.report?.fileName || '未知'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/recommendations/${rec.id}`}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors text-sm"
                      >
                        查看详情
                      </Link>
                      {deleteConfirm === rec.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(rec.id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
                          >
                            确认删除
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-4 py-2 bg-zinc-300 hover:bg-zinc-400 text-zinc-700 font-semibold rounded-lg transition-colors text-sm"
                          >
                            取消
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(rec.id)}
                          className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors text-sm flex items-center gap-1"
                          title="删除建议"
                        >
                          <Trash2 className="w-4 h-4" />
                          删除
                        </button>
                      )}
                    </div>
                  </div>

                {/* 建议内容摘要 */}
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-2xl">🥗</div>
                      <h4 className="font-medium text-zinc-900 dark:text-zinc-100">饮食建议</h4>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {getDietaryCount(rec.content)} 条建议
                    </p>
                  </div>

                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-2xl">🏃</div>
                      <h4 className="font-medium text-zinc-900 dark:text-zinc-100">运动建议</h4>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {getExerciseCount(rec.content)} 条建议
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-2xl">💊</div>
                      <h4 className="font-medium text-zinc-900 dark:text-zinc-100">营养补充</h4>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {getSupplementCount(rec.content)} 种补充剂
                    </p>
                  </div>
                </div>

                {/* 总结 */}
                {rec.content?.summary && (
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">
                      {rec.content.summary}
                    </p>
                  </div>
                )}

                {/* 错误提示 */}
                {rec.content?.error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <strong>错误：</strong>{rec.content.error}
                    </p>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function RecommendationsPage() {
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
      <RecommendationsListContent />
    </Suspense>
  );
}
