'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardNavbar from '@/components/layout/DashboardNavbar';

function NewRecommendationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get('reportId');

  const [reports, setReports] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedReportId, setSelectedReportId] = useState(reportId || '');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

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

  const handleGenerate = async () => {
    if (!selectedReportId) {
      setError('请选择体检报告');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/recommendations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: selectedReportId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '生成建议失败');
      }

      setResult({
        success: true,
        recommendation: data.recommendation,
      });

      // 成功后跳转到建议详情页
      if (data.recommendation?.id) {
        setTimeout(() => {
          router.push(`/recommendations/${data.recommendation.id}`);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message);
      setResult(null);
    } finally {
      setGenerating(false);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || '未知';
  };

  const getReportDate = (uploadedAt: string) => {
    return new Date(uploadedAt).toLocaleDateString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardNavbar />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              生成健康建议
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              基于体检报告分析结果，生成个性化的饮食和运动建议
            </p>
          </div>
          <Link
            href="/recommendations"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            返回列表
          </Link>
        </div>

        {result && result.success && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <p className="text-emerald-700 dark:text-emerald-300 font-medium">
              ✓ 建议生成成功！正在跳转...
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800">
          {/* 选择报告 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              选择体检报告 *
            </label>
            <select
              value={selectedReportId}
              onChange={(e) => setSelectedReportId(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
            >
              <option value="">请选择体检报告</option>
              {reports.map((report) => (
                <option key={report.id} value={report.id}>
                  {getClientName(report.clientId)} - {report.fileName} ({getReportDate(report.uploadedAt)})
                </option>
              ))}
            </select>
            {reports.length === 0 && (
              <p className="text-sm text-zinc-500 mt-2">
                还没有体检报告，请先
                <Link href="/analysis/new" className="text-emerald-600 hover:underline mx-1">
                  上传体检报告
                </Link>
              </p>
            )}
          </div>

          {/* 说明 */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              AI 建议生成说明
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>基于体检报告的 AI 分析结果生成个性化建议</li>
              <li>包含饮食建议、运动建议、生活方式调整等</li>
              <li>考虑客户的年龄、性别、活动水平、过敏原等信息</li>
              <li>生成后可查看、编辑和导出为 PDF</li>
            </ul>
          </div>

          {/* 按钮 */}
          <div className="flex gap-4">
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedReportId}
              className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-400 text-white font-semibold rounded-lg transition-colors"
            >
              {generating ? '生成中...' : '生成建议'}
            </button>
            <Link
              href="/recommendations"
              className="flex-1 px-6 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-lg hover:bg-zinc-300 transition-colors text-center"
            >
              取消
            </Link>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-6 bg-zinc-100 dark:bg-zinc-800 p-6 rounded-xl">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            💡 使用提示
          </h3>
          <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-2">
            <li>• 确保所选报告已完成 AI 分析（有分析结果）</li>
            <li>• 建议基于报告中的健康指标和客户信息生成</li>
            <li>• 生成过程通常需要 10-20 秒</li>
            <li>• 每次生成会创建新的建议记录，方便对比不同时期的建议</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default function NewRecommendationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <DashboardNavbar />
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-8 text-center">
            <div className="text-zinc-500">加载中...</div>
          </div>
        </main>
      </div>
    }>
      <NewRecommendationContent />
    </Suspense>
  );
}
