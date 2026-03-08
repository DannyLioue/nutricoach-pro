'use client';

import React, { useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, Award, ChevronDown, ChevronUp, Sparkles, AlertCircle, CheckCircle2, Trash2, RotateCcw, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WeeklyDietSummary, WeeklyDietSummaryContent } from '@/types';

interface WeeklyDietSummaryCardProps {
  summary: WeeklyDietSummary;
  previousSummary?: WeeklyDietSummary | null; // 上周数据，用于对比
  onViewDetails?: (summaryId: string) => void;
  onDelete?: (summaryId: string) => void;
  onRegenerate?: (summaryId: string) => void; // 重新生成回调（跳过已分析）
  onForceRegenerate?: (summaryId: string) => void; // 全部重新生成回调（强制重新分析所有）
  className?: string;
}

/**
 * 饮食汇总卡片组件 - 简化版
 * 默认显示核心信息，点击展开显示完整分析
 */
export default function WeeklyDietSummaryCard({
  summary,
  previousSummary,
  onViewDetails,
  onDelete,
  onRegenerate,
  onForceRegenerate,
  className = '',
}: WeeklyDietSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const content = summary.summary as WeeklyDietSummaryContent;

  // 获取评级配置
  const getRatingConfig = () => {
    const rating = content.complianceEvaluation.overallRating;
    switch (rating) {
      case '优秀':
        return {
          colorClass: 'text-green-600 dark:text-green-400',
          badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        };
      case '良好':
        return {
          colorClass: 'text-blue-600 dark:text-blue-400',
          badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        };
      case '一般':
        return {
          colorClass: 'text-yellow-600 dark:text-yellow-400',
          badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        };
      case '需改善':
        return {
          colorClass: 'text-red-600 dark:text-red-400',
          badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        };
      default:
        return {
          colorClass: 'text-gray-600 dark:text-gray-400',
          badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        };
    }
  };

  const ratingConfig = getRatingConfig();

  // 计算与上周的对比
  const getScoreChange = () => {
    if (!previousSummary?.summary) return null;
    const prevContent = previousSummary.summary as WeeklyDietSummaryContent;
    const currentScore = content.statistics.avgScore;
    const prevScore = prevContent.statistics.avgScore;
    const change = currentScore - prevScore;
    return {
      value: change,
      isPositive: change > 0,
      isNegative: change < 0,
    };
  };

  const scoreChange = getScoreChange();

  // 格式化日期范围
  const formatDateRange = (startDate: string, endDate: string) => {
    // 处理空字符串或无效日期
    if (!startDate || !endDate || startDate === '' || endDate === '') {
      return '日期范围未设置';
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // 检查日期是否有效
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return '日期格式错误';
    }

    const startMonth = start.getMonth() + 1;
    const endMonth = end.getMonth() + 1;
    const startDay = start.getDate();
    const endDay = end.getDate();

    if (startMonth === endMonth && startDay === endDay) {
      return `${startMonth}月${startDay}日`;
    }
    if (startMonth === endMonth) {
      return `${startMonth}月${startDay}日 - ${endDay}日`;
    }
    return `${startMonth}月${startDay}日 - ${endMonth}月${endDay}日`;
  };

  // 提取关键亮点（最多3条）
  const highlights = content.summary?.highlights?.slice(0, 3) || [];

  // 提取关键问题（从红灯食物和改进建议中提取，最多3条）
  const concerns: string[] = [];

  // 从红灯食物中提取
  if (content.foodIntakeAnalysis?.mostFrequentRedFoods?.length > 0) {
    const topRedFoods = content.foodIntakeAnalysis.mostFrequentRedFoods.slice(0, 2);
    topRedFoods.forEach(food => {
      const foodName = typeof food === 'string' ? food : food.food;
      concerns.push(`红灯食物: ${foodName}`);
    });
  }

  // 从需要改进的建议中提取（兼容新旧格式）
  const getImproveItems = () => {
    const recs = content.improvementRecommendations;
    if (Array.isArray(recs)) {
      // 新格式：数组，按 category 过滤
      return recs.filter(r => r.category === 'improve').slice(0, 2);
    } else if (recs?.improve) {
      // 旧格式：对象 with separate arrays
      return recs.improve.slice(0, 2);
    }
    return [];
  };

  const improveItems = getImproveItems();
  improveItems.forEach(item => {
    const issue = item.issue || (typeof item === 'string' ? item : '');
    if (issue && !concerns.includes(`需要改善: ${issue}`)) {
      concerns.push(`需要改善: ${issue}`);
    }
  });

  const topConcerns = concerns.slice(0, 3);

  // 提取简单建议（兼容新旧格式）
  const getSimpleSuggestion = () => {
    const recs = content.improvementRecommendations;
    if (Array.isArray(recs)) {
      const improve = recs.find(r => r.category === 'improve');
      if (improve?.suggestion) return improve.suggestion;
      const keep = recs.find(r => r.category === 'keepDoing');
      if (keep?.behavior) return keep.behavior;
    } else if (recs?.improve?.[0]?.suggestion) {
      return recs.improve[0].suggestion;
    } else if (recs?.keepDoing?.[0]?.behavior) {
      return recs.keepDoing[0].behavior;
    }
    return '继续保持良好的饮食习惯';
  };

  const simpleSuggestion = getSimpleSuggestion();

  return (
    <div className={cn('bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 overflow-hidden', className)}>
      {/* 头部 - 简化版 */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        {/* 部分周提示 */}
        {content.isPartialWeek && (
          <div className="mb-3 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              📊 该期间尚未结束 - 基于 {content.recordedDays || content.statistics.totalDays} 天的数据分析
              {content.totalDaysExpected && `（期间已过 ${content.totalDaysExpected} 天）`}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {formatDateRange(summary.weekStartDate, summary.weekEndDate)}
            </h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {summary.weekNumber}周
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {/* 核心评分 - 大字号显示 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('text-4xl font-bold', ratingConfig.colorClass)}>
              {content.statistics.avgScore.toFixed(0)}
            </div>
            <div>
              <div className={cn('text-sm font-medium px-2 py-1 rounded-md', ratingConfig.badgeClass)}>
                {content.complianceEvaluation.overallRating}
              </div>
              {scoreChange && (
                <div className={cn(
                  'text-xs mt-1 flex items-center gap-1',
                  scoreChange.isPositive ? 'text-green-600' : scoreChange.isNegative ? 'text-red-600' : 'text-gray-500'
                )}>
                  {scoreChange.isPositive && <TrendingUp size={14} />}
                  {scoreChange.isNegative && <TrendingDown size={14} />}
                  {scoreChange.isPositive ? '+' : ''}{scoreChange.value.toFixed(0)} 分 vs 上期
                </div>
              )}
            </div>
          </div>

          {/* 快速统计 */}
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-zinc-900 dark:text-zinc-100">{content.statistics.totalDays}</div>
              <div className="text-xs text-zinc-500">天</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-zinc-900 dark:text-zinc-100">{content.statistics.totalPhotos}</div>
              <div className="text-xs text-zinc-500">照片</div>
            </div>
          </div>
        </div>

        {/* 简化版：亮点和问题（只显示不展开时） */}
        {!isExpanded && (
          <div className="grid grid-cols-2 gap-3">
            {/* 亮点 */}
            {highlights.length > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-1 mb-2 text-green-700 dark:text-green-300">
                  <CheckCircle2 size={14} />
                  <span className="text-xs font-medium">做得好</span>
                </div>
                <ul className="space-y-1">
                  {highlights.slice(0, 2).map((highlight, idx) => (
                    <li key={idx} className="text-xs text-green-800 dark:text-green-400 line-clamp-1">
                      • {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 需要改善 */}
            {topConcerns.length > 0 && (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center gap-1 mb-2 text-orange-700 dark:text-orange-300">
                  <AlertCircle size={14} />
                  <span className="text-xs font-medium">需改善</span>
                </div>
                <ul className="space-y-1">
                  {topConcerns.slice(0, 2).map((concern, idx) => (
                    <li key={idx} className="text-xs text-orange-800 dark:text-orange-400 line-clamp-1">
                      • {concern}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 可展开内容 - 完整分析 */}
      {isExpanded && (
        <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
          {/* 详细统计数据 */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">{content.statistics.totalDays}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">记录天数</div>
            </div>
            <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{content.statistics.totalMeals}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">用餐次数</div>
            </div>
            <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{content.statistics.totalPhotos}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">照片数量</div>
            </div>
            <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{content.statistics.avgScore.toFixed(1)}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">平均得分</div>
            </div>
          </div>

          {/* 完整的亮点和关注 */}
          <div className="grid md:grid-cols-2 gap-4">
            {highlights.length > 0 && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">期间亮点</h4>
                </div>
                <ul className="space-y-2">
                  {highlights.map((highlight, idx) => (
                    <li key={idx} className="text-sm text-green-800 dark:text-green-300 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {topConcerns.length > 0 && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-orange-600" />
                  <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100">需要关注</h4>
                </div>
                <ul className="space-y-2">
                  {topConcerns.map((concern, idx) => (
                    <li key={idx} className="text-sm text-orange-800 dark:text-orange-300 flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">!</span>
                      <span>{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 简单建议 */}
          {simpleSuggestion && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 改进建议</h4>
              <p className="text-sm text-blue-800 dark:text-blue-300">{simpleSuggestion}</p>
            </div>
          )}

          {/* 总体评价 */}
          {content.summary?.overall && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">总体评价</h4>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {content.summary.overall}
              </p>
            </div>
          )}

          {/* 鼓励语 */}
          {content.summary?.encouragement && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-lg">
              <p className="text-sm text-emerald-800 dark:text-emerald-300 italic">
                💪 {content.summary.encouragement}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 底部操作栏 */}
      <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          生成于 {new Date(summary.generatedAt).toLocaleDateString('zh-CN')}
        </div>
        <div className="flex gap-2">
          {onRegenerate && (
            <button
              onClick={() => onRegenerate(summary.id)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-lg transition-colors"
              title="快速更新：使用已有分析数据重新生成汇总（推荐）"
            >
              <RotateCcw size={14} />
              仅更新汇总
            </button>
          )}
          {onForceRegenerate && (
            <button
              onClick={() => onForceRegenerate(summary.id)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-medium rounded-lg transition-colors"
              title="完整重新分析：重新分析每个食谱组，然后生成汇总（耗时较长）"
            >
              <RefreshCw size={14} />
              全部重新分析
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(summary.id)}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg transition-colors"
              title="删除此汇总"
            >
              <Trash2 size={14} />
              删除
            </button>
          )}
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(summary.id)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Sparkles size={16} />
              查看详情
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 空状态 - 暂无汇总数据
 */
export function WeeklyDietSummaryEmpty({
  onCreateSummary,
}: {
  onCreateSummary?: () => void;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-8 text-center">
      <Calendar className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        暂无饮食汇总
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        上传饮食照片后，即可生成AI分析汇总报告
      </p>
      {onCreateSummary && (
        <button
          onClick={onCreateSummary}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors mx-auto"
        >
          <Sparkles size={16} />
          生成饮食汇总
        </button>
      )}
    </div>
  );
}
