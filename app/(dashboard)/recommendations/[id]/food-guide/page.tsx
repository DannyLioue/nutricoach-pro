'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import TrafficLightGuide, { TrafficLightData } from '@/components/TrafficLightGuide';
import { ArrowLeft, Download, Apple } from 'lucide-react';

function FoodGuideContent() {
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

  // 转换 trafficLightFoods 数据格式
  const convertTrafficLightData = (data: any): TrafficLightData | null => {
    if (!data?.trafficLightFoods) return null;

    const convertFoodItem = (item: any, variant: 'green' | 'yellow' | 'red'): any => {
      if (item.name && (item.detail || item.reason || item.category || item.nutrients)) {
        return item;
      }

      const baseItem = {
        name: item.food || item.name || '',
        category: item.category || undefined,
        nutrients: item.nutrients || item.keyNutrients || undefined,
        frequency: item.frequency || item.servingFrequency || undefined,
      };

      if (variant === 'red') {
        return {
          ...baseItem,
          reason: item.reason || item.whyAvoid || '',
          alternatives: item.alternatives || item.substitutes || undefined,
        };
      }

      if (variant === 'yellow') {
        return {
          ...baseItem,
          detail: item.reason || item.detail || item.whyLimit || '',
          limit: item.limit || item.serving || item.dailyLimit || '',
        };
      }

      return {
        ...baseItem,
        detail: item.reason || item.detail || item.whyRecommended || '',
      };
    };

    const getRationale = (variant: 'green' | 'yellow' | 'red'): string => {
      const rationales = {
        green: '这些食物富含改善您当前异常指标所需的关键营养素，是211饮食法的核心组成部分。建议每餐保证50%蔬菜，25%高蛋白食物，25%全谷物。',
        yellow: '这些食物营养价值适中，但热量较高或含有可能影响您指标的成分。建议控制份量和食用频率，可作为偶尔调剂。',
        red: '这些食物会恶化您当前的异常指标，应严格避免。它们通常高盐、高糖、高饱和脂肪或含有对您当前健康状况不利的成分。',
      };
      return rationales[variant];
    };

    return {
      green: {
        title: '🟢 绿灯食物 (推荐食用)',
        description: '富含改善指标的关键营养素，建议作为每餐主要选择',
        rationale: getRationale('green'),
        items: (data.trafficLightFoods.green || []).map((item: any) => convertFoodItem(item, 'green')),
      },
      yellow: {
        title: '🟡 黄灯食物 (控制份量)',
        description: '可适量食用，需注意控制频率和份量',
        rationale: getRationale('yellow'),
        items: (data.trafficLightFoods.yellow || []).map((item: any) => convertFoodItem(item, 'yellow')),
      },
      red: {
        title: '🔴 红灯食物 (严格避免)',
        description: '会恶化当前指标，应从饮食中完全排除',
        rationale: getRationale('red'),
        items: (data.trafficLightFoods.red || []).map((item: any) => convertFoodItem(item, 'red')),
      },
    };
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/recommendations/${id}/export/pdf?type=food`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || '导出失败';
        throw new Error(errorMessage);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `红绿灯食物指南-${recommendation?.client?.name || '客户'}.pdf`;
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
  const trafficLightData = convertTrafficLightData(content);

  if (!trafficLightData) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <DashboardNavbar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-8 text-center">
            <div className="text-zinc-500">暂无食物指南数据</div>
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
                <Apple className="w-6 h-6 text-emerald-600" />
                红绿灯食物指南
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                客户: {recommendation.client?.name || '未知'}
              </p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            {isExporting ? '导出中...' : '导出PDF'}
          </button>
        </div>

        {/* 内容区域 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6">
          <TrafficLightGuide data={trafficLightData} />
        </div>
      </main>
    </div>
  );
}

export default function FoodGuidePage() {
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
      <FoodGuideContent />
    </Suspense>
  );
}
