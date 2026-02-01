'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import ExercisePrescription from '@/components/ExercisePrescription';
import { ArrowLeft, Download, Dumbbell } from 'lucide-react';

function ExercisePlanContent() {
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
      const res = await fetch(`/api/recommendations/${id}/export/pdf?type=exercise`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || '导出失败';
        throw new Error(errorMessage);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `运动处方-${recommendation?.client?.name || '客户'}.pdf`;
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
  const hasDetailedExercise = !!content.detailedExercisePrescription;
  const hasBasicExercise = !hasDetailedExercise && !!content.exercisePrescription;

  if (!hasDetailedExercise && !hasBasicExercise) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <DashboardNavbar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-8 text-center">
            <div className="text-zinc-500">暂无运动处方数据</div>
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
                <Dumbbell className="w-6 h-6 text-orange-600" />
                运动处方
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                客户: {recommendation.client?.name || '未知'}
              </p>
            </div>
          </div>
          {hasDetailedExercise && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              {isExporting ? '导出中...' : '导出PDF'}
            </button>
          )}
        </div>

        {/* 内容区域 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6">
          {hasDetailedExercise ? (
            <>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
                <Dumbbell className="w-6 h-6 text-orange-600" />
                两周运动训练计划
              </h3>
              <ExercisePrescription data={content.detailedExercisePrescription} />
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
                <Dumbbell className="w-6 h-6 text-orange-600" />
                运动处方
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {content.exercisePrescription?.cardio && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">有氧运动</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-1">
                      类型: {content.exercisePrescription.cardio.type}
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-1">
                      频率: {content.exercisePrescription.cardio.frequency}
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-1">
                      时长: {content.exercisePrescription.cardio.duration}
                    </p>
                  </div>
                )}
                {content.exercisePrescription?.resistance && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">力量训练</h4>
                    <p className="text-sm text-orange-800 dark:text-orange-200 mb-1">
                      类型: {content.exercisePrescription.resistance.type}
                    </p>
                    <p className="text-sm text-orange-800 dark:text-orange-200 mb-1">
                      频率: {content.exercisePrescription.resistance.frequency}
                    </p>
                  </div>
                )}
                {content.exercisePrescription?.flexibility && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">柔韧性</h4>
                    <p className="text-sm text-purple-800 dark:text-purple-200 mb-1">
                      类型: {content.exercisePrescription.flexibility.type}
                    </p>
                    <p className="text-sm text-purple-800 dark:text-purple-200 mb-1">
                      频率: {content.exercisePrescription.flexibility.frequency}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ExercisePlanPage() {
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
      <ExercisePlanContent />
    </Suspense>
  );
}
