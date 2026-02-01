import { Calendar, ShoppingCart, CheckCircle2, Target } from 'lucide-react';

interface DailyMeal {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
  tips: string;
}

interface WeekPlan {
  title: string;
  focus: string;
  goals: string[];
  dailyPlan: DailyMeal[];
  weekendAdjustment: {
    title: string;
    content: string;
  };
}

interface TwoWeekPlanData {
  title: string;
  description: string;
  week1: WeekPlan;
  week2: WeekPlan;
  shoppingList: {
    title: string;
    vegetables: string[];
    proteins: string[];
    carbs: string[];
    healthyFats: string[];
  };
  trackingTools: {
    title: string;
    plateVisual: string;
    dailyChecklist: string[];
    weeklyMetrics: string[];
  };
  expectedOutcomes: {
    title: string;
    physical: string[];
    habitual: string[];
    biomarkers: string[];
  };
}

interface TwoWeekPlanProps {
  data: TwoWeekPlanData;
}

export default function TwoWeekPlan({ data }: TwoWeekPlanProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* 标题 */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700 px-8 py-6">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-8 h-8 text-white" />
          <h2 className="text-2xl font-bold text-white">{data.title}</h2>
        </div>
        <p className="text-green-50 text-sm">{data.description}</p>
      </div>

      <div className="p-8 space-y-8">
        {/* 211饮食法说明 */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
            <Target className="w-5 h-5" />
            什么是211饮食法？
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
              <div>
                <div className="font-semibold text-green-900 dark:text-green-100">蔬菜（2份）</div>
                <div className="text-green-700 dark:text-green-300">占餐盘1/2，约2杯，提供维生素、矿物质和膳食纤维</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
              <div>
                <div className="font-semibold text-blue-900 dark:text-blue-100">优质高蛋白食物（1份）</div>
                <div className="text-blue-700 dark:text-blue-300">占餐盘1/4，约1掌心，支持肌肉修复和饱腹感</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
              <div>
                <div className="font-semibold text-orange-900 dark:text-orange-100">全谷物碳水（1份）</div>
                <div className="text-orange-700 dark:text-orange-300">占餐盘1/4，约1拳头，提供持久能量</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">✓</div>
              <div>
                <div className="font-semibold text-purple-900 dark:text-purple-100">核心原则</div>
                <div className="text-purple-700 dark:text-purple-300">使用9寸餐盘，先吃蔬菜，再吃高蛋白食物，最后吃碳水</div>
              </div>
            </div>
          </div>
        </div>

        {/* 第一周 */}
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-300 font-bold text-sm">1</span>
            {data.week1.title}
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">{data.week1.focus}</p>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">本周目标</h4>
            <ul className="space-y-1">
              {data.week1.goals.map((goal, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {goal}
                </li>
              ))}
            </ul>
          </div>

          {data.week1.dailyPlan.map((plan, idx) => (
            <div key={idx} className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 mb-3">
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">{plan.day}</h4>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-green-700 dark:text-green-300">早餐：</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{plan.breakfast}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">午餐：</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{plan.lunch}</span>
                </div>
                <div>
                  <span className="font-medium text-orange-700 dark:text-orange-300">晚餐：</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{plan.dinner}</span>
                </div>
                <div>
                  <span className="font-medium text-purple-700 dark:text-purple-300">加餐：</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{plan.snack}</span>
                </div>
              </div>
              <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-800 dark:text-yellow-200">
                💡 {plan.tips}
              </div>
            </div>
          ))}

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">{data.week1.weekendAdjustment.title}</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">{data.week1.weekendAdjustment.content}</p>
          </div>
        </div>

        {/* 第二周 */}
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm">2</span>
            {data.week2.title}
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">{data.week2.focus}</p>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">本周目标</h4>
            <ul className="space-y-1">
              {data.week2.goals.map((goal, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {goal}
                </li>
              ))}
            </ul>
          </div>

          {data.week2.dailyPlan.map((plan, idx) => (
            <div key={idx} className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 mb-3">
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">{plan.day}</h4>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-green-700 dark:text-green-300">早餐：</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{plan.breakfast}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">午餐：</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{plan.lunch}</span>
                </div>
                <div>
                  <span className="font-medium text-orange-700 dark:text-orange-300">晚餐：</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{plan.dinner}</span>
                </div>
                <div>
                  <span className="font-medium text-purple-700 dark:text-purple-300">加餐：</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{plan.snack}</span>
                </div>
              </div>
              <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-800 dark:text-yellow-200">
                💡 {plan.tips}
              </div>
            </div>
          ))}

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">{data.week2.weekendAdjustment.title}</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">{data.week2.weekendAdjustment.content}</p>
          </div>
        </div>

        {/* 购物清单 */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            {data.shoppingList.title}
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">🥬 蔬菜类</h4>
              <ul className="space-y-1 text-sm text-green-900 dark:text-green-100">
                {data.shoppingList.vegetables.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🥩 高蛋白食物</h4>
              <ul className="space-y-1 text-sm text-blue-900 dark:text-blue-100">
                {data.shoppingList.proteins.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">🍞 碳水化合物</h4>
              <ul className="space-y-1 text-sm text-orange-900 dark:text-orange-100">
                {data.shoppingList.carbs.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">🥑 健康脂肪</h4>
              <ul className="space-y-1 text-sm text-purple-900 dark:text-purple-100">
                {data.shoppingList.healthyFats.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 追踪工具 */}
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">{data.trackingTools.title}</h3>
          <div className="mb-4 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{data.trackingTools.plateVisual}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2 text-sm">每日检查清单</h4>
              <ul className="space-y-1">
                {data.trackingTools.dailyChecklist.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <input type="checkbox" className="rounded" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2 text-sm">每周追踪指标</h4>
              <ul className="space-y-1">
                {data.trackingTools.weeklyMetrics.map((item, i) => (
                  <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300">• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 预期效果 */}
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg p-6">
          <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-4">{data.expectedOutcomes.title}</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-900 rounded p-4">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 text-sm">身体变化</h4>
              <ul className="space-y-1">
                {data.expectedOutcomes.physical.map((item, i) => (
                  <li key={i} className="text-xs text-green-900 dark:text-green-100">✓ {item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 text-sm">习惯养成</h4>
              <ul className="space-y-1">
                {data.expectedOutcomes.habitual.map((item, i) => (
                  <li key={i} className="text-xs text-blue-900 dark:text-blue-100">✓ {item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded p-4">
              <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2 text-sm">指标改善</h4>
              <ul className="space-y-1">
                {data.expectedOutcomes.biomarkers.map((item, i) => (
                  <li key={i} className="text-xs text-purple-900 dark:text-purple-100">✓ {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
