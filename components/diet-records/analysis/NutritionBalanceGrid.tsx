'use client';

interface NutritionBalanceGridProps {
  nutritionSummary?: {
    protein?: string;
    vegetables?: string;
    carbs?: string;
    fat?: string;
    fiber?: string;
  };
}

/**
 * 营养素平衡网格组件
 * 显示蛋白质、蔬菜、碳水、脂肪、纤维的摄入状态
 */
export default function NutritionBalanceGrid({
  nutritionSummary,
}: NutritionBalanceGridProps) {
  // 营养素配置
  const nutrients = [
    {
      key: 'protein',
      label: '蛋白质',
      emoji: '🥩',
      value: nutritionSummary?.protein || '未评估',
    },
    {
      key: 'vegetables',
      label: '蔬菜',
      emoji: '🥬',
      value: nutritionSummary?.vegetables || '未评估',
    },
    {
      key: 'carbs',
      label: '碳水',
      emoji: '🍚',
      value: nutritionSummary?.carbs || '未评估',
    },
    {
      key: 'fat',
      label: '脂肪',
      emoji: '🥑',
      value: nutritionSummary?.fat || '未评估',
    },
    {
      key: 'fiber',
      label: '纤维',
      emoji: '🌾',
      value: nutritionSummary?.fiber || '未评估',
    },
  ];

  // 获取状态颜色配置
  const getStatusConfig = (value: string) => {
    switch (value) {
      case '充足':
        return {
          bgClass: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
          textClass: 'text-green-700 dark:text-green-400',
          icon: <span className="text-green-600">✓</span>,
        };
      case '一般':
        return {
          bgClass: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
          textClass: 'text-yellow-700 dark:text-yellow-400',
          icon: <span className="text-yellow-600">○</span>,
        };
      case '不足':
        return {
          bgClass: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
          textClass: 'text-yellow-700 dark:text-yellow-400',
          icon: <span className="text-yellow-600">!</span>,
        };
      case '缺乏':
        return {
          bgClass: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
          textClass: 'text-red-700 dark:text-red-400',
          icon: <span className="text-red-600">!</span>,
        };
      default:
        return {
          bgClass: 'bg-zinc-50 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700',
          textClass: 'text-zinc-500 dark:text-zinc-400',
          icon: <span className="text-zinc-400">-</span>,
        };
    }
  };

  return (
    <div className="grid grid-cols-5 gap-3">
      {nutrients.map((nutrient) => {
        const config = getStatusConfig(nutrient.value);
        return (
          <div
            key={nutrient.key}
            className={`p-3 rounded-lg border ${config.bgClass} text-center`}
          >
            <div className="text-2xl mb-1">{nutrient.emoji}</div>
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              {nutrient.label}
            </div>
            <div className={`text-sm font-semibold ${config.textClass}`}>
              {nutrient.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
