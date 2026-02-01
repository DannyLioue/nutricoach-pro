'use client';

interface IndicatorData {
  name: string;
  value: number;
  target: number;
  unit: string;
  status: 'normal' | 'high' | 'low';
  color: string;
}

interface HealthIndicatorChartProps {
  indicators: IndicatorData[];
  title?: string;
}

const STATUS_COLORS = {
  normal: '#10B981',
  high: '#EF4444',
  low: '#F59E0B',
};

export function HealthIndicatorChart({ indicators, title = '健康指标概览' }: HealthIndicatorChartProps) {
  if (!indicators || indicators.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">暂无健康指标数据</p>
      </div>
    );
  }

  // 过滤掉无效数据（value 或 target 不是有效数字）
  const validIndicators = indicators.filter(
    (indicator) =>
      typeof indicator.value === 'number' &&
      !isNaN(indicator.value) &&
      typeof indicator.target === 'number' &&
      !isNaN(indicator.target) &&
      indicator.target > 0
  );

  if (validIndicators.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">暂无有效指标数据</p>
      </div>
    );
  }

  // 统计各状态的指标数量
  const statusCounts = {
    normal: validIndicators.filter(i => i.status === 'normal').length,
    high: validIndicators.filter(i => i.status === 'high').length,
    low: validIndicators.filter(i => i.status === 'low').length,
  };

  // 准备饼图数据 - 显示指标状态分布
  const statusDistribution = [
    { name: '正常', value: statusCounts.normal, color: STATUS_COLORS.normal, status: 'normal' },
    { name: '偏高', value: statusCounts.high, color: STATUS_COLORS.high, status: 'high' },
    { name: '偏低', value: statusCounts.low, color: STATUS_COLORS.low, status: 'low' },
  ].filter(d => d.value > 0); // 只显示有数据的部分

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>

      {/* 指标卡片网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {validIndicators.map((indicator, idx) => {
          const percentage = Math.round((indicator.value / indicator.target) * 100);
          const isNormal = indicator.status === 'normal';

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border-2 ${
                isNormal
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                  : indicator.status === 'high'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              }`}
            >
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                {indicator.name}
              </div>

              {/* 指标值 */}
              <div className="flex items-baseline gap-1 mb-1">
                <span className={`text-2xl font-bold ${
                  isNormal
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : indicator.status === 'high'
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-amber-700 dark:text-amber-300'
                }`}>
                  {indicator.value}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {indicator.unit}
                </span>
              </div>

              {/* 目标值 */}
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                目标: {indicator.target} {indicator.unit}
              </div>

              {/* 进度条 */}
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 mb-1">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isNormal
                      ? 'bg-emerald-500'
                      : indicator.status === 'high'
                      ? 'bg-red-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>

              {/* 百分比 */}
              <div className={`text-xs font-medium ${
                isNormal
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : indicator.status === 'high'
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-amber-700 dark:text-amber-300'
              }`}>
                {percentage}%
              </div>
            </div>
          );
        })}
      </div>

      {/* 指标状态汇总 */}
      {validIndicators.length > 0 && (
        <div className="bg-gradient-to-r from-zinc-50 to-blue-50 dark:from-zinc-900 dark:to-blue-900/20 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              共 <strong className="text-zinc-900 dark:text-zinc-100">{validIndicators.length}</strong> 项指标
            </span>
            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
            <div className="flex flex-wrap gap-3">
              {statusCounts.normal > 0 && (
                <span className="flex items-center gap-1.5 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-zinc-700 dark:text-zinc-300">正常 {statusCounts.normal}项</span>
                </span>
              )}
              {statusCounts.high > 0 && (
                <span className="flex items-center gap-1.5 text-sm">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="text-zinc-700 dark:text-zinc-300">偏高 {statusCounts.high}项</span>
                </span>
              )}
              {statusCounts.low > 0 && (
                <span className="flex items-center gap-1.5 text-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-zinc-700 dark:text-zinc-300">偏低 {statusCounts.low}项</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 简化版：单个指标仪表盘
interface SingleIndicatorProps {
  name: string;
  value: number;
  target: number;
  unit: string;
  status: 'normal' | 'high' | 'low';
}

export function SingleIndicator({ name, value, target, unit, status }: SingleIndicatorProps) {
  const percentage = Math.round((value / target) * 100);
  const isNormal = status === 'normal';

  const bgColor =
    status === 'normal'
      ? 'bg-emerald-50 dark:bg-emerald-900/20'
      : status === 'high'
      ? 'bg-red-50 dark:bg-red-900/20'
      : 'bg-amber-50 dark:bg-amber-900/20';

  const borderColor =
    status === 'normal'
      ? 'border-emerald-200 dark:border-emerald-800'
      : status === 'high'
      ? 'border-red-200 dark:border-red-800'
      : 'border-amber-200 dark:border-amber-800';

  const textColor =
    status === 'normal'
      ? 'text-emerald-700 dark:text-emerald-300'
      : status === 'high'
      ? 'text-red-700 dark:text-red-300'
      : 'text-amber-700 dark:text-amber-300';

  const progressColor =
    status === 'normal'
      ? 'bg-emerald-500'
      : status === 'high'
      ? 'bg-red-500'
      : 'bg-amber-500';

  return (
    <div className={`p-4 rounded-xl border-2 ${bgColor} ${borderColor}`}>
      <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">{name}</div>

      <div className="flex items-baseline gap-1 mb-1">
        <span className={`text-2xl font-bold ${textColor}`}>{value}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{unit}</span>
      </div>

      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
        目标: {target} {unit}
      </div>

      <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${progressColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className={`text-xs font-medium mt-1 ${textColor}`}>{percentage}%</div>
    </div>
  );
}
