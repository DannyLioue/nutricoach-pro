'use client';

import { AlertCircle, Info } from 'lucide-react';

interface PersonalizedRecommendation {
  priority: 'high' | 'medium';
  category: string;
  recommendation: string;
  reason: string;
}

interface PersonalizedRecommendationsProps {
  recommendations: PersonalizedRecommendation[];
}

/**
 * 个性化建议组件
 * 显示针对客户具体情况生成的个性化建议
 */
export default function PersonalizedRecommendations({
  recommendations,
}: PersonalizedRecommendationsProps) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-center py-6 text-zinc-500 dark:text-zinc-400">
        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>暂无个性化建议</p>
      </div>
    );
  }

  // 按优先级分组
  const highPriority = recommendations.filter(r => r.priority === 'high');
  const mediumPriority = recommendations.filter(r => r.priority === 'medium');

  const getPriorityStyles = (priority: string) => {
    return priority === 'high'
      ? 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/10'
      : 'border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'health-concern': '健康关注',
      'user-requirement': '用户需求',
      'nutrition-balance': '营养平衡',
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-3">
      {/* 高优先级建议 */}
      {highPriority.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            重要建议
          </h5>
          <div className="space-y-2">
            {highPriority.map((rec, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${getPriorityStyles('high')}`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                        {getCategoryLabel(rec.category)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {rec.recommendation}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      原因：{rec.reason}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 中等优先级建议 */}
      {mediumPriority.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-2 flex items-center gap-1">
            <Info className="w-4 h-4" />
            一般建议
          </h5>
          <div className="space-y-2">
            {mediumPriority.map((rec, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${getPriorityStyles('medium')}`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                        {getCategoryLabel(rec.category)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {rec.recommendation}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      原因：{rec.reason}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
