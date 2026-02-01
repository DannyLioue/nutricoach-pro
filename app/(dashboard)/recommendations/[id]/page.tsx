'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import RecommendationOverview from '@/components/recommendations/RecommendationOverview';
import RecommendationTabs from '@/components/recommendations/RecommendationTabs';
import HealthAnalysisTab from '@/components/recommendations/HealthAnalysisTab';
import FoodGuideTab from '@/components/recommendations/FoodGuideTab';
import ExercisePlanTab from '@/components/recommendations/ExercisePlanTab';
import ActionPlanTab from '@/components/recommendations/ActionPlanTab';
import SupplementsTab from '@/components/recommendations/SupplementsTab';

function RecommendationDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const activeTab = searchParams.get('tab') || 'overview';

  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
              href="/recommendations"
              className="inline-block mt-4 px-6 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg"
            >
              返回列表
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const content = recommendation.content || {};

  // 根据 activeTab 渲染对应内容
  const renderTabContent = () => {
    const clientName = recommendation.client?.name;
    
    switch (activeTab) {
      case 'overview':
        return (
          <RecommendationOverview
            clientName={clientName || '未知'}
            generatedAt={recommendation.generatedAt || recommendation.createdAt}
            recommendationType={recommendation.type}
            dailyTargets={content.dailyTargets}
            biomarkers={content.biomarkerInterventionMapping}
            summary={content.summary}
          />
        );
      case 'health-analysis':
        return (
          <HealthAnalysisTab
            recommendationId={id}
            clientName={clientName}
            content={content}
          />
        );
      case 'food-guide':
        return (
          <FoodGuideTab
            recommendationId={id}
            clientName={clientName}
            content={content}
          />
        );
      case 'exercise-plan':
        return (
          <ExercisePlanTab
            recommendationId={id}
            clientName={clientName}
            content={content}
          />
        );
      case 'action-plan':
        return (
          <ActionPlanTab
            recommendationId={id}
            clientName={clientName}
            content={content}
          />
        );
      case 'supplements':
        return (
          <SupplementsTab
            recommendationId={id}
            clientName={clientName}
            content={content}
          />
        );
      default:
        return (
          <RecommendationOverview
            clientName={clientName || '未知'}
            generatedAt={recommendation.generatedAt || recommendation.createdAt}
            recommendationType={recommendation.type}
            dailyTargets={content.dailyTargets}
            biomarkers={content.biomarkerInterventionMapping}
            summary={content.summary}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardNavbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab 导航 */}
        <RecommendationTabs recommendationId={id} />

        {/* Tab 内容 */}
        <div className="mt-6">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}

export default function RecommendationDetailPage() {
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
      <RecommendationDetailContent />
    </Suspense>
  );
}
