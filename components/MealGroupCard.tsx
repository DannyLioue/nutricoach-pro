'use client';

import { useState } from 'react';
import { Trash2, BarChart3, ChevronDown, ChevronUp, Calendar, AlertCircle, Copy } from 'lucide-react';
import type { DietPhotoMealGroup, DietPhotoInGroup } from '@/types';

interface MealGroupCardProps {
  mealGroup: DietPhotoMealGroup;
  clientId: string;
  onAnalyze?: (groupId: string) => Promise<void>;
  onDelete?: (groupId: string) => Promise<void>;
  onCopy?: (groupId: string) => void;
  onPhotoClick?: (photo: DietPhotoInGroup) => void;
}

export default function MealGroupCard({
  mealGroup,
  clientId,
  onAnalyze,
  onDelete,
  onCopy,
  onPhotoClick,
}: MealGroupCardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Debug: log the first photo's imageUrl
  if (mealGroup.photos.length > 0) {
    const firstPhoto = mealGroup.photos[0];
    console.log('First photo debug:', {
      id: firstPhoto.id,
      imageUrlLength: firstPhoto.imageUrl?.length,
      imageUrlStart: firstPhoto.imageUrl?.substring(0, 50),
    });
  }
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleAnalyze = async () => {
    if (!onAnalyze || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      await onAnalyze(mealGroup.id);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;
    if (!confirm(`确定要删除食谱组"${mealGroup.name}"吗？此操作不可恢复。`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(mealGroup.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case '优秀':
        return 'text-green-600 bg-green-50 border-green-200';
      case '良好':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case '一般':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case '需改善':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRatingBgColor = (rating: string) => {
    switch (rating) {
      case '优秀':
        return 'bg-green-500';
      case '良好':
        return 'bg-blue-500';
      case '一般':
        return 'bg-yellow-500';
      case '需改善':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const hasAnalysis = mealGroup.combinedAnalysis !== null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 头部信息 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">{mealGroup.name}</h3>
              {mealGroup.overallRating && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRatingColor(mealGroup.overallRating)}`}>
                  {mealGroup.overallRating}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{mealGroup.date}</span>
              </div>
              {mealGroup.mealType && (
                <>
                  <span>·</span>
                  <span>{mealGroup.mealType}</span>
                </>
              )}
              <span>·</span>
              <span>{mealGroup.photos.length} 张照片</span>
            </div>
          </div>

          {/* 评分圆环 */}
          {mealGroup.totalScore !== null && (
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full ${getRatingBgColor(mealGroup.overallRating || '')} flex items-center justify-center text-white font-bold text-xl`}>
                {mealGroup.totalScore}
              </div>
              <span className="text-xs text-gray-500 mt-1">综合评分</span>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || mealGroup.photos.length === 0}
            className={`px-4 py-2 ${
              hasAnalysis
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm`}
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                分析中...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4" />
                {hasAnalysis ? '重新分析' : '分析食谱组'}
              </>
            )}
          </button>
          {onCopy && (
            <button
              onClick={() => onCopy(mealGroup.id)}
              className="px-4 py-2 border border-purple-300 text-purple-600 rounded-md hover:bg-purple-50 transition-colors flex items-center gap-2 text-sm"
              title="复制食谱组"
            >
              <Copy className="h-4 w-4" />
              复制
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                删除中...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                删除
              </>
            )}
          </button>
        </div>

        {mealGroup.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">{mealGroup.notes}</p>
          </div>
        )}
      </div>

      {/* 综合分析结果 */}
      {hasAnalysis && mealGroup.combinedAnalysis && (
        <div className="border-b border-gray-200">
          {/* 营养素平衡概览 */}
          {expandedSections.has('summary') && mealGroup.combinedAnalysis.nutritionSummary && (
            <div className="p-6 bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">营养素平衡评估</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* 蛋白质 */}
                <div className={`text-center p-3 rounded-lg ${
                  mealGroup.combinedAnalysis.nutritionSummary.protein === '充足'
                    ? 'bg-green-50 border border-green-200'
                    : mealGroup.combinedAnalysis.nutritionSummary.protein === '不足'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="text-2xl mb-1">🥩</div>
                  <div className="text-xs font-medium text-gray-700 mb-1">蛋白质</div>
                  <div className={`text-sm font-semibold ${
                    mealGroup.combinedAnalysis.nutritionSummary.protein === '充足'
                      ? 'text-green-700'
                      : mealGroup.combinedAnalysis.nutritionSummary.protein === '不足'
                      ? 'text-yellow-700'
                      : 'text-red-700'
                  }`}>
                    {mealGroup.combinedAnalysis.nutritionSummary.protein}
                  </div>
                </div>

                {/* 蔬菜 */}
                <div className={`text-center p-3 rounded-lg ${
                  mealGroup.combinedAnalysis.nutritionSummary.vegetables === '充足'
                    ? 'bg-green-50 border border-green-200'
                    : mealGroup.combinedAnalysis.nutritionSummary.vegetables === '不足'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="text-2xl mb-1">🥬</div>
                  <div className="text-xs font-medium text-gray-700 mb-1">蔬菜</div>
                  <div className={`text-sm font-semibold ${
                    mealGroup.combinedAnalysis.nutritionSummary.vegetables === '充足'
                      ? 'text-green-700'
                      : mealGroup.combinedAnalysis.nutritionSummary.vegetables === '不足'
                      ? 'text-yellow-700'
                      : 'text-red-700'
                  }`}>
                    {mealGroup.combinedAnalysis.nutritionSummary.vegetables}
                  </div>
                </div>

                {/* 碳水 */}
                <div className={`text-center p-3 rounded-lg ${
                  mealGroup.combinedAnalysis.nutritionSummary.carbs === '充足'
                    ? 'bg-green-50 border border-green-200'
                    : mealGroup.combinedAnalysis.nutritionSummary.carbs === '不足'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="text-2xl mb-1">🍚</div>
                  <div className="text-xs font-medium text-gray-700 mb-1">碳水</div>
                  <div className={`text-sm font-semibold ${
                    mealGroup.combinedAnalysis.nutritionSummary.carbs === '充足'
                      ? 'text-green-700'
                      : mealGroup.combinedAnalysis.nutritionSummary.carbs === '不足'
                      ? 'text-yellow-700'
                      : 'text-red-700'
                  }`}>
                    {mealGroup.combinedAnalysis.nutritionSummary.carbs}
                  </div>
                </div>

                {/* 脂肪 */}
                <div className={`text-center p-3 rounded-lg ${
                  mealGroup.combinedAnalysis.nutritionSummary.fat === '充足'
                    ? 'bg-green-50 border border-green-200'
                    : mealGroup.combinedAnalysis.nutritionSummary.fat === '不足'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="text-2xl mb-1">🥑</div>
                  <div className="text-xs font-medium text-gray-700 mb-1">脂肪</div>
                  <div className={`text-sm font-semibold ${
                    mealGroup.combinedAnalysis.nutritionSummary.fat === '充足'
                      ? 'text-green-700'
                      : mealGroup.combinedAnalysis.nutritionSummary.fat === '不足'
                      ? 'text-yellow-700'
                      : 'text-red-700'
                  }`}>
                    {mealGroup.combinedAnalysis.nutritionSummary.fat}
                  </div>
                </div>

                {/* 膳食纤维 */}
                <div className={`text-center p-3 rounded-lg ${
                  mealGroup.combinedAnalysis.nutritionSummary.fiber === '充足'
                    ? 'bg-green-50 border border-green-200'
                    : mealGroup.combinedAnalysis.nutritionSummary.fiber === '不足'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="text-2xl mb-1">🌾</div>
                  <div className="text-xs font-medium text-gray-700 mb-1">纤维</div>
                  <div className={`text-sm font-semibold ${
                    mealGroup.combinedAnalysis.nutritionSummary.fiber === '充足'
                      ? 'text-green-700'
                      : mealGroup.combinedAnalysis.nutritionSummary.fiber === '不足'
                      ? 'text-yellow-700'
                      : 'text-red-700'
                  }`}>
                    {mealGroup.combinedAnalysis.nutritionSummary.fiber}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 红绿灯食物汇总 */}
          {expandedSections.has('summary') && (
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">食物分类汇总</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 绿灯食物 */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-green-800 mb-2">✅ 绿灯食物</h5>
                  <div className="flex flex-wrap gap-1">
                    {mealGroup.combinedAnalysis.summary.greenFoods.length > 0 ? (
                      mealGroup.combinedAnalysis.summary.greenFoods.map((food, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                        >
                          {food}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">无</span>
                    )}
                  </div>
                </div>

                {/* 黄灯食物 */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-yellow-800 mb-2">⚠️ 黄灯食物</h5>
                  <div className="flex flex-wrap gap-1">
                    {mealGroup.combinedAnalysis.summary.yellowFoods.length > 0 ? (
                      mealGroup.combinedAnalysis.summary.yellowFoods.map((food, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded"
                        >
                          {food}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">无</span>
                    )}
                  </div>
                </div>

                {/* 红灯食物 */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-red-800 mb-2">🚫 红灯食物</h5>
                  <div className="flex flex-wrap gap-1">
                    {mealGroup.combinedAnalysis.summary.redFoods.length > 0 ? (
                      mealGroup.combinedAnalysis.summary.redFoods.map((food, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded"
                        >
                          {food}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">无</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 改进建议 */}
          {expandedSections.has('recommendations') && (
            <div className="p-6">
              <div
                className="flex items-center justify-between cursor-pointer mb-4"
                onClick={() => toggleSection('recommendations')}
              >
                <h4 className="text-sm font-semibold text-gray-700">综合改进建议</h4>
                {expandedSections.has('recommendations') ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>

              <div className="space-y-4">
                {/* 个性化建议 - 基于客户健康问题和需求 */}
                {mealGroup.combinedAnalysis.recommendations.personalized &&
                  mealGroup.combinedAnalysis.recommendations.personalized.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-blue-600 rounded-full">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118-2.592l-2.8-2.034a1 1 0 00-.364-1.118L11.03 6.72c.783-.57.783-1.81-.588-1.81l1.07-3.292a1 1 0 00-.95-.69H7.645c-.969 0-1.371-1.24-.588-1.81l2.8-2.034a1 1 0 00.364-1.118L8.476 2.927c-.3-.921-1.603-.921-1.902 0z" />
                        </svg>
                      </div>
                      <h5 className="text-sm font-bold text-blue-900">针对您的个性化建议</h5>
                    </div>
                    <div className="space-y-3">
                      {mealGroup.combinedAnalysis.recommendations.personalized.map((rec, idx) => {
                        const categoryConfig = {
                          'health-concern': {
                            color: 'red',
                            bgColor: 'bg-red-50',
                            borderColor: 'border-red-200',
                            label: '健康问题',
                            icon: '⚠️'
                          },
                          'user-requirement': {
                            color: 'purple',
                            bgColor: 'bg-purple-50',
                            borderColor: 'border-purple-200',
                            label: '个人需求',
                            icon: '🎯'
                          },
                          'nutrition-balance': {
                            color: 'orange',
                            bgColor: 'bg-orange-50',
                            borderColor: 'border-orange-200',
                            label: '营养平衡',
                            icon: '🥗'
                          }
                        };
                        const config = categoryConfig[rec.category];
                        return (
                          <div key={idx} className={`${config.bgColor} ${config.borderColor} border rounded-lg p-3`}>
                            <div className="flex items-start gap-2">
                              <span className="text-lg">{config.icon}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded bg-white text-${config.color}-700`}>
                                    {config.label}
                                  </span>
                                  {rec.priority === 'high' && (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">重要</span>
                                  )}
                                </div>
                                <div className={`text-sm font-medium text-${config.color}-900 mb-1`}>
                                  {rec.recommendation}
                                </div>
                                <div className={`text-xs text-${config.color}-700`}>
                                  {rec.reason}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 饮食调整建议 */}
                {mealGroup.combinedAnalysis.recommendations.general && (
                  <>
                    {/* 需要移除的食物 */}
                    {mealGroup.combinedAnalysis.recommendations.general.removals.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-red-800 mb-3">❌ 需要移除的食物</h5>
                        <div className="space-y-2">
                          {mealGroup.combinedAnalysis.recommendations.general.removals.map((item, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium text-red-700">{item.food}</span>
                              <span className="text-red-600 ml-2">- {item.reason}</span>
                              {item.alternatives && item.alternatives.length > 0 && (
                                <div className="mt-1 text-xs text-red-500">
                                  替代：{item.alternatives.join('、')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 需要添加的食物 */}
                    {mealGroup.combinedAnalysis.recommendations.general.additions.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-green-800 mb-3">➕ 需要添加的食物</h5>
                        <div className="space-y-2">
                          {mealGroup.combinedAnalysis.recommendations.general.additions.map((item, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium text-green-700">{item.food}</span>
                              <span className="text-green-600 ml-2">- {item.reason}</span>
                              <div className="mt-1 text-xs text-green-500">
                                建议：{item.amount}，适合{item.targetMeal}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 需要修改的食物 */}
                    {mealGroup.combinedAnalysis.recommendations.general.modifications.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-yellow-800 mb-3">🔄 需要修改的食物</h5>
                        <div className="space-y-2">
                          {mealGroup.combinedAnalysis.recommendations.general.modifications.map((item, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium text-yellow-700">{item.food}</span>
                              <div className="text-yellow-600 mt-1">
                                问题：{item.currentIssue}
                              </div>
                              <div className="text-yellow-600">
                                建议：{item.suggestedChange}
                              </div>
                              <div className="text-xs text-yellow-500 mt-1">
                                理由：{item.reason}
                              </div>
                            </div>
                          ))}
                    </div>
                  </div>
                )}
                </>
                )}

                {/* 空状态提示 */}
                {(!mealGroup.combinedAnalysis.recommendations.personalized ||
                  mealGroup.combinedAnalysis.recommendations.personalized.length === 0) &&
                 (!mealGroup.combinedAnalysis.recommendations.general ||
                  (mealGroup.combinedAnalysis.recommendations.general.removals.length === 0 &&
                   mealGroup.combinedAnalysis.recommendations.general.additions.length === 0 &&
                   mealGroup.combinedAnalysis.recommendations.general.modifications.length === 0)) && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">暂无改进建议，饮食结构良好！</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 统计信息 */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span>分析照片：{mealGroup.combinedAnalysis.analyzedPhotos}/{mealGroup.combinedAnalysis.totalPhotos}</span>
              <span>平均分：{mealGroup.combinedAnalysis.avgScore}</span>
              <span>综合评级：{mealGroup.combinedAnalysis.overallRating}</span>
            </div>
          </div>
        </div>
      )}

      {/* 照片列表 */}
      <div className="p-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">照片详情</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mealGroup.photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => onPhotoClick?.(photo)}
              className="relative group cursor-pointer border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
            >
              {/* 图片 */}
              <img
                src={photo.imageUrl}
                alt={photo.notes || '照片'}
                className="w-full h-32 object-cover"
                onError={(e) => {
                  console.error('Image load error:', photo.id, 'src length:', photo.imageUrl?.length);
                  console.error('Image src start:', photo.imageUrl?.substring(0, 100));
                  (e.target as HTMLImageElement).style.backgroundColor = '#fee';
                }}
                onLoad={(e) => {
                  console.log('Image loaded successfully:', photo.id, 'src length:', photo.imageUrl?.length);
                }}
              />

              {/* 标签 */}
              <div className="p-2 bg-white">
                {photo.mealType && (
                  <div className="text-xs font-medium text-gray-700 mb-1">{photo.mealType}</div>
                )}
                {photo.notes && (
                  <div className="text-xs text-gray-500 truncate">{photo.notes}</div>
                )}
                {photo.analysis && (
                  <div className="mt-1 text-xs">
                    <span className={`px-2 py-0.5 rounded ${
                      photo.analysis.complianceEvaluation?.overallScore >= 80
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {photo.analysis.complianceEvaluation?.overallScore
                        ? `${photo.analysis.complianceEvaluation.overallScore}分`
                        : '未分析'}
                    </span>
                  </div>
                )}
              </div>

              {/* 悬停效果 - 已禁用用于测试 */}
              {/* <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" /> */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
