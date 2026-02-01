'use client';

import { Target, AlertTriangle, TrendingDown, Activity } from 'lucide-react';
import { HealthIndicatorChart } from './HealthIndicatorChart';

// 解析百分比字符串
function parsePercentage(percentage: any): number {
  if (typeof percentage === 'number') {
    return percentage;
  }
  if (typeof percentage === 'string') {
    const parsed = parseFloat(percentage.replace('%', '').trim());
    return isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

interface RecommendationOverviewProps {
  clientName: string;
  generatedAt: string;
  recommendationType: string;
  dailyTargets?: {
    calories: number;
    macros?: {
      carbs?: { grams: number; percentage: string };
      protein?: { grams: number; percentage: string };
      fat?: { grams: number; percentage: string };
    };
    fiber?: string;
    water?: string;
  };
  biomarkers?: Array<{
    biomarker: string;
    status: string;
    priority: string;
    nutritionalIntervention?: string;
    currentValue?: number;
    targetValue?: number;
    unit?: string;
  }>;
  summary?: string;
}

export default function RecommendationOverview({
  clientName,
  generatedAt,
  recommendationType,
  dailyTargets,
  biomarkers,
  summary,
}: RecommendationOverviewProps) {
  // 获取高优先级的生物标志物
  const highPriorityBiomarkers = biomarkers
    ?.filter(b => {
      const p = b.priority?.toLowerCase().trim();
      return p === '高' || p === 'high' || p?.includes('高') || p?.includes('high');
    })
    .slice(0, 3) || [];

  // 统计指标状态
  const statusCounts = {
    normal: biomarkers?.filter(b => b.status === '正常').length || 0,
    abnormal: biomarkers?.filter(b => b.status === '偏高' || b.status === '偏低').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* 标题卡片 */}
      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">{clientName} 的营养干预方案</h1>
            <p className="text-emerald-100 text-sm">
              {recommendationType} · 生成于 {new Date(generatedAt).toLocaleDateString('zh-CN')}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
            <Target className="w-5 h-5" />
            <span className="font-semibold">211饮食法</span>
          </div>
        </div>

        {summary && (
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-sm leading-relaxed">{summary}</p>
          </div>
        )}
      </div>

      {/* 核心信息卡片 - 2列布局 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 每日目标 & 营养素分布 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            每日目标
          </h3>

          {dailyTargets && (
            <div className="space-y-4">
              {/* 总热量 */}
              <div className="text-center py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                <p className="text-4xl font-bold text-blue-600">
                  {dailyTargets.calories}
                  <span className="text-lg font-normal text-zinc-500 ml-1">kcal</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1">每日总热量</p>
              </div>

              {/* 三大营养素 - 简洁展示 */}
              {dailyTargets.macros && (
                <div className="space-y-3">
                  {dailyTargets.macros.carbs && (
                    <div className="flex items-center gap-3">
                      <div className="w-24 text-xs text-zinc-600 dark:text-zinc-400">碳水</div>
                      <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(parsePercentage(dailyTargets.macros.carbs.percentage), 100)}%` }}
                        />
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {dailyTargets.macros.carbs.grams}g
                        </span>
                        <span className="text-xs text-zinc-500 ml-1">
                          {dailyTargets.macros.carbs.percentage}
                        </span>
                      </div>
                    </div>
                  )}

                  {dailyTargets.macros.protein && (
                    <div className="flex items-center gap-3">
                      <div className="w-24 text-xs text-zinc-600 dark:text-zinc-400">蛋白质</div>
                      <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(parsePercentage(dailyTargets.macros.protein.percentage), 100)}%` }}
                        />
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {dailyTargets.macros.protein.grams}g
                        </span>
                        <span className="text-xs text-zinc-500 ml-1">
                          {dailyTargets.macros.protein.percentage}
                        </span>
                      </div>
                    </div>
                  )}

                  {dailyTargets.macros.fat && (
                    <div className="flex items-center gap-3">
                      <div className="w-24 text-xs text-zinc-600 dark:text-zinc-400">脂肪</div>
                      <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${Math.min(parsePercentage(dailyTargets.macros.fat.percentage), 100)}%` }}
                        />
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {dailyTargets.macros.fat.grams}g
                        </span>
                        <span className="text-xs text-zinc-500 ml-1">
                          {dailyTargets.macros.fat.percentage}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 其他信息 */}
              {(dailyTargets.fiber || dailyTargets.water) && (
                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700 flex gap-4 text-xs text-zinc-500">
                  {dailyTargets.fiber && <span>膳食纤维: {dailyTargets.fiber}</span>}
                  {dailyTargets.water && <span>饮水: {dailyTargets.water}</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 健康状态 & 优先事项 */}
        <div className="space-y-6">
          {/* 健康指标状态 */}
          {biomarkers && biomarkers.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                健康指标状态
              </h3>

              {/* 指标状态汇总 */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center border border-emerald-200 dark:border-emerald-800">
                  <p className="text-2xl font-bold text-emerald-600">{statusCounts.normal}</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">正常指标</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center border border-red-200 dark:border-red-800">
                  <p className="text-2xl font-bold text-red-600">{statusCounts.abnormal}</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">异常指标</p>
                </div>
              </div>

              {/* 优先事项 */}
              {highPriorityBiomarkers.length > 0 && (
                <div className="space-y-2">
                  {highPriorityBiomarkers.map((biomarker, idx) => {
                    // 提取简短的指标名称（去掉数值部分）
                    const shortName = biomarker.biomarker
                      .replace(/\s*[\d.]+\s*(?:mmol\/L|μmol\/L|mg\/dL|g\/L|U\/L).*$/, '')
                      .replace(/偏高|偏低|异常.*$/, '')
                      .trim();

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-sm font-semibold text-red-900 dark:text-red-100">
                            {shortName}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-red-200 text-red-800 rounded-full flex-shrink-0">
                            {biomarker.status}
                          </span>
                        </div>
                        {biomarker.nutritionalIntervention && (
                          <p className="text-xs text-red-700 dark:text-red-300 line-clamp-2">
                            {biomarker.nutritionalIntervention}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {highPriorityBiomarkers.length === 0 && (
                <div className="text-center py-4 text-zinc-400">
                  <TrendingDown className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">暂无高优先级事项</p>
                </div>
              )}
            </div>
          )}

          {/* 211饮食原则 - 精简版 */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🍽️</span>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">211 饮食原则</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">每餐按 2:1:1 比例</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/60 dark:bg-zinc-800/60 rounded-lg p-2">
                <div className="text-lg mb-1">🥬</div>
                <div className="text-xs font-semibold text-green-700 dark:text-green-300">2份蔬菜</div>
                <div className="text-xs text-green-600 dark:text-green-400">50%</div>
              </div>
              <div className="bg-white/60 dark:bg-zinc-800/60 rounded-lg p-2">
                <div className="text-lg mb-1">🍖</div>
                <div className="text-xs font-semibold text-orange-700 dark:text-orange-300">1份蛋白</div>
                <div className="text-xs text-orange-600 dark:text-orange-400">25%</div>
              </div>
              <div className="bg-white/60 dark:bg-zinc-800/60 rounded-lg p-2">
                <div className="text-lg mb-1">🍚</div>
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">1份主食</div>
                <div className="text-xs text-amber-600 dark:text-amber-400">25%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 健康指标详细追踪 */}
      {biomarkers && biomarkers.length > 0 && (
        <HealthIndicatorChart
          indicators={biomarkers
            .filter(b => {
              const hasValidValue = typeof b.currentValue === 'number' && !isNaN(b.currentValue);
              const hasValidTarget = typeof b.targetValue === 'number' && !isNaN(b.targetValue) && b.targetValue > 0;
              return hasValidValue && hasValidTarget;
            })
            .map(b => {
              const status = b.status === '偏高' ? 'high' : b.status === '偏低' ? 'low' : 'normal';
              return {
                name: b.biomarker,
                value: b.currentValue!,
                target: b.targetValue!,
                unit: b.unit || '',
                status,
                color: status === 'normal' ? '#10B981' : status === 'high' ? '#EF4444' : '#F59E0B',
              };
            })}
          title="健康指标详细追踪"
        />
      )}
    </div>
  );
}
