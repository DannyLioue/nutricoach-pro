'use client';

import { Minus, Plus, RefreshCw } from 'lucide-react';

interface RemovalSuggestion {
  food: string;
  reason: string;
  alternatives?: string[];
  photoId?: string;
}

interface AdditionSuggestion {
  food: string;
  reason: string;
  targetMeal?: string;
  amount?: string;
  photoId?: string;
}

interface ModificationSuggestion {
  food: string;
  currentIssue: string;
  suggestedChange: string;
  reason: string;
  photoId?: string;
}

interface GeneralRecommendationsProps {
  recommendations?: {
    removals?: RemovalSuggestion[];
    additions?: AdditionSuggestion[];
    modifications?: ModificationSuggestion[];
  };
}

/**
 * 通用建议组件
 * 显示需要移除、添加、修改的食物建议
 */
export default function GeneralRecommendations({
  recommendations,
}: GeneralRecommendationsProps) {
  if (!recommendations) {
    return (
      <div className="text-center py-6 text-zinc-500 dark:text-zinc-400">
        暂无建议
      </div>
    );
  }

  const hasRemovals = recommendations.removals && recommendations.removals.length > 0;
  const hasAdditions = recommendations.additions && recommendations.additions.length > 0;
  const hasModifications = recommendations.modifications && recommendations.modifications.length > 0;

  if (!hasRemovals && !hasAdditions && !hasModifications) {
    return (
      <div className="text-center py-6 text-green-600 dark:text-green-400">
        <p className="text-sm">饮食安排合理，暂无调整建议！</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 需要移除的食物 */}
      {hasRemovals && (
        <div>
          <h5 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
            <Minus className="w-4 h-4" />
            需要移除的食物 ({recommendations.removals!.length})
          </h5>
          <div className="space-y-2">
            {recommendations.removals!.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-red-900 dark:text-red-100">
                      {item.food}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {item.reason}
                    </p>
                    {item.alternatives && item.alternatives.length > 0 && (
                      <div className="mt-2 text-xs">
                        <span className="text-red-600 dark:text-red-400">替代方案：</span>
                        <span className="text-red-800 dark:text-red-200 ml-1">
                          {item.alternatives.join('、')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 需要添加的食物 */}
      {hasAdditions && (
        <div>
          <h5 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
            <Plus className="w-4 h-4" />
            建议添加的食物 ({recommendations.additions!.length})
          </h5>
          <div className="space-y-2">
            {recommendations.additions!.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-green-900 dark:text-green-100">
                      {item.food}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {item.reason}
                    </p>
                    {(item.targetMeal || item.amount) && (
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                        {item.targetMeal && <span>{item.targetMeal}</span>}
                        {item.targetMeal && item.amount && <span> · </span>}
                        {item.amount && <span>{item.amount}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 需要修改的食物 */}
      {hasModifications && (
        <div>
          <h5 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1">
            <RefreshCw className="w-4 h-4" />
            建议调整的食物 ({recommendations.modifications!.length})
          </h5>
          <div className="space-y-2">
            {recommendations.modifications!.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      {item.food}
                    </p>
                    <div className="mt-1 text-sm">
                      <div className="text-blue-700 dark:text-blue-300">
                        <span className="line-through opacity-60">{item.currentIssue}</span>
                      </div>
                      <div className="text-blue-800 dark:text-blue-200 font-medium">
                        → {item.suggestedChange}
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {item.reason}
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
