'use client';

import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

interface DietAnalysisSummaryProps {
  clientId: string;
}

interface SummaryData {
  summary: {
    totalPhotos: number;
    analyzedPhotos: number;
    overallScore: number;
  };
  preferences: {
    preferredFoods: string[];
    avoidedFoods: string[];
    cookingMethods: string[];
    mealPatterns: string[];
  };
  habits: {
    issues: string[];
    strengths: string[];
    recommendations: string[];
  };
}

export default function DietAnalysisSummary({ clientId }: DietAnalysisSummaryProps) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/diet-analysis`);
      if (!response.ok) {
        throw new Error('获取分析汇总失败');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <p className="text-red-600">加载失败：{error}</p>
      </div>
    );
  }

  if (!data || data.summary.analyzedPhotos === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">饮食偏好汇总</h3>
        <p className="text-gray-500 text-sm">
          暂无分析数据，上传并分析饮食照片后将在此显示综合分析结果。
        </p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '优秀';
    if (score >= 60) return '良好';
    if (score >= 40) return '一般';
    return '需改善';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">饮食偏好汇总</h3>

      {/* 综合评分 */}
      <div className={`flex items-center justify-between p-4 rounded-lg ${getScoreColor(data.summary.overallScore)}`}>
        <div>
          <p className="text-sm opacity-75">综合评分</p>
          <p className="text-3xl font-bold">{data.summary.overallScore}分</p>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-75">评级</p>
          <p className="text-xl font-semibold">{getScoreLabel(data.summary.overallScore)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-75">已分析照片</p>
          <p className="text-xl font-semibold">{data.summary.analyzedPhotos}张</p>
        </div>
      </div>

      {/* 饮食偏好 */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          饮食偏好
        </h4>

        {/* 偏好的食物 */}
        {data.preferences.preferredFoods.length > 0 && (
          <div className="pl-7">
            <p className="text-sm text-gray-600 mb-2">常吃的食物：</p>
            <div className="flex flex-wrap gap-2">
              {data.preferences.preferredFoods.map((food, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
                >
                  <TrendingUp className="h-3 w-3" />
                  {food}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 烹饪方式 */}
        {data.preferences.cookingMethods.length > 0 && (
          <div className="pl-7">
            <p className="text-sm text-gray-600 mb-2">常用烹饪方式：</p>
            <div className="flex flex-wrap gap-2">
              {data.preferences.cookingMethods.map((method, idx) => (
                <span
                  key={idx}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 用餐模式 */}
        {data.preferences.mealPatterns.length > 0 && (
          <div className="pl-7">
            <p className="text-sm text-gray-600 mb-2">用餐模式：</p>
            <div className="flex flex-wrap gap-2">
              {data.preferences.mealPatterns.map((pattern, idx) => (
                <span
                  key={idx}
                  className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                >
                  {pattern}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 潜在问题 */}
      {data.habits.issues.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            需要注意的问题
          </h4>
          <div className="pl-7 space-y-2">
            {data.habits.issues.map((issue, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm"
              >
                <TrendingDown className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{issue}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 优点 */}
      {data.habits.strengths.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            饮食优点
          </h4>
          <div className="pl-7 space-y-2">
            {data.habits.strengths.map((strength, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm"
              >
                <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{strength}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 改进建议 */}
      {data.habits.recommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            改进建议
          </h4>
          <div className="pl-7 space-y-2">
            {data.habits.recommendations.map((recommendation, idx) => (
              <div
                key={idx}
                className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm"
              >
                {recommendation}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 统计信息 */}
      <div className="pt-4 border-t text-xs text-gray-500">
        <p>基于 {data.summary.totalPhotos} 张照片的分析结果</p>
      </div>
    </div>
  );
}
