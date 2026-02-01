'use client';

import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Loader2, Download, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WeeklyDietSummaryContent } from '@/types';

interface WeeklyDietSummaryModalProps {
  content: WeeklyDietSummaryContent;
  weekRange: string;
  generatedAt: Date;
  summaryId: string;
  clientId: string;
  onClose: () => void;
  onDelete?: (summaryId: string) => void;
  isDeleting?: boolean;
}

/**
 * 周饮食汇总详情弹窗
 * 完整展示AI生成的本周饮食分析报告
 */
export default function WeeklyDietSummaryModal({
  content,
  weekRange,
  generatedAt,
  summaryId,
  clientId,
  onClose,
  onDelete,
  isDeleting = false,
}: WeeklyDietSummaryModalProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'compliance']));
  const [isExporting, setIsExporting] = useState(false);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // 导出PDF
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/weekly-diet-summary/${summaryId}/export/pdf`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `周饮食汇总-${weekRange}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('PDF export error:', error);
      alert('导出PDF失败：' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  // 获取营养状态颜色
  const getNutrientStatusColor = (status: string) => {
    switch (status) {
      case '充足':
      case '优质':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case '不足':
      case '一般':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case '缺乏':
      case '较差':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  // 获取进度颜色
  const getProgressColor = (progress: string) => {
    switch (progress) {
      case 'on_track':
        return 'text-green-600';
      case 'needs_improvement':
        return 'text-yellow-600';
      case 'off_track':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 兼容新旧格式的改进建议处理
  const getRecommendationData = () => {
    const recs = content.improvementRecommendations;
    if (Array.isArray(recs)) {
      // 新格式：统一数组
      return {
        priority: recs[0]?.priority || 'medium',
        keepDoing: recs.filter(r => r.category === 'keepDoing'),
        improve: recs.filter(r => r.category === 'improve'),
        tryNew: recs.filter(r => r.category === 'tryNew'),
      };
    } else if (recs) {
      // 旧格式：分离的数组
      return recs;
    }
    // 兼容旧旧格式混合情况
    return {
      priority: (recs as any)?.priority || 'medium',
      keepDoing: (recs as any)?.keepDoing || [],
      improve: (recs as any)?.improve || [],
      tryNew: (recs as any)?.tryNew || [],
    };
  };

  const recommendationData = getRecommendationData();

  // 可折叠区块组件
  const CollapsibleSection = ({
    id,
    title,
    icon,
    children,
    defaultExpanded = false,
    badge,
  }: {
    id: string;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    badge?: React.ReactNode;
  }) => {
    const isExpanded = expandedSections.has(id);

    return (
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
            {badge}
          </div>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {isExpanded && (
          <div className="p-4 bg-white dark:bg-zinc-900">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">本周饮食汇总报告</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{weekRange}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* 导出PDF按钮 */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="导出为PDF"
            >
              {isExporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>导出中...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>导出PDF</span>
                </>
              )}
            </button>
            {onDelete && (
              <button
                onClick={() => onDelete(summaryId)}
                disabled={isDeleting}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                title="删除此汇总"
              >
                {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 统计概览 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">{content.statistics.totalDays}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">记录天数</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{content.statistics.totalMeals}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">用餐次数</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{content.statistics.totalPhotos}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">照片数量</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{content.statistics.avgScore.toFixed(1)}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">平均得分</div>
            </div>
          </div>

          {/* 合规性评价 */}
          <CollapsibleSection
            id="compliance"
            title="合规性评价"
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            badge={
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                content.complianceEvaluation.overallRating === '优秀' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                content.complianceEvaluation.overallRating === '良好' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                content.complianceEvaluation.overallRating === '一般' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                content.complianceEvaluation.overallRating === '需改善' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              )}>
                {content.complianceEvaluation.overallRating}
              </span>
            }
          >
            <div className="space-y-4">
              {/* 评分分布 */}
              <div>
                <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">评分分布</h4>
                <div className="grid grid-cols-4 gap-2">
                  {(() => {
                    const dist = content.complianceEvaluation.scoreDistribution;
                    const excellentCount = typeof dist.excellent === 'number' ? dist.excellent : dist.excellent?.count || 0;
                    const goodCount = typeof dist.good === 'number' ? dist.good : dist.good?.count || 0;
                    const fairCount = typeof dist.fair === 'number' ? dist.fair : dist.fair?.count || 0;
                    const poorCount = typeof dist.poor === 'number' ? dist.poor : dist.poor?.count || 0;
                    return (
                      <>
                        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <div className="text-lg font-bold text-green-600">{excellentCount}</div>
                          <div className="text-xs text-zinc-500">优秀</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <div className="text-lg font-bold text-blue-600">{goodCount}</div>
                          <div className="text-xs text-zinc-500">良好</div>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                          <div className="text-lg font-bold text-yellow-600">{fairCount}</div>
                          <div className="text-xs text-zinc-500">一般</div>
                        </div>
                        <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <div className="text-lg font-bold text-red-600">{poorCount}</div>
                          <div className="text-xs text-zinc-500">较差</div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* 显示具体餐次详情（新格式） */}
                {(() => {
                  const dist = content.complianceEvaluation.scoreDistribution;
                  const hasMeals = dist.excellent?.meals || dist.good?.meals || dist.fair?.meals || dist.poor?.meals;
                  if (!hasMeals) return null;

                  // 渲染单个餐次的卡片
                  const renderMealCard = (m: any, colorClass: string) => {
                    const hasDetails = m.reason || m.highlights || m.issues;
                    return (
                      <div key={`${m.date}-${m.mealType}`} className={cn('p-2 rounded-md mb-2', colorClass)}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{m.date} {m.mealType}</span>
                          <span className="text-sm font-bold">{m.score}分</span>
                        </div>
                        {m.reason && (
                          <div className="text-xs mt-1 opacity-90">
                            <span className="font-semibold">理由：</span>{m.reason}
                          </div>
                        )}
                        {m.highlights && m.highlights.length > 0 && (
                          <div className="text-xs mt-1 text-green-700">
                            <span className="font-semibold">✓ 亮点：</span>{m.highlights.join('、')}
                          </div>
                        )}
                        {m.issues && m.issues.length > 0 && (
                          <div className="text-xs mt-1 text-red-700">
                            <span className="font-semibold">✗ 问题：</span>{m.issues.join('、')}
                          </div>
                        )}
                      </div>
                    );
                  };

                  return (
                    <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <h5 className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-3">各档位具体餐次详情</h5>
                      <div className="grid md:grid-cols-2 gap-3">
                        {/* 需改善 */}
                        {dist.poor?.meals && dist.poor.meals.length > 0 && (
                          <div>
                            <h6 className="text-xs font-medium text-red-600 mb-2">需改善 ({dist.poor.meals.length}餐)</h6>
                            {dist.poor.meals.map((m) => renderMealCard(m, 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100'))}
                          </div>
                        )}
                        {/* 一般 */}
                        {dist.fair?.meals && dist.fair.meals.length > 0 && (
                          <div>
                            <h6 className="text-xs font-medium text-yellow-600 mb-2">一般 ({dist.fair.meals.length}餐)</h6>
                            {dist.fair.meals.map((m) => renderMealCard(m, 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100'))}
                          </div>
                        )}
                        {/* 良好 */}
                        {dist.good?.meals && dist.good.meals.length > 0 && (
                          <div>
                            <h6 className="text-xs font-medium text-blue-600 mb-2">良好 ({dist.good.meals.length}餐)</h6>
                            {dist.good.meals.map((m) => renderMealCard(m, 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'))}
                          </div>
                        )}
                        {/* 优秀 */}
                        {dist.excellent?.meals && dist.excellent.meals.length > 0 && (
                          <div>
                            <h6 className="text-xs font-medium text-green-600 mb-2">优秀 ({dist.excellent.meals.length}餐)</h6>
                            {dist.excellent.meals.map((m) => renderMealCard(m, 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100'))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </CollapsibleSection>

          {/* 营养分析 */}
          <CollapsibleSection
            id="nutrition"
            title="营养摄入分析"
            icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          >
            {/* 状态概览 */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className={cn('p-3 rounded-lg border', getNutrientStatusColor(content.nutritionAnalysis.proteinStatus))}>
                <div className="text-sm font-medium">蛋白质状态</div>
                <div className="text-xs text-zinc-500">摄入情况</div>
                <div className="text-lg font-bold mt-1">{content.nutritionAnalysis.proteinStatus}</div>
              </div>
              <div className={cn('p-3 rounded-lg border', getNutrientStatusColor(content.nutritionAnalysis.vegetableStatus))}>
                <div className="text-sm font-medium">蔬菜摄入</div>
                <div className="text-xs text-zinc-500">摄入情况</div>
                <div className="text-lg font-bold mt-1">{content.nutritionAnalysis.vegetableStatus}</div>
              </div>
              <div className={cn('p-3 rounded-lg border', getNutrientStatusColor(content.nutritionAnalysis.fiberStatus))}>
                <div className="text-sm font-medium">膳食纤维</div>
                <div className="text-xs text-zinc-500">摄入情况</div>
                <div className="text-lg font-bold mt-1">{content.nutritionAnalysis.fiberStatus}</div>
              </div>
              <div className={cn('p-3 rounded-lg border', getNutrientStatusColor(content.nutritionAnalysis.carbQuality))}>
                <div className="text-sm font-medium">碳水质量</div>
                <div className="text-xs text-zinc-500">优质占比</div>
                <div className="text-lg font-bold mt-1">{content.nutritionAnalysis.carbQuality}</div>
              </div>
              <div className={cn('p-3 rounded-lg border', getNutrientStatusColor(content.nutritionAnalysis.fatQuality))}>
                <div className="text-sm font-medium">脂肪质量</div>
                <div className="text-xs text-zinc-500">优质占比</div>
                <div className="text-lg font-bold mt-1">{content.nutritionAnalysis.fatQuality}</div>
              </div>
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <div className="text-sm font-medium">平均每日热量</div>
                <div className="text-xs text-zinc-500">估算值</div>
                <div className="text-lg font-bold mt-1">{content.nutritionAnalysis.avgDailyCalories} kcal</div>
              </div>
            </div>

            {/* 详细分析 */}
            <div className="space-y-4">
              {/* 蛋白质详细分解 */}
              {content.nutritionAnalysis.proteinBreakdown && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">蛋白质摄入明细</h4>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 bg-green-100 dark:bg-green-900/30 rounded">
                      <div className="text-lg font-bold text-green-700">{content.nutritionAnalysis.proteinBreakdown.sufficientCount}</div>
                      <div className="text-xs text-zinc-600">充足</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                      <div className="text-lg font-bold text-yellow-700">{content.nutritionAnalysis.proteinBreakdown.insufficientCount}</div>
                      <div className="text-xs text-zinc-600">不足</div>
                    </div>
                    <div className="text-center p-2 bg-red-100 dark:bg-red-900/30 rounded">
                      <div className="text-lg font-bold text-red-700">{content.nutritionAnalysis.proteinBreakdown.lackingCount}</div>
                      <div className="text-xs text-zinc-600">缺乏</div>
                    </div>
                  </div>
                  {content.nutritionAnalysis.proteinBreakdown.mealsByStatus && (
                    <div className="space-y-2 text-xs">
                      {content.nutritionAnalysis.proteinBreakdown.mealsByStatus.lacking?.length > 0 && (
                        <div>
                          <div className="font-medium text-red-700 mb-1">缺乏蛋白质的餐次：</div>
                          <div className="space-y-1">
                            {content.nutritionAnalysis.proteinBreakdown.mealsByStatus.lacking.map((meal, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-2 bg-red-100 dark:bg-red-900/20 rounded">
                                <span className="font-medium">{meal.date} {meal.mealType}</span>
                                <span className="text-red-700">{meal.issue}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {content.nutritionAnalysis.proteinBreakdown.mealsByStatus.insufficient?.length > 0 && (
                        <div>
                          <div className="font-medium text-yellow-700 mb-1">蛋白质不足的餐次：</div>
                          <div className="space-y-1">
                            {content.nutritionAnalysis.proteinBreakdown.mealsByStatus.insufficient.map((meal, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded">
                                <span className="font-medium">{meal.date} {meal.mealType}</span>
                                <span className="text-yellow-700">{meal.issue}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 蔬菜详细分解 */}
              {content.nutritionAnalysis.vegetableBreakdown && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-3">蔬菜摄入明细</h4>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 bg-green-100 dark:bg-green-900/30 rounded">
                      <div className="text-lg font-bold text-green-700">{content.nutritionAnalysis.vegetableBreakdown.sufficientCount}</div>
                      <div className="text-xs text-zinc-600">充足</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                      <div className="text-lg font-bold text-yellow-700">{content.nutritionAnalysis.vegetableBreakdown.insufficientCount}</div>
                      <div className="text-xs text-zinc-600">不足</div>
                    </div>
                    <div className="text-center p-2 bg-red-100 dark:bg-red-900/30 rounded">
                      <div className="text-lg font-bold text-red-700">{content.nutritionAnalysis.vegetableBreakdown.lackingCount}</div>
                      <div className="text-xs text-zinc-600">缺乏</div>
                    </div>
                  </div>
                  {content.nutritionAnalysis.vegetableBreakdown.mealsByStatus && (
                    <div className="space-y-2 text-xs">
                      {content.nutritionAnalysis.vegetableBreakdown.mealsByStatus.lacking?.length > 0 && (
                        <div>
                          <div className="font-medium text-red-700 mb-1">蔬菜缺乏的餐次：</div>
                          <div className="space-y-1">
                            {content.nutritionAnalysis.vegetableBreakdown.mealsByStatus.lacking.map((meal, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-2 bg-red-100 dark:bg-red-900/20 rounded">
                                <span className="font-medium">{meal.date} {meal.mealType}</span>
                                <span className="text-red-700">{meal.issue}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 膳食纤维来源 */}
              {content.nutritionAnalysis.fiberBreakdown?.sources && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">膳食纤维来源</h4>
                  <div className="flex flex-wrap gap-2">
                    {content.nutritionAnalysis.fiberBreakdown.sources.map((source, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-sm">
                        🌾 {source}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-purple-700 dark:text-purple-300">
                    平均每日: {content.nutritionAnalysis.fiberBreakdown.avgDailyGrams}g / 目标: {content.nutritionAnalysis.fiberBreakdown.targetGrams}g
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* 食物摄入分析 */}
          {content.foodIntakeAnalysis && (
            <CollapsibleSection
              id="foodIntake"
              title="食物摄入分析"
              icon={<Minus className="w-5 h-5 text-purple-600" />}
            >
              <div className="space-y-4">
                {/* 红绿灯统计 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{content.foodIntakeAnalysis.greenFoodCount}</div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">绿灯食物</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-3xl font-bold text-yellow-600">{content.foodIntakeAnalysis.yellowFoodCount}</div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">黄灯食物</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-3xl font-bold text-red-600">{content.foodIntakeAnalysis.redFoodCount}</div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">红灯食物</div>
                  </div>
                </div>

                {/* 常见绿灯食物 */}
                {content.foodIntakeAnalysis.mostFrequentGreenFoods?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">常吃绿灯食物</h4>
                    <div className="flex flex-wrap gap-2">
                      {content.foodIntakeAnalysis.mostFrequentGreenFoods.map((item, idx) => {
                        // 兼容旧数据（字符串）和新数据（对象）
                        const food = typeof item === 'string' ? item : item.food;
                        const count = typeof item === 'string' ? undefined : item.count;
                        const meals = typeof item === 'string' ? undefined : item.meals;
                        return (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm"
                            title={meals ? `${count}次: ${meals.join(', ')}` : food}
                          >
                            🟢 {food}{count !== undefined ? ` (${count})` : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 常见红灯食物 */}
                {content.foodIntakeAnalysis.mostFrequentRedFoods?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">需减少的红灯食物</h4>
                        <div className="flex flex-wrap gap-2">
                      {content.foodIntakeAnalysis.mostFrequentRedFoods.map((item, idx) => {
                        // 兼容旧数据（字符串）和新数据（对象）
                        const food = typeof item === 'string' ? item : item.food;
                        const count = typeof item === 'string' ? undefined : item.count;
                        const meals = typeof item === 'string' ? undefined : item.meals;
                        const healthImpact = typeof item === 'string' ? undefined : item.healthImpact;
                        return (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full text-sm"
                            title={
                              meals
                                ? `${count}次: ${meals.join(', ')}${healthImpact ? ' | ' + healthImpact : ''}`
                                : healthImpact || food
                            }
                          >
                            🔴 {food}{count !== undefined ? ` (${count})` : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 完整食物列表 */}
                <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-4">
                  <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">完整食物列表</h4>

                  {/* 所有绿灯食物 */}
                  {content.foodIntakeAnalysis.allGreenFoods && content.foodIntakeAnalysis.allGreenFoods.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">所有绿灯食物 ({content.foodIntakeAnalysis.allGreenFoods.length}种)</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {content.foodIntakeAnalysis.allGreenFoods.map((item, idx) => (
                          <div key={idx} className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-green-900 dark:text-green-100">🟢 {item.food}</span>
                              <span className="text-green-700 dark:text-green-400">{item.count}次</span>
                            </div>
                            {item.meals && (
                              <div className="text-green-700 dark:text-green-400 opacity-75">
                                {item.meals.join(', ')}
                              </div>
                            )}
                            {item.benefits && (
                              <div className="mt-1 text-green-800 dark:text-green-300 opacity-75">
                                ✓ {item.benefits}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 所有黄灯食物 */}
                  {content.foodIntakeAnalysis.allYellowFoods && content.foodIntakeAnalysis.allYellowFoods.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-2">所有黄灯食物 ({content.foodIntakeAnalysis.allYellowFoods.length}种)</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {content.foodIntakeAnalysis.allYellowFoods.map((item, idx) => (
                          <div key={idx} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-yellow-900 dark:text-yellow-100">🟡 {item.food}</span>
                              <span className="text-yellow-700 dark:text-yellow-400">{item.count}次</span>
                            </div>
                            {item.meals && (
                              <div className="text-yellow-700 dark:text-yellow-400 opacity-75">
                                {item.meals.join(', ')}
                              </div>
                            )}
                            {item.note && (
                              <div className="mt-1 text-yellow-800 dark:text-yellow-300 opacity-75">
                                ⚠️ {item.note}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 所有红灯食物 */}
                  {content.foodIntakeAnalysis.allRedFoods && content.foodIntakeAnalysis.allRedFoods.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-red-700 dark:text-red-300 mb-2">所有红灯食物 ({content.foodIntakeAnalysis.allRedFoods.length}种)</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {content.foodIntakeAnalysis.allRedFoods.map((item, idx) => (
                          <div key={idx} className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-red-900 dark:text-red-100">🔴 {item.food}</span>
                              <span className="text-red-700 dark:text-red-400">{item.count}次</span>
                            </div>
                            {item.meals && (
                              <div className="text-red-700 dark:text-red-400 opacity-75">
                                {item.meals.join(', ')}
                              </div>
                            )}
                            {item.healthImpact && (
                              <div className="mt-1 text-red-800 dark:text-red-300 opacity-75">
                                ⚠️ 影响: {item.healthImpact}
                              </div>
                            )}
                            {item.reason && (
                              <div className="text-red-700 dark:text-red-400 opacity-75">
                                {item.reason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* 改进建议 */}
          <CollapsibleSection
            id="recommendations"
            title="改进建议"
            icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
            badge={
              <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getPriorityColor(recommendationData.priority))}>
                {recommendationData.priority === 'high' ? '高优先级' :
                 recommendationData.priority === 'medium' ? '中优先级' : '低优先级'}
              </span>
            }
          >
            <div className="space-y-4">
              {/* 继续保持 */}
              {recommendationData.keepDoing?.length > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">✅ 继续保持</h4>
                  <ul className="space-y-2">
                    {recommendationData.keepDoing.map((item: any, idx: number) => (
                      <li key={idx} className="text-sm text-green-800 dark:text-green-300">
                        <strong>{item.behavior}</strong>: {item.reason}
                        {item.evidence && <p className="text-xs mt-1 opacity-80">📊 {item.evidence}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 需要改进 */}
              {recommendationData.improve?.length > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">⚠️ 需要改进</h4>
                  <div className="space-y-3">
                    {recommendationData.improve.map((item: any, idx: number) => (
                      <div key={idx} className="text-sm text-yellow-800 dark:text-yellow-300">
                        <p className="font-medium">{item.suggestion}</p>
                        {item.issue && <p className="mt-1">{item.issue}</p>}
                        {item.evidence && <p className="mt-1 text-xs opacity-80">📊 {item.evidence}</p>}
                        {item.quantification && <p className="mt-1 text-xs opacity-80">📈 {item.quantification}</p>}
                        {item.actionSteps && item.actionSteps.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium text-xs">行动步骤：</p>
                            <ol className="list-decimal list-inside text-xs mt-1 space-y-1">
                              {item.actionSteps.map((step: string, stepIdx: number) => (
                                <li key={stepIdx}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {item.expectedOutcome && (
                          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                            预期效果: {item.expectedOutcome}
                          </p>
                        )}
                        {item.alternatives && item.alternatives.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium text-xs">替代方案：</p>
                            <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                              {item.alternatives.map((alt: string, altIdx: number) => (
                                <li key={altIdx}>{alt}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 尝试新事物 */}
              {recommendationData.tryNew?.length > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 尝试新事物</h4>
                  <ul className="space-y-2">
                    {recommendationData.tryNew.map((item: any, idx: number) => (
                      <li key={idx} className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>{item.suggestion}</strong>: {item.reason}
                        <p className="text-xs mt-1 text-zinc-600 dark:text-zinc-400">如何做: {item.howTo}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* 下周目标 */}
          {content.nextWeekGoals && (
            <CollapsibleSection
              id="goals"
              title="下周目标"
              icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
            >
              <div className="space-y-4">
                {/* 主要目标 */}
                {content.nextWeekGoals.primaryGoals?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">主要目标</h4>
                    <ul className="space-y-1">
                      {content.nextWeekGoals.primaryGoals.map((goal, idx) => (
                        <li key={idx} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                          <span className="text-indigo-600 mt-0.5">•</span>
                          <span>{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* SMART 目标 */}
                {content.nextWeekGoals.smartGoals?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">SMART 目标</h4>
                    <div className="space-y-3">
                      {content.nextWeekGoals.smartGoals.map((goal, idx) => (
                        <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                          <h5 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">{goal.goal}</h5>
                          <div className="grid md:grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                            <div><strong>可衡量:</strong> {goal.measurable}</div>
                            <div><strong>可实现:</strong> {goal.achievable}</div>
                            <div><strong>相关性:</strong> {goal.relevant}</div>
                            <div><strong>时限性:</strong> {goal.timeBound}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* 总结 */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">总体评价</h3>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{content.summary.overall}</p>
            {content.summary.encouragement && (
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-3 italic">
                💪 {content.summary.encouragement}
              </p>
            )}
          </div>
        </div>

        {/* 底部 */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex justify-between items-center">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            生成于 {new Date(generatedAt).toLocaleString('zh-CN')}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
