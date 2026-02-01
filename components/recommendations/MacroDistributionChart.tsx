'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Apple, Wheat, Droplet } from 'lucide-react';

interface MacroTarget {
  name: string;
  grams: number;
  kcal: number;
  percentage: string;
  color: string;
}

interface MacroDistributionChartProps {
  macros: {
    carbs?: MacroTarget;
    protein?: MacroTarget;
    fat?: MacroTarget;
  };
  totalCalories?: number;
  title?: string;
}

const DEFAULT_MACROS = {
  carbs: { name: '碳水化合物', grams: 225, kcal: 900, percentage: '50%', color: '#3B82F6' },
  protein: { name: '蛋白质', grams: 90, kcal: 360, percentage: '20%', color: '#10B981' },
  fat: { name: '脂肪', grams: 50, kcal: 450, percentage: '25%', color: '#F59E0B' },
};

export function MacroDistributionChart({
  macros,
  totalCalories = 1800,
  title = '宏量营养素分布',
}: MacroDistributionChartProps) {
  // 过滤出有效的宏量营养素数据（必须有有效的 grams 和 kcal）
  const validMacros = [
    macros?.carbs && typeof macros.carbs.grams === 'number' && !isNaN(macros.carbs.grams) ? macros.carbs : null,
    macros?.protein && typeof macros.protein.grams === 'number' && !isNaN(macros.protein.grams) ? macros.protein : null,
    macros?.fat && typeof macros.fat.grams === 'number' && !isNaN(macros.fat.grams) ? macros.fat : null,
  ].filter((m): m is MacroTarget => m !== null);

  // 如果没有有效数据，使用默认值
  const data = validMacros.length > 0
    ? validMacros
    : [DEFAULT_MACROS.carbs, DEFAULT_MACROS.protein, DEFAULT_MACROS.fat];

  // 饼图数据
  const pieData = data.map((item) => ({
    name: item.name,
    value: isFinite(item.kcal) ? item.kcal : 0,
    color: item.color,
  }));

  // 柱状图数据
  const barData = data.map((item) => ({
    name: item.name,
    克数: isFinite(item.grams) ? item.grams : 0,
    千卡: isFinite(item.kcal) ? item.kcal : 0,
  }));

  const getIcon = (name: string) => {
    switch (name) {
      case '碳水化合物':
        return <Wheat className="w-5 h-5" />;
      case '蛋白质':
        return <Droplet className="w-5 h-5" />;
      case '脂肪':
        return <Apple className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>

      {/* 总热量卡片 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">每日总热量目标</div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-blue-900 dark:text-blue-100">
            {totalCalories}
          </span>
          <span className="text-lg text-blue-700 dark:text-blue-300">kcal</span>
        </div>
      </div>

      {/* 营养素卡片 */}
      <div className="grid md:grid-cols-3 gap-4">
        {data.map((macro) => (
          <div
            key={macro.name}
            className="bg-white dark:bg-zinc-900 rounded-xl p-6 border-2"
            style={{ borderColor: macro.color }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${macro.color}20` }}
              >
                <div style={{ color: macro.color }}>{getIcon(macro.name)}</div>
              </div>
              <div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">{macro.name}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-500">{macro.percentage}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {macro.grams}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">克</span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-xl font-semibold text-zinc-700 dark:text-zinc-300">
                  {macro.kcal}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">千卡</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 可视化图表 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 饼图 - 热量分布 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
            热量来源分布
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={(entry: any) => {
                  const percent = isFinite(entry.percent) ? (entry.percent * 100).toFixed(0) : '0';
                  return `${entry.name} ${percent}%`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                itemStyle={{ color: '#F9FAFB' }}
                formatter={(value: any) => {
                  const numValue = typeof value === 'number' && isFinite(value) ? value : 0;
                  return [`${numValue} kcal`, '热量'];
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value: string) => (
                  <span style={{ color: '#374151', fontSize: '12px' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 柱状图 - 克数对比 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
            推荐摄入量（克）
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                stroke="#6B7280"
              />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                stroke="#6B7280"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                itemStyle={{ color: '#F9FAFB' }}
              />
              <Bar dataKey="克数" radius={[8, 8, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={data[index].color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 食物来源建议 */}
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
          🍽️ 推荐食物来源
        </h4>
        <div className="grid md:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
              碳水化合物
            </div>
            <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
              <li>• 全谷物（燕麦、糙米、全麦面包）</li>
              <li>• 薯类（红薯、紫薯、土豆）</li>
              <li>• 豆类（红豆、绿豆、鹰嘴豆）</li>
              <li>• 蔬菜（西兰花、菠菜、胡萝卜）</li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
              蛋白质
            </div>
            <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
              <li>• 瘦肉（鸡胸肉、瘦牛肉、鱼肉）</li>
              <li>• 蛋类（鸡蛋、鹌鹑蛋）</li>
              <li>• 豆制品（豆腐、豆浆、毛豆）</li>
              <li>• 乳制品（牛奶、酸奶、奶酪）</li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-amber-700 dark:text-amber-300 mb-2">
              脂肪
            </div>
            <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
              <li>• 坚果（核桃、杏仁、腰果）</li>
              <li>• 种子（奇亚籽、亚麻籽、芝麻）</li>
              <li>• 牛油果、橄榄油</li>
              <li>• 深海鱼（三文鱼、鲭鱼）</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
