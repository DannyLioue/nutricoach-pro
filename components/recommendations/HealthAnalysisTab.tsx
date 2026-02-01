'use client';

import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle2, Pill, Apple, Heart, Activity } from 'lucide-react';
import ExportButton from './ExportButton';

interface HealthAnalysisTabProps {
  recommendationId: string;
  clientName?: string;
  content: any;
}

// 获取优先级样式
function getPriorityStyles(priority: string) {
  const p = priority?.toLowerCase().trim();
  if (p === '高' || p === 'high') {
    return {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      iconBg: 'bg-red-100 dark:bg-red-900/30'
    };
  }
  if (p === '中' || p === 'medium') {
    return {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-600',
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30'
    };
  }
  return {
    bg: 'bg-zinc-50 dark:bg-zinc-800',
    border: 'border-zinc-200 dark:border-zinc-700',
    icon: 'text-zinc-600',
    badge: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300',
    iconBg: 'bg-zinc-100 dark:bg-zinc-700'
  };
}

// 获取严重程度样式
function getSeverityStyles(severity: string) {
  switch (severity) {
    case '重度':
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-700 dark:text-red-300',
        badge: 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300'
      };
    case '中度':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-700 dark:text-yellow-300',
        badge: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
      };
    case '轻度':
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-700 dark:text-green-300',
        badge: 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300'
      };
    default:
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-700 dark:text-blue-300',
        badge: 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
      };
  }
}

export default function HealthAnalysisTab({ recommendationId, clientName, content }: HealthAnalysisTabProps) {
  const biomarkers = content.biomarkerInterventionMapping || [];
  const healthConcerns = content.healthConcernsInterventions?.concerns || [];

  // 统计信息
  const highPriorityCount = biomarkers.filter((b: any) => {
    const p = b.priority?.toLowerCase().trim();
    return p === '高' || p === 'high' || p?.includes('高') || p?.includes('high');
  }).length;

  const mediumPriorityCount = biomarkers.filter((b: any) => {
    const p = b.priority?.toLowerCase().trim();
    return p === '中' || p === 'medium' || p?.includes('中');
  }).length;

  if (biomarkers.length === 0 && healthConcerns.length === 0) {
    return (
      <div className="text-center py-16 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          暂无健康问题数据
        </h3>
        <p className="text-zinc-500 dark:text-zinc-400">
          当前未检测到需要关注的健康问题
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 顶部统计卡片 */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-5 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-700 dark:text-red-300">高优先级</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">{highPriorityCount} 项</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-5 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Activity className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">中优先级</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{mediumPriorityCount} 项</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Heart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">总指标数</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{biomarkers.length} 项</p>
            </div>
          </div>
        </div>
      </div>

      {/* 导出按钮 */}
      <div className="flex justify-end">
        <ExportButton
          recommendationId={recommendationId}
          module="health-analysis"
          clientName={clientName}
        />
      </div>

      {/* 异常指标列表 */}
      {biomarkers.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            异常生物标志物分析
          </h3>
          <div className="space-y-4">
            {biomarkers.map((item: any, idx: number) => {
              const styles = getPriorityStyles(item.priority);
              const isHigh = item.status === '偏高';
              const StatusIcon = isHigh ? TrendingUp : TrendingDown;
              const statusColor = isHigh ? 'text-red-600' : 'text-amber-600';

              return (
                <div
                  key={`biomarker-${idx}`}
                  className={`p-5 rounded-xl border-2 ${styles.bg} ${styles.border}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${styles.iconBg}`}>
                        {typeof item.currentValue === 'number' && typeof item.targetValue === 'number' ? (
                          <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                        ) : (
                          <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                          {item.biomarker}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            isHigh ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                          }`}>
                            {item.status}
                          </span>
                          {item.priority && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles.badge}`}>
                              {item.priority}优先级
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 数值显示 */}
                    {typeof item.currentValue === 'number' && typeof item.targetValue === 'number' && (
                      <div className="text-right">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                            {item.currentValue}
                          </span>
                          <span className="text-sm text-zinc-500">{item.unit || ''}</span>
                        </div>
                        <p className="text-xs text-zinc-500">
                          目标: {item.targetValue} {item.unit || ''}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 进度条 */}
                  {typeof item.currentValue === 'number' && typeof item.targetValue === 'number' && (
                    <div className="mb-4">
                      <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isHigh ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min((item.currentValue / item.targetValue) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 机制说明 */}
                  {item.mechanism && (
                    <div className="mb-3 p-3 bg-white/60 dark:bg-zinc-900/40 rounded-lg">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        机制
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {item.mechanism}
                      </p>
                    </div>
                  )}

                  {/* 干预方案 */}
                  {item.nutritionalIntervention && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        营养干预方案
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {item.nutritionalIntervention}
                      </p>
                    </div>
                  )}

                  {/* 推荐食物 */}
                  {item.foodSources && item.foodSources.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1">
                        <Apple className="w-4 h-4" />
                        推荐食物来源
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.foodSources.map((source: any, sIdx: number) => (
                          <div
                            key={sIdx}
                            className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700"
                          >
                            <span className="text-lg">🥗</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                {source.food}
                              </p>
                              <p className="text-xs text-zinc-500 truncate">
                                {source.nutrient} · {source.amount}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 补充剂建议 */}
                  {item.supplement && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-start gap-2">
                        <Pill className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                            补充剂建议
                          </p>
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            <strong>{item.supplement.name}</strong> · {item.supplement.dosage}
                          </p>
                          {item.supplement.evidence && (
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                              {item.supplement.evidence}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 监测建议 */}
                  {item.monitoring && (
                    <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                      📅 {item.monitoring}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 其他健康问题 */}
      {healthConcerns.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-600" />
            其他健康问题
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {healthConcerns.map((concern: any, idx: number) => {
              const severityStyles = getSeverityStyles(concern.severity);

              return (
                <div
                  key={`concern-${idx}`}
                  className={`p-5 rounded-xl border-2 ${severityStyles.bg} ${severityStyles.border}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                      {concern.concern}
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityStyles.badge}`}>
                      {concern.severity}
                    </span>
                  </div>

                  {/* 营养策略 */}
                  {concern.nutritionalStrategy && (
                    <div className="space-y-3">
                      {concern.nutritionalStrategy.keyFoods && concern.nutritionalStrategy.keyFoods.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-2 flex items-center gap-1">
                            ✓ 推荐食物
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {concern.nutritionalStrategy.keyFoods.map((food: any, fIdx: number) => (
                              <span
                                key={fIdx}
                                className="px-2 py-1 bg-white dark:bg-zinc-900 rounded text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                              >
                                {food.food}
                                {food.amount && <span className="ml-1 text-zinc-500">({food.amount})</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {concern.nutritionalStrategy.avoidFoods && concern.nutritionalStrategy.avoidFoods.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-2 flex items-center gap-1">
                            ✗ 避免食物
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {concern.nutritionalStrategy.avoidFoods.map((food: any, fIdx: number) => (
                              <span
                                key={fIdx}
                                className="px-2 py-1 bg-red-100 dark:bg-red-900/40 rounded text-xs text-red-800 dark:text-red-200"
                              >
                                {food.food}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {concern.nutritionalStrategy.supplements && concern.nutritionalStrategy.supplements.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-1">
                            💊 补充剂
                          </p>
                          <div className="space-y-1">
                            {concern.nutritionalStrategy.supplements.map((supp: any, sIdx: number) => (
                              <div
                                key={sIdx}
                                className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded text-xs text-purple-800 dark:text-purple-200"
                              >
                                {supp.name} ({supp.dosage})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 生活方式建议 */}
                  {concern.lifestyleModifications && (
                    <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1">
                        🌟 生活方式建议
                      </p>
                      <div className="space-y-1">
                        {[
                          ...(concern.lifestyleModifications.morningRoutine || []),
                          ...(concern.lifestyleModifications.dailyHabits || []),
                          ...(concern.lifestyleModifications.eveningRoutine || []),
                          ...(concern.lifestyleModifications.weeklyActivities || []),
                        ].map((habit: string, hIdx: number) => (
                          <div
                            key={hIdx}
                            className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-1"
                          >
                            <span className="text-emerald-500">•</span>
                            <span>{habit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
