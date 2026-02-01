'use client';

import React from 'react';
import { Heart, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import type { HealthSummaryCardProps, HealthStatus } from '@/types/health-analysis';

/**
 * 分析摘要卡片组件
 * 结构化展示健康分析结果
 */
export default function HealthSummaryCard({
  analysis,
  className = '',
}: HealthSummaryCardProps) {
  // 确定健康状态
  const getHealthStatus = (): HealthStatus => {
    const score = analysis.healthScore ?? 0;
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  };

  const healthStatus = getHealthStatus();

  // 状态配置
  const statusConfig = {
    excellent: {
      title: '健康状况优秀',
      description: '各项指标良好，继续保持健康生活方式！',
      icon: CheckCircle,
      colorClass: 'text-green',
      bgClass: 'from-green-600 to-emerald-600',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
    },
    good: {
      title: '健康状况良好',
      description: '整体状况良好，注意保持良好的生活习惯',
      icon: CheckCircle,
      colorClass: 'text-blue',
      bgClass: 'from-blue-600 to-cyan-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    fair: {
      title: '健康状况需关注',
      description: '部分指标异常，建议调整生活方式',
      icon: AlertTriangle,
      colorClass: 'text-yellow',
      bgClass: 'from-yellow-600 to-orange-600',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    poor: {
      title: '健康状况需立即改善',
      description: '多项指标异常，建议尽快咨询医生并进行干预',
      icon: AlertCircle,
      colorClass: 'text-red',
      bgClass: 'from-red-600 to-rose-600',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
    },
  };

  const config = statusConfig[healthStatus];
  const StatusIcon = config.icon;

  // 提取关键发现
  const keyFindings = React.useMemo(() => {
    // 如果有结构化的指标数据
    if (analysis.indicators && analysis.indicators.length > 0) {
      const abnormal = analysis.indicators.filter(
        (i) => i.status !== '正常'
      );

      if (abnormal.length === 0) {
        return ['各项指标均在正常范围内'];
      }

      return abnormal.map((i) => {
        const priorityText = i.priority === '高' ? '【高优先级】' : '';
        return `${priorityText}${i.name}: ${i.status}`;
      });
    }

    // 如果没有结构化指标数据，但有摘要
    if (analysis.summary) {
      // 尝试从摘要中提取关键信息
      const findings = [];
      const summary = analysis.summary;

      // 检测常见异常指标关键词
      const abnormalKeywords = [
        { pattern: /偏高|高|超标|异常/g, label: '发现偏高指标' },
        { pattern: /偏低|低|不足/g, label: '发现偏低指标' },
        { pattern: /血脂|胆固醇|甘油三酯/g, label: '血脂相关指标' },
        { pattern: /血糖|糖尿病/g, label: '血糖相关指标' },
        { pattern: /血压|高血压/g, label: '血压相关指标' },
      ];

      let hasAbnormal = false;
      abnormalKeywords.forEach(({ pattern, label }) => {
        if (pattern.test(summary)) {
          findings.push(label);
          hasAbnormal = true;
        }
      });

      if (hasAbnormal) {
        findings.push('请查看下方详细指标');
        return findings;
      }

      // 如果没有检测到异常关键词
      return [summary.substring(0, 50) + '...', '请查看下方详细指标'];
    }

    // 完全没有数据
    return ['暂无指标数据'];
  }, [analysis.indicators, analysis.summary]);

  // 空数据处理
  if (!analysis.summary && !analysis.healthScore) {
    return (
      <div className={`bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 ${className}`}>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          健康状况总评
        </h3>
        <p className="text-zinc-500 dark:text-zinc-400 text-center py-8">
          暂无分析数据
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 ${className}`}>
      {/* 标题 */}
      <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
        <Heart className="w-5 h-5 text-red-500" />
        健康状况总评
      </h3>

      {/* 健康状态卡片 */}
      <div className={`bg-gradient-to-r ${config.bgClass} p-6 rounded-xl shadow-lg text-white mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${config.iconBg}`}>
              <StatusIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold">{config.title}</h4>
              <p className="text-sm opacity-90">{config.description}</p>
            </div>
          </div>
          {analysis.healthScore !== undefined && (
            <div className="text-right">
              <div className="text-4xl font-bold">{analysis.healthScore}</div>
              <div className="text-sm opacity-90">/ 100 分</div>
            </div>
          )}
        </div>
      </div>

      {/* 关键发现 */}
      {keyFindings.length > 0 && (
        <div className="mb-6">
          <h5 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            关键发现 ({keyFindings.length})
          </h5>
          <div className="space-y-2">
            {keyFindings.map((finding, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border-l-4 ${
                  finding.includes('正常')
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                }`}
              >
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{finding}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 显示原始摘要（如果有） */}
      {analysis.summary && keyFindings.length === 0 && (
        <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {analysis.summary}
          </p>
        </div>
      )}
    </div>
  );
}
