'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Apple, Dumbbell, Heart, Pill, Calendar, LayoutDashboard } from 'lucide-react';

interface RecommendationTabsProps {
  recommendationId: string;
}

const TABS = [
  { id: 'overview', label: '总览', icon: LayoutDashboard },
  { id: 'health-analysis', label: '健康分析', icon: Heart },
  { id: 'food-guide', label: '饮食指南', icon: Apple },
  { id: 'exercise-plan', label: '运动处方', icon: Dumbbell },
  { id: 'action-plan', label: '执行计划', icon: Calendar },
  { id: 'supplements', label: '补充剂', icon: Pill },
] as const;

export default function RecommendationTabs({ recommendationId }: RecommendationTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const handleTabClick = (tabId: string) => {
    router.push(`/recommendations/${recommendationId}?tab=${tabId}`);
  };

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="flex gap-2 overflow-x-auto" aria-label="推荐方案导航">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                border-b-2 transition-colors
                ${
                  isActive
                    ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                    : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
