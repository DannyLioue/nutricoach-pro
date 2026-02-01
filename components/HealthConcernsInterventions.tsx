import { AlertCircle, Apple, Clock, Moon, Sun, Pill, Activity, Target, CheckCircle2 } from 'lucide-react';

interface FoodItem {
  food: string;
  reason: string;
  amount?: string;
  timing?: string;
  alternatives?: string;
}

interface AvoidFood {
  food: string;
  reason: string;
  alternatives?: string;
  timing?: string;
}

interface Supplement {
  name: string;
  dosage: string;
  duration: string;
  evidence: string;
}

interface LifestyleTips {
  morningRoutine?: string[];
  dailyHabits?: string[];
  eveningRoutine?: string[];
  weeklyActivities?: string[];
  mealTiming?: string[];
  habits?: string[];
  energyManagement?: string[];
  exerciseTips?: string[];
}

interface CommonConcern {
  concern: string;
  keyFoods: FoodItem[];
  avoidFoods: AvoidFood[];
  supplements: Supplement[];
  lifestyleTips: LifestyleTips;
}

interface Concern {
  concern: string;
  severity: string;
  nutritionalStrategy: {
    title: string;
    keyFoods: FoodItem[];
    avoidFoods: AvoidFood[];
    supplements: Supplement[];
    mealTiming: string;
  };
  lifestyleModifications: {
    title: string;
    morningRoutine: string[];
    dailyHabits: string[];
    eveningRoutine: string[];
    weeklyActivities: string[];
  };
  targetedNutrients: Array<{
    nutrient: string;
    dailyAmount: string;
    foodSources: string[];
    function: string;
  }>;
  sampleMeals: {
    title: string;
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
  };
  progressTracking: {
    title: string;
    symptoms: string[];
    metrics: string[];
    timeline: string;
  };
}

interface HealthConcernsInterventionsData {
  title: string;
  description: string;
  concerns: Concern[];
  commonConcerns: {
    title: string;
    insomnia: CommonConcern;
    constipation: CommonConcern;
    jointPain: CommonConcern;
    digestiveIssues: CommonConcern;
    fatigue: CommonConcern;
  };
}

interface HealthConcernsInterventionsProps {
  data: HealthConcernsInterventionsData;
}

const concernIcons: Record<string, any> = {
  '失眠': Moon,
  '睡眠质量差': Moon,
  '便秘': Apple,
  '排便困难': Apple,
  '关节疼痛': Activity,
  '关节炎': Activity,
  '消化不良': AlertCircle,
  '胃胀气': AlertCircle,
  '胃反流': AlertCircle,
  '疲劳': Sun,
  '乏力': Sun,
  '精力不足': Sun,
};

const concernColors: Record<string, string> = {
  '失眠': 'purple',
  '睡眠质量差': 'purple',
  '便秘': 'green',
  '排便困难': 'green',
  '关节疼痛': 'orange',
  '关节炎': 'orange',
  '消化不良': 'amber',
  '胃胀气': 'amber',
  '胃反流': 'amber',
  '疲劳': 'yellow',
  '乏力': 'yellow',
  '精力不足': 'yellow',
};

export default function HealthConcernsInterventions({ data }: HealthConcernsInterventionsProps) {
  // Only display if there are concerns from the client
  if (!data.concerns || data.concerns.length === 0) {
    return null;
  }

  const getIcon = (concern: string) => {
    for (const [key, icon] of Object.entries(concernIcons)) {
      if (concern.includes(key)) {
        return icon;
      }
    }
    return AlertCircle;
  };

  const getColor = (concern: string) => {
    for (const [key, color] of Object.entries(concernColors)) {
      if (concern.includes(key)) {
        return color;
      }
    }
    return 'blue';
  };

  const renderConcernCard = (concern: Concern) => {
    const Icon = getIcon(concern.concern);
    const color = getColor(concern.concern);

    return (
      <div key={concern.concern} className={`bg-white dark:bg-zinc-800 rounded-xl border-2 border-${color}-200 dark:border-${color}-800 overflow-hidden`}>
        {/* Header */}
        <div className={`bg-${color}-50 dark:bg-${color}-900/20 px-6 py-4 border-b border-${color}-200 dark:border-${color}-800`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/40`}>
              <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{concern.concern}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300`}>
                {concern.severity}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 关键食物 */}
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-green-600" />
              推荐食物
            </h4>
            <div className="grid md:grid-cols-2 gap-3">
              {concern.nutritionalStrategy.keyFoods.map((food, idx) => (
                <div key={idx} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div className="font-medium text-green-900 dark:text-green-100 text-sm mb-1">{food.food}</div>
                  <div className="text-xs text-green-700 dark:text-green-300 mb-1">{food.reason}</div>
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    {food.amount && <span>📏 {food.amount}</span>}
                    {food.timing && <span>⏰ {food.timing}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 避免食物 */}
          {concern.nutritionalStrategy.avoidFoods.length > 0 && (
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                避免/限制食物
              </h4>
              <div className="grid md:grid-cols-2 gap-3">
                {concern.nutritionalStrategy.avoidFoods.map((food, idx) => (
                  <div key={idx} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                    <div className="font-medium text-red-900 dark:text-red-100 text-sm mb-1">{food.food}</div>
                    <div className="text-xs text-red-700 dark:text-red-300">{food.reason}</div>
                    {food.alternatives && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">→ 替代：{food.alternatives}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 补充剂 */}
          {concern.nutritionalStrategy.supplements.length > 0 && (
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <Pill className="w-4 h-4 text-purple-600" />
                建议补充剂
              </h4>
              <div className="grid md:grid-cols-2 gap-3">
                {concern.nutritionalStrategy.supplements.map((supp, idx) => (
                  <div key={idx} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <div className="font-medium text-purple-900 dark:text-purple-100 text-sm mb-1">{supp.name}</div>
                    <div className="text-xs text-purple-700 dark:text-purple-300 mb-1">
                      剂量: {supp.dosage} | 周期: {supp.duration}
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400">✓ {supp.evidence}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 生活方式调整 */}
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              生活方式调整
            </h4>
            <div className="space-y-3">
              {concern.lifestyleModifications.morningRoutine && concern.lifestyleModifications.morningRoutine.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                  <div className="font-medium text-orange-900 dark:text-orange-100 text-sm mb-2">🌅 早晨习惯</div>
                  <ul className="space-y-1">
                    {concern.lifestyleModifications.morningRoutine.map((item, idx) => (
                      <li key={idx} className="text-xs text-orange-800 dark:text-orange-200 flex items-start gap-1">
                        <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {concern.lifestyleModifications.dailyHabits && concern.lifestyleModifications.dailyHabits.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div className="font-medium text-blue-900 dark:text-blue-100 text-sm mb-2">☀️ 日间习惯</div>
                  <ul className="space-y-1">
                    {concern.lifestyleModifications.dailyHabits.map((item, idx) => (
                      <li key={idx} className="text-xs text-blue-800 dark:text-blue-200 flex items-start gap-1">
                        <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {concern.lifestyleModifications.eveningRoutine && concern.lifestyleModifications.eveningRoutine.length > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
                  <div className="font-medium text-indigo-900 dark:text-indigo-100 text-sm mb-2">🌙 晚间习惯</div>
                  <ul className="space-y-1">
                    {concern.lifestyleModifications.eveningRoutine.map((item, idx) => (
                      <li key={idx} className="text-xs text-indigo-800 dark:text-indigo-200 flex items-start gap-1">
                        <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {concern.lifestyleModifications.weeklyActivities && concern.lifestyleModifications.weeklyActivities.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div className="font-medium text-green-900 dark:text-green-100 text-sm mb-2">📅 每周活动</div>
                  <ul className="space-y-1">
                    {concern.lifestyleModifications.weeklyActivities.map((item, idx) => (
                      <li key={idx} className="text-xs text-green-800 dark:text-green-200">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 效果追踪 */}
          {concern.progressTracking && (
            <div className="bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-800/50 dark:to-zinc-900/50 rounded-lg p-4">
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2 text-sm">{concern.progressTracking.title}</h4>
              <div className="grid md:grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">关注症状</div>
                  <ul className="space-y-0.5 text-zinc-600 dark:text-zinc-400">
                    {concern.progressTracking.symptoms.map((symptom, idx) => (
                      <li key={idx}>• {symptom}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">量化指标</div>
                  <ul className="space-y-0.5 text-zinc-600 dark:text-zinc-400">
                    {concern.progressTracking.metrics.map((metric, idx) => (
                      <li key={idx}>• {metric}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">预期时间</div>
                  <div className="text-zinc-600 dark:text-zinc-400">{concern.progressTracking.timeline}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-700 dark:to-cyan-700 px-8 py-6">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-white" />
          <div>
            <h2 className="text-2xl font-bold text-white">{data.title}</h2>
            <p className="text-teal-50 text-sm mt-1">{data.description}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {data.concerns.length > 0 ? (
          <div className="space-y-6">
            {data.concerns.map(renderConcernCard)}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>暂无其他健康问题记录</p>
            <p className="text-sm mt-2">在客户资料中添加健康问题后，这里将显示针对性的营养和生活方式干预方案</p>
          </div>
        )}
      </div>
    </div>
  );
}
