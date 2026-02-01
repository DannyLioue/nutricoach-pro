'use client';

import { useState } from 'react';
import { Trash2, Sparkles, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { DietAnalysis, DietComplianceEvaluation, PersonalizedRecommendation } from '@/types';

interface DietPhotoCardProps {
  id: string;
  imageUrl: string;
  mealType: string | null;
  notes: string | null;
  analysis: DietAnalysis | DietComplianceEvaluation | null;
  analyzedAt: string | null;
  uploadedAt: string;
  evaluationMode?: 'PREFERENCE' | 'COMPLIANCE';
  onDelete?: () => void;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
}

// 判断是否为合规评估结果
function isComplianceEvaluation(analysis: any): analysis is DietComplianceEvaluation {
  return analysis?.complianceEvaluation !== undefined;
}

export default function DietPhotoCard({
  id,
  imageUrl,
  mealType,
  notes,
  analysis,
  analyzedAt,
  uploadedAt,
  evaluationMode = 'COMPLIANCE',
  onDelete,
  onAnalyze,
  isAnalyzing = false,
}: DietPhotoCardProps) {
  const [imageError, setImageError] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

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

  const isCompliance = evaluationMode === 'COMPLIANCE' && isComplianceEvaluation(analysis);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case '优秀': return 'bg-green-100 text-green-800';
      case '良好': return 'bg-blue-100 text-blue-800';
      case '一般': return 'bg-yellow-100 text-yellow-800';
      case '需改善': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case '高': return 'text-red-600';
      case '中': return 'text-yellow-600';
      case '低': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 图片和操作按钮 */}
      <div className="relative">
        {!imageError ? (
          <img
            src={imageUrl}
            alt="饮食照片"
            className="w-full h-56 object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-56 bg-gray-100 flex items-center justify-center text-gray-400">
            图片加载失败
          </div>
        )}

        {/* 操作按钮 */}
        <div className="absolute top-2 right-2 flex gap-2">
          {!isAnalyzing && onAnalyze && (
            <button
              onClick={onAnalyze}
              className={`${analysis ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-full p-2 transition-colors shadow-md`}
              title={analysis ? "重新分析" : "分析照片"}
            >
              <Sparkles className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-md"
              title="删除照片"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 分析中状态 */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>AI 分析中...</p>
            </div>
          </div>
        )}
      </div>

      {/* 照片信息 */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{formatDate(uploadedAt)}</span>
            {mealType && (
              <>
                <span>·</span>
                <span className="font-medium">{mealType}</span>
              </>
            )}
          </div>
        </div>

        {notes && (
          <p className="text-sm text-gray-500 mb-3 italic">"{notes}"</p>
        )}

        {/* 分析结果 */}
        {analysis ? (
          <div className="space-y-3 border-t pt-3">
            {isCompliance ? (
              // ==================== 合规评估显示 ====================
              <div className="space-y-3">
                {/* 综合评分 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.complianceEvaluation.overallScore)}`}>
                      {(analysis as DietComplianceEvaluation).complianceEvaluation.overallScore}分
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(analysis.complianceEvaluation.overallRating)}`}>
                      {analysis.complianceEvaluation.overallRating}
                    </span>
                  </div>
                  {analyzedAt && (
                    <span className="text-xs text-gray-400">
                      {formatDate(analyzedAt)}
                    </span>
                  )}
                </div>

                {/* 交通灯汇总 */}
                <div className="flex gap-2 text-xs">
                  {(analysis as DietComplianceEvaluation).complianceEvaluation.foodTrafficLightCompliance.redFoods.length > 0 && (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {(analysis as DietComplianceEvaluation).complianceEvaluation.foodTrafficLightCompliance.redFoods.length} 个红灯食物
                    </span>
                  )}
                  {(analysis as DietComplianceEvaluation).complianceEvaluation.foodTrafficLightCompliance.greenFoods.length > 0 && (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {(analysis as DietComplianceEvaluation).complianceEvaluation.foodTrafficLightCompliance.greenFoods.length} 个绿灯食物
                    </span>
                  )}
                </div>

                {/* 高优先级建议 */}
                {(analysis as DietComplianceEvaluation).improvementSuggestions.priority === 'high' && (
                  <div className="bg-red-50 p-2 rounded text-xs">
                    <p className="font-medium text-red-700 mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      高优先级改进建议：
                    </p>
                    <div className="space-y-1">
                      {(analysis as DietComplianceEvaluation).improvementSuggestions.removals.slice(0, 2).map((r, i) => (
                        <p key={i} className="text-red-600">
                          • 移除 {r.food}: {r.reason}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* 个性化建议 */}
                {(analysis as DietComplianceEvaluation).personalizedRecommendations && (analysis as DietComplianceEvaluation).personalizedRecommendations!.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                    <h5 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      针对您的个性化建议
                    </h5>
                    <div className="space-y-2">
                      {(analysis as DietComplianceEvaluation).personalizedRecommendations!.map((rec: PersonalizedRecommendation, idx: number) => {
                        const categoryConfig: Record<string, { color: string; icon: string; label: string; bgColor: string }> = {
                          'health-concern': { color: 'red', icon: '⚠️', label: '健康问题', bgColor: 'bg-red-50 border-red-200' },
                          'user-requirement': { color: 'purple', icon: '🎯', label: '个人需求', bgColor: 'bg-purple-50 border-purple-200' },
                          'nutrition-balance': { color: 'orange', icon: '🥗', label: '营养平衡', bgColor: 'bg-orange-50 border-orange-200' }
                        };
                        const config = categoryConfig[rec.category] || categoryConfig['nutrition-balance'];

                        return (
                          <div key={idx} className={`border rounded-lg p-2 ${config.bgColor}`}>
                            <div className="flex items-start gap-2">
                              <span className="text-lg">{config.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white bg-opacity-60">
                                    {config.label}
                                  </span>
                                  {rec.priority === 'high' && (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                                      重要
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-medium text-gray-800 mb-1">
                                  {rec.recommendation}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {rec.reason}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 可展开的详细信息 */}
                <div className="space-y-2">
                  {/* 热量和营养素匹配 */}
                  <CollapsibleSection
                    title="热量与营养素"
                    isExpanded={expandedSections.has('macros')}
                    onToggle={() => toggleSection('macros')}
                  >
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">热量</span>
                        <span className="font-medium">
                          {(analysis as DietComplianceEvaluation).complianceEvaluation.calorieMatch.estimatedCalories} /
                          {(analysis as DietComplianceEvaluation).complianceEvaluation.calorieMatch.targetCalories} kcal
                          <span className={`ml-1 px-1 rounded ${
                            (analysis as DietComplianceEvaluation).complianceEvaluation.calorieMatch.status === 'within' ? 'bg-green-100 text-green-700' :
                            (analysis as DietComplianceEvaluation).complianceEvaluation.calorieMatch.status === 'under' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {(analysis as DietComplianceEvaluation).complianceEvaluation.calorieMatch.status === 'within' ? '✓' :
                             (analysis as DietComplianceEvaluation).complianceEvaluation.calorieMatch.status === 'under' ? '偏低' : '偏高'}
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">蛋白质</span>
                        <span className="font-medium">
                          {(analysis as DietComplianceEvaluation).complianceEvaluation.macroMatch.protein.actual}g /
                          {(analysis as DietComplianceEvaluation).complianceEvaluation.macroMatch.protein.target}g
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">碳水</span>
                        <span className="font-medium">
                          {(analysis as DietComplianceEvaluation).complianceEvaluation.macroMatch.carbs.actual}g /
                          {(analysis as DietComplianceEvaluation).complianceEvaluation.macroMatch.carbs.target}g
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">脂肪</span>
                        <span className="font-medium">
                          {(analysis as DietComplianceEvaluation).complianceEvaluation.macroMatch.fat.actual}g /
                          {(analysis as DietComplianceEvaluation).complianceEvaluation.macroMatch.fat.target}g
                        </span>
                      </div>
                    </div>
                  </CollapsibleSection>

                  {/* 改进建议详情 */}
                  <CollapsibleSection
                    title="改进建议"
                    isExpanded={expandedSections.has('suggestions')}
                    onToggle={() => toggleSection('suggestions')}
                  >
                    <div className="space-y-2 text-xs">
                      {(analysis as DietComplianceEvaluation).improvementSuggestions.additions.length > 0 && (
                        <div>
                          <p className="font-medium text-green-700 mb-1">建议添加：</p>
                          {(analysis as DietComplianceEvaluation).improvementSuggestions.additions.map((a, i) => (
                            <div key={i} className="mb-1">
                              <p className="text-gray-800 font-medium">• {a.food}</p>
                              <p className="text-gray-600 ml-4">{a.reason}</p>
                              {a.amount && <p className="text-gray-500 ml-4 text-xs">建议分量: {a.amount}</p>}
                              {a.targetMeal && <p className="text-gray-500 ml-4 text-xs">建议时机: {a.targetMeal}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                      {(analysis as DietComplianceEvaluation).improvementSuggestions.modifications.length > 0 && (
                        <div>
                          <p className="font-medium text-yellow-700 mb-1">建议修改：</p>
                          {(analysis as DietComplianceEvaluation).improvementSuggestions.modifications.map((m, i) => (
                            <div key={i} className="mb-1">
                              <p className="text-gray-800 font-medium">• {m.food}</p>
                              <p className="text-gray-600 ml-4">改为: {m.suggestedChange}</p>
                              {m.reason && <p className="text-gray-500 ml-4 italic">原因: {m.reason}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>
                </div>

                {/* 食物清单 */}
                {(analysis as DietComplianceEvaluation).foods && (analysis as DietComplianceEvaluation).foods.length > 0 && (
                  <div className="text-xs">
                    <p className="text-gray-500 mb-1">识别的食物：</p>
                    <div className="flex flex-wrap gap-1">
                      {(analysis as DietComplianceEvaluation).foods.map((food, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                        >
                          {food.name}
                          <span className="text-gray-400 text-[10px]">({food.portion})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // ==================== 传统分析显示 ====================
              <div className="space-y-3">
                {/* 综合评分 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${getScoreColor((analysis as DietAnalysis).overallScore)}`}>
                      {(analysis as DietAnalysis).overallScore}分
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor((analysis as DietAnalysis).overallRating)}`}>
                      {(analysis as DietAnalysis).overallRating}
                    </span>
                  </div>
                  {analyzedAt && (
                    <span className="text-xs text-gray-400">
                      {formatDate(analyzedAt)}
                    </span>
                  )}
                </div>

                {/* 识别的餐型 */}
                {(analysis as DietAnalysis).mealType && (
                  <div className="text-sm">
                    <span className="text-gray-500">识别为：</span>
                    <span className="font-medium">{(analysis as DietAnalysis).mealType}</span>
                  </div>
                )}

                {/* 营养均衡状态 */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                    <span className="text-gray-600">蛋白质</span>
                    <span className={`font-medium ${
                      (analysis as DietAnalysis).nutritionBalance.protein === '充足' ? 'text-green-600' :
                      (analysis as DietAnalysis).nutritionBalance.protein === '不足' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {(analysis as DietAnalysis).nutritionBalance.protein}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                    <span className="text-gray-600">蔬菜</span>
                    <span className={`font-medium ${
                      (analysis as DietAnalysis).nutritionBalance.vegetables === '充足' ? 'text-green-600' :
                      (analysis as DietAnalysis).nutritionBalance.vegetables === '不足' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {(analysis as DietAnalysis).nutritionBalance.vegetables}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                    <span className="text-gray-600">脂肪</span>
                    <span className="font-medium text-gray-700">
                      {(analysis as DietAnalysis).nutritionBalance.fat}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                    <span className="text-gray-600">纤维</span>
                    <span className={`font-medium ${
                      (analysis as DietAnalysis).nutritionBalance.fiber === '充足' ? 'text-green-600' :
                      (analysis as DietAnalysis).nutritionBalance.fiber === '不足' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {(analysis as DietAnalysis).nutritionBalance.fiber}
                    </span>
                  </div>
                </div>

                {/* 主要问题 */}
                {(analysis as DietAnalysis).issues && (analysis as DietAnalysis).issues.length > 0 && (
                  <div className="space-y-1">
                    {(analysis as DietAnalysis).issues.slice(0, 2).map((issue, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className={`font-medium ${getSeverityColor(issue.severity)}`}>
                          [{issue.severity}]
                        </span>
                        <span className="text-gray-700">{issue.description}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 食物清单 */}
                {(analysis as DietAnalysis).foods && (analysis as DietAnalysis).foods.length > 0 && (
                  <div className="text-xs">
                    <p className="text-gray-500 mb-1">食物清单：</p>
                    <div className="flex flex-wrap gap-1">
                      {(analysis as DietAnalysis).foods.map((food, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                        >
                          {food.name}
                          <span className="text-gray-400 text-[10px]">({food.portion})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="border-t pt-3 text-center">
            {isAnalyzing ? (
              <p className="text-sm text-gray-500">AI 分析中...</p>
            ) : (
              <p className="text-sm text-gray-400">点击上方按钮开始分析</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 可折叠区域组件
interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, isExpanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="border border-gray-200 rounded">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {title}
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {isExpanded && (
        <div className="px-3 pb-2 pt-1 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}
