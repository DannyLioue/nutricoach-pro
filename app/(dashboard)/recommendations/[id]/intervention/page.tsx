'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import { NutritionInterventionSummary } from '@/components/NutritionInterventionSummary';
import { ArrowLeft, Download, FileText } from 'lucide-react';

function InterventionContent() {
  const params = useParams();
  const id = params.id as string;

  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRecommendation();
    }
  }, [id]);

  const fetchRecommendation = async () => {
    try {
      const res = await fetch(`/api/recommendations/${id}`);
      const data = await res.json();
      if (res.ok) {
        setRecommendation(data.recommendation);
      } else {
        setError(data.error || '获取建议失败');
      }
    } catch (err) {
      console.error('获取建议失败:', err);
      setError('获取建议失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/recommendations/${id}/export/pdf?type=intervention`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || '导出失败';
        throw new Error(errorMessage);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `营养干预方案-${recommendation?.client?.name || '客户'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('导出失败:', error);
      alert(`导出失败: ${error.message || '请重试'}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <DashboardNavbar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-8 text-center">
            <div className="text-zinc-500">加载中...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !recommendation) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <DashboardNavbar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-8 text-center">
            <div className="text-red-600">{error || '建议不存在'}</div>
            <Link
              href={`/recommendations/${id}`}
              className="inline-block mt-4 px-6 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg"
            >
              返回详情
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const content = recommendation.content || {};

  if (!content.dailyTargets && !content.biomarkerInterventionMapping) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <DashboardNavbar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-8 text-center">
            <div className="text-zinc-500">暂无干预方案数据</div>
            <Link
              href={`/recommendations/${id}`}
              className="inline-block mt-4 px-6 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg"
            >
              返回详情
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardNavbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 顶部导航 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/recommendations/${id}`}
              className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-600" />
                营养干预方案
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                客户: {recommendation.client?.name || '未知'}
              </p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            {isExporting ? '导出中...' : '导出PDF'}
          </button>
        </div>

        {/* 标签页导航 */}
        <div className="mb-6 flex gap-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <Link
            href={`/recommendations/${id}`}
            className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border-b-2 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors whitespace-nowrap"
          >
            总览
          </Link>
          <Link
            href={`/recommendations/${id}/food-guide`}
            className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border-b-2 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors whitespace-nowrap"
          >
            红绿灯食物
          </Link>
          <Link
            href={`/recommendations/${id}/exercise-plan`}
            className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border-b-2 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors whitespace-nowrap"
          >
            运动处方
          </Link>
          <Link
            href={`/recommendations/${id}/intervention`}
            className="px-4 py-2 text-sm text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 font-medium transition-colors whitespace-nowrap"
          >
            营养干预方案
          </Link>
        </div>

        {/* 内容区域 */}
        <NutritionInterventionSummary content={content} clientName={recommendation.client?.name || '客户'} />
      </main>
    </div>
  );
}

export default function InterventionPage() {
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
      <InterventionContent />
    </Suspense>
  );
}
