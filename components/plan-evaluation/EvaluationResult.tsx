'use client';

import { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, AlertCircle, RotateCcw, Apple, Dumbbell, Download, Loader2, FileText, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Concern, Suggestion } from '@/types';

interface EvaluationResultProps {
  evaluation: {
    id?: string;
    planType?: 'diet' | 'exercise';
    overallStatus: 'safe' | 'needs_adjustment' | 'unsafe';
    safetyScore: number;
    summary: string;
    keyFindings: string[];
    concerns: Concern[];
    suggestions: Suggestion[];
    optimizedPlan?: any;
  };
  onReEvaluate?: () => void;
  clientId?: string;
}

export function EvaluationResult({ evaluation, onReEvaluate, clientId }: EvaluationResultProps) {
  const [exporting, setExporting] = useState(false);
  const [exportingOptimized, setExportingOptimized] = useState(false);

  const handleExportPDF = async () => {
    if (!evaluation.id) {
      alert('无法导出：缺少评估记录 ID');
      return;
    }

    if (!clientId) {
      alert('无法导出：缺少客户 ID');
      return;
    }

    setExporting(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/plan-evaluations/${evaluation.id}/export`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '导出失败');
      }

      // 下载 PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `评估报告-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('导出失败:', error);
      alert(error instanceof Error ? error.message : '导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  const handleExportOptimizedPlan = async () => {
    if (!evaluation.id) {
      alert('无法导出：缺少评估记录 ID');
      return;
    }

    if (!clientId) {
      alert('无法导出：缺少客户 ID');
      return;
    }

    if (!evaluation.optimizedPlan) {
      alert('暂无优化方案');
      return;
    }

    setExportingOptimized(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/plan-evaluations/${evaluation.id}/export/optimized`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '导出失败');
      }

      // 下载 PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `优化方案-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('导出失败:', error);
      alert(error instanceof Error ? error.message : '导出失败，请稍后重试');
    } finally {
      setExportingOptimized(false);
    }
  };
  const statusConfig = {
    safe: {
      label: '安全',
      color: 'bg-green-500',
      icon: CheckCircle2,
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
    },
    needs_adjustment: {
      label: '需调整',
      color: 'bg-yellow-500',
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200',
    },
    unsafe: {
      label: '不安全',
      color: 'bg-red-500',
      icon: XCircle,
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
    },
  };

  const config = statusConfig[evaluation.overallStatus];
  const StatusIcon = config.icon;

  // 按类别分组 concerns 和 suggestions
  const dietConcerns = evaluation.concerns.filter(c => c.category === 'diet' || c.category === 'supplement');
  const exerciseConcerns = evaluation.concerns.filter(c => c.category === 'exercise');
  const lifestyleConcerns = evaluation.concerns.filter(c => c.category === 'lifestyle');

  const allSuggestions = evaluation.suggestions;

  // 如果指定了 planType，只显示相关的内容
  const isSingleType = evaluation.planType === 'diet' || evaluation.planType === 'exercise';
  const showSingleType = isSingleType && evaluation.planType === 'diet'
    ? dietConcerns.length > 0
    : isSingleType && evaluation.planType === 'exercise'
    ? exerciseConcerns.length > 0
    : false;

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <div className="flex justify-end gap-2 flex-wrap">
        {evaluation.id && (
          <Button
            onClick={handleExportPDF}
            variant="outline"
            size="sm"
            disabled={exporting}
            className="gap-2"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {exporting ? '导出中...' : '导出评估报告'}
          </Button>
        )}
        {evaluation.id && evaluation.optimizedPlan && (
          <Button
            onClick={handleExportOptimizedPlan}
            variant="outline"
            size="sm"
            disabled={exportingOptimized}
            className="gap-2 border-green-500 text-green-700 hover:bg-green-50"
          >
            {exportingOptimized ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {exportingOptimized ? '导出中...' : '导出优化方案'}
          </Button>
        )}
        {onReEvaluate && (
          <Button
            onClick={onReEvaluate}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重新评估
          </Button>
        )}
      </div>

      {/* 整体状态 */}
      <Card className={`${config.bgColor} ${config.borderColor} border`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={config.textColor}>
              评估结果
              {evaluation.planType && (
                <span className="ml-2 text-sm font-normal">
                  · {evaluation.planType === 'diet' ? '饮食计划' : '运动计划'}
                </span>
              )}
            </CardTitle>
            <Badge className={config.color}>
              <StatusIcon className="w-4 h-4 mr-1" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 安全评分 */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">安全评分</span>
                <span className="font-semibold text-gray-900">
                  {evaluation.safetyScore}/100
                </span>
              </div>
              <Progress value={evaluation.safetyScore} className="h-2" />
            </div>

            {/* 总体评估 */}
            <p className={config.textColor}>{evaluation.summary}</p>

            {/* 关键发现 */}
            {evaluation.keyFindings && evaluation.keyFindings.length > 0 && (
              <div className="bg-white bg-opacity-50 rounded-lg p-3">
                <h4 className="font-medium text-sm text-gray-700 mb-2">关键发现</h4>
                <ul className="space-y-1">
                  {evaluation.keyFindings.map((finding, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 单一类型评估 - 不使用标签页 */}
      {isSingleType && evaluation.planType === 'diet' && (
        <DietEvaluationContent
          dietConcerns={dietConcerns}
          allSuggestions={allSuggestions}
          showEmpty={dietConcerns.length === 0}
        />
      )}

      {isSingleType && evaluation.planType === 'exercise' && (
        <ExerciseEvaluationContent
          exerciseConcerns={exerciseConcerns}
          allSuggestions={allSuggestions}
          showEmpty={exerciseConcerns.length === 0}
        />
      )}

      {/* 分类评估 - 使用标签页（未指定类型或混合类型） */}
      {!isSingleType && (dietConcerns.length > 0 || exerciseConcerns.length > 0 || lifestyleConcerns.length > 0) && (
        <Tabs defaultValue="diet" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="diet" className="gap-2">
              <Apple className="w-4 h-4" />
              饮食评估 {dietConcerns.length > 0 && `(${dietConcerns.length})`}
            </TabsTrigger>
            <TabsTrigger value="exercise" className="gap-2">
              <Dumbbell className="w-4 h-4" />
              运动评估 {exerciseConcerns.length > 0 && `(${exerciseConcerns.length})`}
            </TabsTrigger>
            <TabsTrigger value="lifestyle" className="gap-2">
              <AlertCircle className="w-4 h-4" />
              生活方式 {lifestyleConcerns.length > 0 && `(${lifestyleConcerns.length})`}
            </TabsTrigger>
          </TabsList>

          {/* 饮食评估 */}
          <TabsContent value="diet" className="space-y-4">
            {dietConcerns.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                      发现的问题 ({dietConcerns.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dietConcerns.map((concern, index) => (
                        <ConcernItem key={index} concern={concern} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {allSuggestions.filter(s => {
                  const concern = dietConcerns[s.concernId];
                  return concern !== undefined;
                }).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <CheckCircle2 className="w-5 h-5 mr-2 text-blue-500" />
                        调整建议
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {allSuggestions
                          .filter(s => {
                            const concern = dietConcerns[s.concernId];
                            return concern !== undefined;
                          })
                          .map((suggestion, index) => (
                            <SuggestionItem key={index} suggestion={suggestion} />
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>饮食计划无需调整</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 运动评估 */}
          <TabsContent value="exercise" className="space-y-4">
            {exerciseConcerns.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                      发现的问题 ({exerciseConcerns.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {exerciseConcerns.map((concern, index) => (
                        <ConcernItem key={index} concern={concern} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {allSuggestions.filter(s => {
                  const concern = exerciseConcerns[s.concernId];
                  return concern !== undefined;
                }).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <CheckCircle2 className="w-5 h-5 mr-2 text-blue-500" />
                        调整建议
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {allSuggestions
                          .filter(s => {
                            const concern = exerciseConcerns[s.concernId];
                            return concern !== undefined;
                          })
                          .map((suggestion, index) => (
                            <SuggestionItem key={index} suggestion={suggestion} />
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>运动计划无需调整</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 生活方式评估 */}
          <TabsContent value="lifestyle" className="space-y-4">
            {lifestyleConcerns.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                      发现的问题 ({lifestyleConcerns.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {lifestyleConcerns.map((concern, index) => (
                        <ConcernItem key={index} concern={concern} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {allSuggestions.filter(s => {
                  const concern = lifestyleConcerns[s.concernId];
                  return concern !== undefined;
                }).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <CheckCircle2 className="w-5 h-5 mr-2 text-blue-500" />
                        调整建议
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {allSuggestions
                          .filter(s => {
                            const concern = lifestyleConcerns[s.concernId];
                            return concern !== undefined;
                          })
                          .map((suggestion, index) => (
                            <SuggestionItem key={index} suggestion={suggestion} />
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>生活方式建议无需调整</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// 问题项组件
function ConcernItem({ concern }: { concern: Concern }) {
  const severityConfig = {
    high: {
      label: '高风险',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle,
    },
    medium: {
      label: '中风险',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: AlertTriangle,
    },
    low: {
      label: '低风险',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: AlertCircle,
    },
  };

  const config = severityConfig[concern.severity];
  const SeverityIcon = config.icon;

  const categoryLabels = {
    diet: '饮食',
    exercise: '运动',
    supplement: '补充剂',
    lifestyle: '生活方式',
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <SeverityIcon className="w-4 h-4" />
          <Badge className={config.color}>{config.label}</Badge>
          <Badge variant="outline">{categoryLabels[concern.category]}</Badge>
        </div>
      </div>

      <h4 className="font-medium text-gray-900 mb-1">{concern.issue}</h4>

      {concern.originalText && (
        <div className="bg-white rounded p-2 mb-2 border border-gray-200">
          <p className="text-sm text-gray-600 italic">原文："{concern.originalText}"</p>
        </div>
      )}

      <p className="text-sm text-gray-700 mb-2">
        <span className="font-medium">原因：</span>
        {concern.reason}
      </p>

      {concern.relatedIndicators && concern.relatedIndicators.length > 0 && (
        <div className="text-sm">
          <span className="font-medium text-gray-700">相关指标：</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {concern.relatedIndicators.map((indicator, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {indicator}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 建议项组件
function SuggestionItem({ suggestion }: { suggestion: Suggestion }) {
  const actionLabels = {
    replace: '替换',
    modify: '修改',
    remove: '移除',
    add: '添加',
  };

  const actionConfig = {
    replace: 'bg-purple-100 text-purple-800',
    modify: 'bg-blue-100 text-blue-800',
    remove: 'bg-red-100 text-red-800',
    add: 'bg-green-100 text-green-800',
  };

  return (
    <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
      <div className="flex items-center space-x-2 mb-2">
        <Badge className={actionConfig[suggestion.action]}>
          {actionLabels[suggestion.action]}
        </Badge>
        <span className="font-medium text-gray-900">{suggestion.description}</span>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-gray-700">建议：</span>
          <span className="text-gray-800">{suggestion.recommendation}</span>
        </div>

        {suggestion.alternatives && suggestion.alternatives.length > 0 && (
          <div>
            <span className="font-medium text-gray-700">替代方案：</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {suggestion.alternatives.map((alt, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {alt}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded p-2 border border-gray-200">
          <span className="font-medium text-gray-700">理由：</span>
          <span className="text-gray-600">{suggestion.rationale}</span>
        </div>
      </div>
    </div>
  );
}

// 饮食评估内容组件
function DietEvaluationContent({
  dietConcerns,
  allSuggestions,
  showEmpty,
}: {
  dietConcerns: Concern[];
  allSuggestions: Suggestion[];
  showEmpty: boolean;
}) {
  if (showEmpty) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <p>饮食计划无需调整</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
            发现的问题 ({dietConcerns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dietConcerns.map((concern, index) => (
              <ConcernItem key={index} concern={concern} />
            ))}
          </div>
        </CardContent>
      </Card>

      {allSuggestions.filter(s => {
        const concern = dietConcerns[s.concernId];
        return concern !== undefined;
      }).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CheckCircle2 className="w-5 h-5 mr-2 text-blue-500" />
              调整建议
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allSuggestions
                .filter(s => {
                  const concern = dietConcerns[s.concernId];
                  return concern !== undefined;
                })
                .map((suggestion, index) => (
                  <SuggestionItem key={index} suggestion={suggestion} />
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// 运动评估内容组件
function ExerciseEvaluationContent({
  exerciseConcerns,
  allSuggestions,
  showEmpty,
}: {
  exerciseConcerns: Concern[];
  allSuggestions: Suggestion[];
  showEmpty: boolean;
}) {
  if (showEmpty) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <p>运动计划无需调整</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
            发现的问题 ({exerciseConcerns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exerciseConcerns.map((concern, index) => (
              <ConcernItem key={index} concern={concern} />
            ))}
          </div>
        </CardContent>
      </Card>

      {allSuggestions.filter(s => {
        const concern = exerciseConcerns[s.concernId];
        return concern !== undefined;
      }).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CheckCircle2 className="w-5 h-5 mr-2 text-blue-500" />
              调整建议
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allSuggestions
                .filter(s => {
                  const concern = exerciseConcerns[s.concernId];
                  return concern !== undefined;
                })
                .map((suggestion, index) => (
                  <SuggestionItem key={index} suggestion={suggestion} />
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
