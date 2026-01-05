'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import TrafficLightGuide, { TrafficLightData } from '@/components/TrafficLightGuide';
import HeartRateZones, { HeartRateData } from '@/components/HeartRateZones';

function RecommendationDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchRecommendation();
    }
  }, [id]);

  const fetchRecommendation = async () => {
    try {
      const res = await fetch(`/api/recommendations/${id}`);
      const data = await res.json();
      if (res.ok) {
        setRecommendation(data.recommendation);
      } else {
        setError(data.error || '获取建议失败');
      }
    } catch (err) {
      console.error('获取建议失败:', err);
      setError('获取建议失败');
    } finally {
      setLoading(false);
    }
  };

  const getRecTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      DIET: '饮食建议',
      EXERCISE: '运动建议',
      LIFESTYLE: '生活方式',
      COMPREHENSIVE: '综合干预',
    };
    return labels[type] || type;
  };

  // 转换 trafficLightFoods 数据格式
  const convertTrafficLightData = (data: any): TrafficLightData | null => {
    if (!data?.trafficLightFoods) return null;

    return {
      green: {
        title: '🟢 绿灯食物 (随意吃)',
        description: '富含营养素，有助于改善指标',
        items: data.trafficLightFoods.green || [],
      },
      yellow: {
        title: '🟡 黄灯食物 (控制量)',
        description: '可以食用，但需注意分量',
        items: data.trafficLightFoods.yellow || [],
      },
      red: {
        title: '🔴 红灯食物 (避免)',
        description: '严格限制，对当前指标有负面影响',
        items: data.trafficLightFoods.red || [],
      },
    };
  };

  // 转换心率区间数据
  const convertHeartRateData = (data: any): HeartRateData | null => {
    const exerciseCardio = data?.exercisePrescription?.cardio;
    if (!exerciseCardio?.intensity?.targetZone) return null;

    // 从 targetZone 字符串提取数字 "137-148 bpm"
    const match = exerciseCardio.intensity.targetZone.match(/(\d+)-(\d+)/);
    if (!match) return null;

    const minBpm = parseInt(match[1]);
    const maxBpm = parseInt(match[2]);

    // 从 calculation 提取年龄 "(220-39-70)"
    const ageMatch = exerciseCardio.intensity.calculation?.match(/220-(\d+)/);
    const age = ageMatch ? parseInt(ageMatch[1]) : 39;

    // 估算 maxHr 和 restingHr
    const maxHr = 220 - age;
    const restingHr = 70; // 默认值

    return {
      age,
      restingHr,
      maxHr,
      recommendedZone: {
        name: '目标训练区间',
        minBpm,
        maxBpm,
        color: 'bg-emerald-100 dark:bg-emerald-900/30',
        textColor: 'text-emerald-800 dark:text-emerald-200',
        description: exerciseCardio.timing || '保持在此范围内进行训练',
      },
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <DashboardNavbar />
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-8 text-center">
            <div className="text-zinc-500">加载中...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !recommendation) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <DashboardNavbar />
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-8 text-center">
            <div className="text-red-600">{error || '建议不存在'}</div>
            <Link
              href="/recommendations"
              className="inline-block mt-4 px-6 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg"
            >
              返回列表
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const content = recommendation.content || {};
  const metadata = content.metadata || {};

  // 检查是否是新格式 (Clinical RD)
  const isNewFormat = !!content.dailyTargets;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardNavbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {isNewFormat ? '专业营养干预方案' : '健康建议详情'}
              </h1>
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium">
                {getRecTypeLabel(recommendation.type)}
              </span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
              客户：{recommendation.client?.name || '未知'} ·
              生成时间：{new Date(recommendation.generatedAt || recommendation.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>
          <div className="flex gap-2">
            {recommendation.reportId && (
              <Link
                href={`/analysis/${recommendation.reportId}`}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg hover:bg-zinc-300 transition-colors"
              >
                查看报告
              </Link>
            )}
            <Link
              href="/recommendations"
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg hover:bg-zinc-300 transition-colors"
            >
              返回列表
            </Link>
          </div>
        </div>

        {/* 旧格式总结 */}
        {!isNewFormat && content.summary && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
              📋 整体总结
            </h3>
            <p className="text-emerald-800 dark:text-emerald-200">{content.summary}</p>
          </div>
        )}

        {/* ==================== 新格式：注册营养师RD标准 ==================== */}

        {isNewFormat && (
          <>
            {/* 总结 */}
            {content.summary && (
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
                  📋 干预方案总结
                </h3>
                <p className="text-emerald-800 dark:text-emerald-200 text-sm leading-relaxed">{content.summary}</p>
              </div>
            )}

            {/* 每日目标 */}
            {content.dailyTargets && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  每日营养目标
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">总热量</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {content.dailyTargets.calories}
                      <span className="text-sm font-normal ml-1">kcal</span>
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <p className="text-sm text-green-600 dark:text-green-400 mb-1">碳水</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {content.dailyTargets.macros?.carbs?.grams || '-'}
                      <span className="text-sm font-normal ml-1">g</span>
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      {content.dailyTargets.macros?.carbs?.percentage || '-'}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                    <p className="text-sm text-orange-600 dark:text-orange-400 mb-1">蛋白质</p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      {content.dailyTargets.macros?.protein?.grams || '-'}
                      <span className="text-sm font-normal ml-1">g</span>
                    </p>
                    <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                      {content.dailyTargets.macros?.protein?.percentage || '-'}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                    <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">脂肪</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {content.dailyTargets.macros?.fat?.grams || '-'}
                      <span className="text-sm font-normal ml-1">g</span>
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                      {content.dailyTargets.macros?.fat?.percentage || '-'}
                    </p>
                  </div>
                </div>
                {(content.dailyTargets.fiber || content.dailyTargets.water) && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {content.dailyTargets.fiber && (
                      <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                        膳食纤维: {content.dailyTargets.fiber}
                      </div>
                    )}
                    {content.dailyTargets.water && (
                      <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                        饮水: {content.dailyTargets.water}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 红绿灯食物清单 */}
            {content.trafficLightFoods && (
              <div className="mb-6">
                <TrafficLightGuide data={convertTrafficLightData(content)!} />
              </div>
            )}

            {/* 一日示范食谱 */}
            {content.oneDayMealPlan && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🍽️</span>
                  一日示范食谱
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {content.oneDayMealPlan.breakfast && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                        <span>🌅</span>
                        早餐 {content.oneDayMealPlan.breakfast.time && `(${content.oneDayMealPlan.breakfast.time})`}
                      </h4>
                      <ul className="space-y-2">
                        {content.oneDayMealPlan.breakfast.meals?.map((meal: any, idx: number) => (
                          <li key={idx} className="text-sm text-amber-800 dark:text-amber-200">
                            <span className="font-medium">{meal.food}</span>
                            <span className="mx-1">-</span>
                            <span>{meal.amount}</span>
                            {meal.preparation && (
                              <span className="block text-xs mt-1 text-amber-700 dark:text-amber-300">
                                {meal.preparation}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-3">
                        {content.oneDayMealPlan.breakfast.totalCalories}
                      </p>
                    </div>
                  )}
                  {content.oneDayMealPlan.lunch && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                        <span>🌞</span>
                        午餐 {content.oneDayMealPlan.lunch.time && `(${content.oneDayMealPlan.lunch.time})`}
                      </h4>
                      <ul className="space-y-2">
                        {content.oneDayMealPlan.lunch.meals?.map((meal: any, idx: number) => (
                          <li key={idx} className="text-sm text-green-800 dark:text-green-200">
                            <span className="font-medium">{meal.food}</span>
                            <span className="mx-1">-</span>
                            <span>{meal.amount}</span>
                            {meal.preparation && (
                              <span className="block text-xs mt-1 text-green-700 dark:text-green-300">
                                {meal.preparation}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-3">
                        {content.oneDayMealPlan.lunch.totalCalories}
                      </p>
                    </div>
                  )}
                  {content.oneDayMealPlan.dinner && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                        <span>🌙</span>
                        晚餐 {content.oneDayMealPlan.dinner.time && `(${content.oneDayMealPlan.dinner.time})`}
                      </h4>
                      <ul className="space-y-2">
                        {content.oneDayMealPlan.dinner.meals?.map((meal: any, idx: number) => (
                          <li key={idx} className="text-sm text-blue-800 dark:text-blue-200">
                            <span className="font-medium">{meal.food}</span>
                            <span className="mx-1">-</span>
                            <span>{meal.amount}</span>
                            {meal.preparation && (
                              <span className="block text-xs mt-1 text-blue-700 dark:text-blue-300">
                                {meal.preparation}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
                        {content.oneDayMealPlan.dinner.totalCalories}
                      </p>
                    </div>
                  )}
                  {content.oneDayMealPlan.snacks && content.oneDayMealPlan.snacks.length > 0 && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                        <span>🍎</span>
                        加餐
                      </h4>
                      <ul className="space-y-2">
                        {content.oneDayMealPlan.snacks.map((snack: any, idx: number) => (
                          <li key={idx} className="text-sm text-purple-800 dark:text-purple-200">
                            <span className="font-medium">{snack.food}</span>
                            <span className="mx-1">-</span>
                            <span>{snack.amount}</span>
                            {snack.time && <span className="text-xs ml-2">({snack.time})</span>}
                            {snack.purpose && (
                              <span className="block text-xs mt-1 text-purple-700 dark:text-purple-300">
                                {snack.purpose}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {content.oneDayMealPlan.dailyTotal && (
                  <div className="mt-4 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      日总计: {content.oneDayMealPlan.dailyTotal.calories}
                    </p>
                    {content.oneDayMealPlan.dailyTotal.macros && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                        碳水 {content.oneDayMealPlan.dailyTotal.macros.carbs} / 蛋白质 {content.oneDayMealPlan.dailyTotal.macros.protein} / 脂肪 {content.oneDayMealPlan.dailyTotal.macros.fat}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 生物标志物-干预映射 */}
            {content.biomarkerInterventionMapping && content.biomarkerInterventionMapping.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🔬</span>
                  异常指标干预方案
                </h3>
                <div className="space-y-4">
                  {content.biomarkerInterventionMapping.map((biomarker: any, idx: number) => (
                    <div key={idx} className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-red-900 dark:text-red-100">
                            {biomarker.biomarker}
                          </h4>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                            biomarker.status === '偏高' ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'
                          }`}>
                            {biomarker.status}
                          </span>
                        </div>
                      </div>
                      {biomarker.mechanism && (
                        <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                          <strong>机制:</strong> {biomarker.mechanism}
                        </p>
                      )}
                      {biomarker.nutritionalIntervention && (
                        <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                          <strong>干预方案:</strong> {biomarker.nutritionalIntervention}
                        </p>
                      )}
                      {biomarker.foodSources && biomarker.foodSources.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">食物来源:</p>
                          <ul className="space-y-1">
                            {biomarker.foodSources.map((source: any, sIdx: number) => (
                              <li key={sIdx} className="text-xs text-red-700 dark:text-red-300">
                                • {source.food} - {source.nutrient} ({source.amount})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {biomarker.supplement && (
                        <div className="p-3 bg-white dark:bg-zinc-900 rounded mb-3">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                            补充剂: {biomarker.supplement.name}
                          </p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            剂量: {biomarker.supplement.dosage} · 周期: {biomarker.supplement.duration}
                          </p>
                          {biomarker.supplement.evidence && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                              依据: {biomarker.supplement.evidence}
                            </p>
                          )}
                        </div>
                      )}
                      {biomarker.monitoring && (
                        <p className="text-xs text-red-700 dark:text-red-300">
                          📊 {biomarker.monitoring}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 运动处方 */}
            {content.exercisePrescription && (
              <>
                {/* 心率区间可视化 */}
                {convertHeartRateData(content) && (
                  <div className="mb-6">
                    <HeartRateZones data={convertHeartRateData(content)!} showDetails={true} />
                  </div>
                )}

                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                    <span className="text-2xl">🏃</span>
                    运动处方
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    {content.exercisePrescription.cardio && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">有氧运动</h4>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mb-1">
                          类型: {content.exercisePrescription.cardio.type}
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mb-1">
                          频率: {content.exercisePrescription.cardio.frequency}
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mb-1">
                          时长: {content.exercisePrescription.cardio.duration}
                        </p>
                        {content.exercisePrescription.cardio.timing && (
                          <p className="text-sm text-blue-800 dark:text-blue-200 mb-1">
                            时间: {content.exercisePrescription.cardio.timing}
                          </p>
                        )}
                        {content.exercisePrescription.cardio.precautions && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-100">注意事项:</p>
                            <ul className="text-xs text-blue-700 dark:text-blue-300 list-disc list-inside">
                              {content.exercisePrescription.cardio.precautions.map((p: string, idx: number) => (
                                <li key={idx}>{p}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    {content.exercisePrescription.resistance && (
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">力量训练</h4>
                        <p className="text-sm text-orange-800 dark:text-orange-200 mb-1">
                          类型: {content.exercisePrescription.resistance.type}
                        </p>
                        <p className="text-sm text-orange-800 dark:text-orange-200 mb-1">
                          频率: {content.exercisePrescription.resistance.frequency}
                        </p>
                        {content.exercisePrescription.resistance.exercises && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-orange-900 dark:text-orange-100">动作:</p>
                            <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                              {content.exercisePrescription.resistance.exercises.map((ex: any, idx: number) => (
                                <li key={idx}>
                                  {ex.name}: {ex.sets}组 × {ex.reps}次
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {content.exercisePrescription.resistance.intensity && (
                          <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                            {content.exercisePrescription.resistance.intensity}
                          </p>
                        )}
                      </div>
                    )}
                    {content.exercisePrescription.flexibility && (
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">柔韧性</h4>
                        <p className="text-sm text-purple-800 dark:text-purple-200 mb-1">
                          类型: {content.exercisePrescription.flexibility.type}
                        </p>
                        <p className="text-sm text-purple-800 dark:text-purple-200 mb-1">
                          频率: {content.exercisePrescription.flexibility.frequency}
                        </p>
                        <p className="text-sm text-purple-800 dark:text-purple-200 mb-1">
                          时长: {content.exercisePrescription.flexibility.duration}
                        </p>
                        {content.exercisePrescription.flexibility.focus && (
                          <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                            重点: {content.exercisePrescription.flexibility.focus}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* 生活方式调整 */}
            {content.lifestyleModifications && content.lifestyleModifications.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <span className="text-2xl">💡</span>
                  生活方式调整
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {content.lifestyleModifications.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                          {item.area}
                        </h4>
                        {item.priority && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.priority === '高' ? 'bg-red-200 text-red-800' :
                            item.priority === '中' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-zinc-200 text-zinc-800'
                          }`}>
                            {item.priority}优先级
                          </span>
                        )}
                      </div>
                      {item.currentStatus && (
                        <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
                          现状: {item.currentStatus}
                        </p>
                      )}
                      <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
                        {item.recommendation}
                      </p>
                      {item.expectedOutcome && (
                        <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
                          预期: {item.expectedOutcome}
                        </p>
                      )}
                      {item.actionSteps && item.actionSteps.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-purple-900 dark:text-purple-100">行动步骤:</p>
                          <ul className="text-xs text-purple-700 dark:text-purple-300 list-disc list-inside">
                            {item.actionSteps.map((step: string, sIdx: number) => (
                              <li key={sIdx}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 补充剂处方 */}
            {content.supplements && content.supplements.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <span className="text-2xl">💊</span>
                  补充剂处方
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {content.supplements.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                        {item.name}
                      </h4>
                      {item.indication && (
                        <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                          适应症: {item.indication}
                        </p>
                      )}
                      <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                        剂量: {item.dosage}
                      </p>
                      <div className="flex gap-4 text-xs text-amber-700 dark:text-amber-300 mb-2">
                        {item.timing && <span>时间: {item.timing}</span>}
                        {item.duration && <span>周期: {item.duration}</span>}
                      </div>
                      {item.evidence && (
                        <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                          依据: {item.evidence}
                        </p>
                      )}
                      {item.contraindications && item.contraindications.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-red-900 dark:text-red-100">禁忌症:</p>
                          <ul className="text-xs text-red-700 dark:text-red-300 list-disc list-inside">
                            {item.contraindications.map((c: string, cIdx: number) => (
                              <li key={cIdx}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {item.interactions && item.interactions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-orange-900 dark:text-orange-100">药物相互作用:</p>
                          <ul className="text-xs text-orange-700 dark:text-orange-300 list-disc list-inside">
                            {item.interactions.map((i: string, iIdx: number) => (
                              <li key={iIdx}>{i}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 随访计划 */}
            {content.followUpPlan && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🔔</span>
                  随访计划
                </h3>
                {content.followUpPlan.timeline && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>随访时间:</strong> {content.followUpPlan.timeline}
                    </p>
                  </div>
                )}
                {content.followUpPlan.monitoringIndicators && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">监测指标:</p>
                    <div className="flex flex-wrap gap-2">
                      {content.followUpPlan.monitoringIndicators.map((indicator: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-xs">
                          {indicator}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {content.followUpPlan.assessments && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">评估项目:</p>
                    <ul className="text-sm text-zinc-700 dark:text-zinc-300 list-disc list-inside">
                      {content.followUpPlan.assessments.map((a: string, idx: number) => (
                        <li key={idx}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {content.followUpPlan.adjustments && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-sm text-amber-900 dark:text-amber-100">
                      <strong>调整预案:</strong> {content.followUpPlan.adjustments}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ==================== 旧格式：兼容显示 ==================== */}

        {!isNewFormat && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* 饮食建议 */}
            {content.dietaryRecommendations && content.dietaryRecommendations.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🥗</span>
                  饮食建议
                </h3>
                <div className="space-y-4">
                  {content.dietaryRecommendations.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        {item.category}
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                        {item.recommendation}
                      </p>
                      {item.reason && (
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          理由：{item.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 运动建议 */}
            {content.exerciseRecommendations && content.exerciseRecommendations.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🏃</span>
                  运动建议
                </h3>
                <div className="space-y-4">
                  {content.exerciseRecommendations.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                        {item.type}
                      </h4>
                      <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
                        {item.recommendation}
                      </p>
                      <div className="flex gap-4 text-xs text-orange-700 dark:text-orange-300">
                        {item.frequency && <span>频率：{item.frequency}</span>}
                        {item.duration && <span>时长：{item.duration}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!isNewFormat && content.lifestyleChanges && content.lifestyleChanges.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mt-6">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              生活方式调整
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {content.lifestyleChanges.map((item: any, idx: number) => (
                <div key={idx} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                      {item.area}
                    </h4>
                    {item.priority && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority}优先级
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    {item.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isNewFormat && content.supplements && content.supplements.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mt-6">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <span className="text-2xl">💊</span>
              营养补充剂建议
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {content.supplements.map((item: any, idx: number) => (
                <div key={idx} className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                    {item.name}
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                    理由：{item.reason}
                  </p>
                  <div className="flex gap-4 text-xs text-amber-700 dark:text-amber-300">
                    {item.dosage && <span>剂量：{item.dosage}</span>}
                  </div>
                  {item.note && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                      注意：{item.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!isNewFormat && content.followUp && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mt-6">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <span className="text-2xl">🔔</span>
              随访建议
            </h3>
            {content.followUp.recommendations && content.followUp.recommendations.length > 0 && (
              <ul className="list-disc list-inside space-y-2 mb-4">
                {content.followUp.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="text-zinc-700 dark:text-zinc-300">
                    {rec}
                  </li>
                ))}
              </ul>
            )}
            {content.followUp.timeline && (
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  建议随访时间：<span className="font-semibold">{content.followUp.timeline}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => window.print()}
            className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
          >
            打印/导出 PDF
          </button>
          <Link
            href="/recommendations"
            className="flex-1 px-6 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-lg hover:bg-zinc-300 transition-colors text-center"
          >
            返回列表
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function RecommendationDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
          <DashboardNavbar />
          <main className="max-w-6xl mx-auto px-6 py-8">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-8 text-center">
              <div className="text-zinc-500">加载中...</div>
            </div>
          </main>
        </div>
      }
    >
      <RecommendationDetailContent />
    </Suspense>
  );
}
