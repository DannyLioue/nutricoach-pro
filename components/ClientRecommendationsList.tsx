'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Apple, Dumbbell, Heart, Trash2, Plus, Loader2 } from 'lucide-react';

interface Recommendation {
  id: string;
  type: 'COMPREHENSIVE' | 'DIET' | 'EXERCISE' | 'LIFESTYLE';
  content: {
    summary?: string;
    dailyTargets?: any;
    trafficLightFoods?: any;
    oneDayMealPlan?: any;
    exercisePrescription?: any;
    lifestyleModifications?: any;
  };
  generatedAt: string;
  report: {
    id: string;
    fileName: string;
    uploadedAt: string;
    analysis: {
      healthScore?: number;
    } | null;
  } | null;
}

interface ClientRecommendationsListProps {
  clientId: string;
}

export default function ClientRecommendationsList({ clientId }: ClientRecommendationsListProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [clientId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/clients/${clientId}/recommendations`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '获取建议列表失败');
      }

      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      console.error('获取建议列表失败:', err);
      setError(err.message || '获取建议列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recommendationId: string) => {
    try {
      const res = await fetch(`/api/recommendations/${recommendationId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '删除失败');
      }

      setRecommendations(recommendations.filter(r => r.id !== recommendationId));
      setDeleteConfirm(null);
    } catch (err: any) {
      alert('删除失败：' + err.message);
    }
  };

  const getTypeConfig = (type: string) => {
    const configs = {
      COMPREHENSIVE: {
        label: '综合方案',
        icon: BookOpen,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        borderColor: 'border-purple-200 dark:border-purple-800',
      },
      DIET: {
        label: '饮食建议',
        icon: Apple,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
      },
      EXERCISE: {
        label: '运动处方',
        icon: Dumbbell,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
      },
      LIFESTYLE: {
        label: '生活方式',
        icon: Heart,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50 dark:bg-pink-900/20',
        borderColor: 'border-pink-200 dark:border-pink-800',
      },
    };
    return configs[type as keyof typeof configs] || configs.COMPREHENSIVE;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={fetchRecommendations}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen size={48} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          暂无干预方案
        </h3>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          基于体检报告为客户生成专业的营养干预方案
        </p>
        <Link
          href={`/recommendations/new?clientId=${clientId}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          生成第一份方案
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 头部操作 */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-zinc-700 dark:text-zinc-300">
          已生成方案 ({recommendations.length})
        </h4>
        <Link
          href={`/recommendations/new?clientId=${clientId}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          生成新方案
        </Link>
      </div>

      {/* 方案列表 */}
      <div className="space-y-3">
        {recommendations.map((rec) => {
          const typeConfig = getTypeConfig(rec.type);
          const Icon = typeConfig.icon;

          return (
            <div
              key={rec.id}
              className={`bg-white dark:bg-zinc-800 rounded-lg p-4 border ${typeConfig.borderColor} hover:border-opacity-80 transition-colors`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* 方案信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded ${typeConfig.bgColor} ${typeConfig.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig.bgColor} ${typeConfig.color}`}>
                      {typeConfig.label}
                    </span>
                    {rec.type === 'COMPREHENSIVE' && (
                      <span className="ml-auto px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        推荐
                      </span>
                    )}
                  </div>

                  {rec.content.summary && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-2">
                      {rec.content.summary}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-500">
                    <span>{formatDate(rec.generatedAt)}</span>
                    {rec.report && (
                      <>
                        <span>·</span>
                        <span>基于: {rec.report.fileName}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/recommendations/${rec.id}`}
                    className="px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    查看
                  </Link>
                  {deleteConfirm === rec.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(rec.id)}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      >
                        确认删除
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-zinc-200 hover:bg-zinc-300 rounded-lg transition-colors"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(rec.id)}
                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="删除方案"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部提示 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="p-1 bg-blue-600 rounded">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              综合方案优先
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              综合方案包含饮食、运动、生活方式全方位建议，建议优先查看和使用。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
