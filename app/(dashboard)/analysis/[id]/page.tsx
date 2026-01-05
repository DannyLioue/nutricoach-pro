'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import { Activity, Apple, Droplets, Heart, TrendingUp, TrendingDown, Minus, Edit3, Check, X } from 'lucide-react';

function AnalysisDetailContent() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingIndicator, setEditingIndicator] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const reportRes = await fetch(`/api/reports/${reportId}`);
      const reportData = await reportRes.json();

      if (!reportRes.ok) {
        throw new Error(reportData.error || '获取报告失败');
      }

      setReport(reportData.report);

      if (reportData.report?.clientId) {
        const clientRes = await fetch(`/api/clients/${reportData.report.clientId}`);
        const clientData = await clientRes.json();
        if (clientRes.ok) {
          setClient(clientData.client);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRecommendations = () => {
    router.push(`/recommendations/new?reportId=${reportId}`);
  };

  // 计算 BMI
  const calculateBMI = (height: number, weight: number) => {
    return (weight / ((height / 100) ** 2)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: '偏瘦', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    if (bmi < 24) return { label: '正常', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (bmi < 28) return { label: '超重', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    return { label: '肥胖', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' };
  };

  // 计算 BMR (基础代谢率)
  const calculateBMR = (client: any) => {
    const { weight, height, gender } = client;
    const age = new Date().getFullYear() - new Date(client.birthDate).getFullYear();
    const validAge = age > 0 ? age : 35;

    if (gender === 'MALE') {
      return 10 * weight + 6.25 * height - 5 * validAge + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * validAge - 161;
    }
  };

  // 计算 TDEE (总能量消耗)
  const calculateTDEE = (bmr: number, activityLevel: string) => {
    const multipliers: Record<string, number> = {
      SEDENTARY: 1.2,
      LIGHT: 1.375,
      MODERATE: 1.55,
      ACTIVE: 1.725,
      VERY_ACTIVE: 1.9,
    };
    return bmr * (multipliers[activityLevel] || 1.55);
  };

  // 获取活动水平标签
  const getActivityLabel = (level: string) => {
    const labels: Record<string, string> = {
      SEDENTARY: '久坐',
      LIGHT: '轻度',
      MODERATE: '中度',
      ACTIVE: '活跃',
      VERY_ACTIVE: '非常活跃',
    };
    return labels[level] || level;
  };

  // 获取指标状态图标
  const getIndicatorIcon = (status: string) => {
    if (status === '正常') return <Check className="w-5 h-5 text-green-600" />;
    if (status === '偏高' || status === '异常') return <TrendingUp className="w-5 h-5 text-red-600" />;
    if (status === '偏低') return <TrendingDown className="w-5 h-5 text-orange-600" />;
    return <Minus className="w-5 h-5 text-zinc-400" />;
  };

  // 获取指标状态样式
  const getIndicatorStyle = (status: string) => {
    if (status === '正常') return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
    if (status === '偏高' || status === '异常') return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
    if (status === '偏低') return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
    return 'border-l-zinc-300 bg-zinc-50 dark:bg-zinc-800';
  };

  // 处理指标编辑
  const handleEditIndicator = (index: number, currentValue: string) => {
    setEditingIndicator(index);
    setEditValue(currentValue);
  };

  const handleSaveIndicator = async (index: number) => {
    if (!report?.analysis?.indicators) return;

    const updatedIndicators = [...report.analysis.indicators];
    updatedIndicators[index].value = editValue;

    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: { ...report.analysis, indicators: updatedIndicators }
        }),
      });

      if (res.ok) {
        setReport({ ...report, analysis: { ...report.analysis, indicators: updatedIndicators } });
        setEditingIndicator(null);
      }
    } catch (err) {
      console.error('保存失败:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndicator(null);
    setEditValue('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <DashboardNavbar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-8 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-zinc-500">加载分析结果...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <DashboardNavbar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-8 text-center">
            <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 text-lg mb-4">{error || '报告不存在'}</p>
            <Link
              href="/analysis"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 transition-colors"
            >
              返回列表
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const analysis = report.analysis;
  const bmi = client ? parseFloat(calculateBMI(client.height, client.weight)) : 0;
  const bmiCategory = getBMICategory(bmi);
  const bmr = client ? calculateBMR(client) : 0;
  const tdee = client ? calculateTDEE(bmr, client.activityLevel) : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardNavbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 页头 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              体检报告分析
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1 flex items-center gap-2">
              <span>{client?.name}</span>
              <span className="text-zinc-400">·</span>
              <span>{report.fileName}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/analysis/${reportId}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              重新分析
            </Link>
            <button
              onClick={handleGenerateRecommendations}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              <Apple className="w-4 h-4" />
              生成建议
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左侧：分析结果详情 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 健康评分卡片 */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-800 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">健康评分</h3>
                  <p className="text-blue-100 text-sm">
                    {analysis?.healthScore >= 80 ? '健康状况良好，继续保持！' :
                     analysis?.healthScore >= 60 ? '健康状况一般，建议改善生活习惯' : '需要关注健康，建议尽快调整'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold">{analysis?.healthScore || 75}</div>
                  <div className="text-sm text-blue-100 mt-1">/ 100 分</div>
                </div>
              </div>
            </div>

            {/* 核心计算结果 */}
            {client && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  核心指标计算
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                    <p className="text-sm text-zinc-500 mb-1">BMI</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{bmi}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${bmiCategory.bg} ${bmiCategory.color}`}>
                      {bmiCategory.label}
                    </span>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                    <p className="text-sm text-zinc-500 mb-1">基础代谢 (BMR)</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{Math.round(bmr)}</p>
                    <p className="text-xs text-zinc-500 mt-1">kcal/天</p>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                    <p className="text-sm text-zinc-500 mb-1">总消耗 (TDEE)</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{Math.round(tdee)}</p>
                    <p className="text-xs text-zinc-500 mt-1">kcal/天</p>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                    <p className="text-sm text-zinc-500 mb-1">活动水平</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {getActivityLabel(client.activityLevel)}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      ×{activityLevel === 'SEDENTARY' ? '1.2' :
                        activityLevel === 'LIGHT' ? '1.375' :
                        activityLevel === 'MODERATE' ? '1.55' :
                        activityLevel === 'ACTIVE' ? '1.725' : '1.9'}
                    </p>
                  </div>
                </div>

                {/* 宏量营养素目标 */}
                {analysis?.macroTargets && (
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">建议宏量营养素分配</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-xs text-zinc-500 mb-1">碳水化合物</p>
                        <p className="font-bold text-blue-600 dark:text-blue-400">
                          {analysis.macroTargets.carbs?.grams || '-'}g
                        </p>
                        <p className="text-xs text-zinc-500">
                          {analysis.macroTargets.carbs?.percentage || '-'}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <p className="text-xs text-zinc-500 mb-1">蛋白质</p>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">
                          {analysis.macroTargets.protein?.grams || '-'}g
                        </p>
                        <p className="text-xs text-zinc-500">
                          {analysis.macroTargets.protein?.percentage || '-'}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <p className="text-xs text-zinc-500 mb-1">脂肪</p>
                        <p className="font-bold text-amber-600 dark:text-amber-400">
                          {analysis.macroTargets.fat?.grams || '-'}g
                        </p>
                        <p className="text-xs text-zinc-500">
                          {analysis.macroTargets.fat?.percentage || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 分析摘要 */}
            {analysis?.summary && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  分析摘要
                </h3>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{analysis.summary}</p>
              </div>
            )}

            {/* 体检指标详情 */}
            {analysis?.indicators && analysis.indicators.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-purple-500" />
                    体检指标详情
                  </h3>
                  <span className="text-sm text-zinc-500">共 {analysis.indicators.length} 项</span>
                </div>

                {/* 按状态分组 */}
                {(() => {
                  const abnormalIndicators = analysis.indicators.filter((i: any) => i.status !== '正常');
                  const normalIndicators = analysis.indicators.filter((i: any) => i.status === '正常');

                  return (
                    <div className="space-y-4">
                      {/* 异常指标 */}
                      {abnormalIndicators.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-3">
                            ⚠️ 需要关注的指标 ({abnormalIndicators.length})
                          </p>
                          <div className="space-y-2">
                            {abnormalIndicators.map((indicator: any, idx: number) => {
                              const originalIdx = analysis.indicators.indexOf(indicator);
                              return (
                                <div
                                  key={idx}
                                  className={`p-4 rounded-lg border-l-4 ${getIndicatorStyle(indicator.status)}`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        {getIndicatorIcon(indicator.status)}
                                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                          {indicator.name}
                                        </span>
                                        {editingIndicator === originalIdx ? (
                                          <div className="flex items-center gap-2 ml-2">
                                            <input
                                              type="text"
                                              value={editValue}
                                              onChange={(e) => setEditValue(e.target.value)}
                                              className="w-24 px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
                                              onKeyPress={(e) => e.key === 'Enter' && handleSaveIndicator(originalIdx)}
                                            />
                                            <button
                                              onClick={() => handleSaveIndicator(originalIdx)}
                                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                                            >
                                              <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={handleCancelEdit}
                                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                                            >
                                              <X className="w-4 h-4" />
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="ml-auto font-mono font-bold">
                                            {indicator.value} {indicator.unit || ''}
                                          </span>
                                        )}
                                        {editingIndicator !== originalIdx && (
                                          <button
                                            onClick={() => handleEditIndicator(originalIdx, indicator.value)}
                                            className="p-1 text-zinc-400 hover:text-zinc-600 ml-2"
                                            title="编辑数值"
                                          >
                                            <Edit3 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                        正常范围: {indicator.normalRange || '未知'}
                                      </div>
                                      {indicator.clinicalSignificance && (
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                                          <span className="font-medium">临床意义:</span> {indicator.clinicalSignificance}
                                        </p>
                                      )}
                                      {indicator.risk && (
                                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                          <span className="font-medium">风险:</span> {indicator.risk}
                                        </p>
                                      )}
                                      {indicator.intervention && (
                                        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                                          <span className="font-medium">建议:</span> {indicator.intervention}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 正常指标 - 可折叠 */}
                      {normalIndicators.length > 0 && (
                        <details className="group">
                          <summary className="cursor-pointer text-sm font-medium text-green-600 dark:text-green-400 mb-3 hover:text-green-700">
                            ✓ 正常指标 ({normalIndicators.length}) - 点击展开
                          </summary>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                            {normalIndicators.map((indicator: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {indicator.name}
                                  </span>
                                  <span className="font-mono text-sm text-green-600 dark:text-green-400">
                                    {indicator.value} {indicator.unit || ''}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* OCR 提取数据 */}
            {report.extractedData && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  OCR 提取原始数据
                </h3>
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-mono">
                    {JSON.stringify(report.extractedData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：客户信息和操作 */}
          <div className="space-y-6">
            {/* 客户基本信息 */}
            {client && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  👤 客户信息
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-zinc-500">姓名</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{client.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-zinc-500">性别</p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {client.gender === 'MALE' ? '男' : client.gender === 'FEMALE' ? '女' : '其他'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500">年龄</p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {new Date().getFullYear() - new Date(client.birthDate).getFullYear()} 岁
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-zinc-500">身高</p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{client.height} cm</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500">体重</p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{client.weight} kg</p>
                    </div>
                  </div>
                  {(client.allergies || client.medicalHistory) && (
                    <>
                      {client.allergies && JSON.parse(client.allergies || '[]').length > 0 && (
                        <div>
                          <p className="text-sm text-zinc-500">过敏史</p>
                          <p className="font-medium text-red-600 dark:text-red-400">
                            {JSON.parse(client.allergies).join('、')}
                          </p>
                        </div>
                      )}
                      {client.medicalHistory && JSON.parse(client.medicalHistory || '[]').length > 0 && (
                        <div>
                          <p className="text-sm text-zinc-500">疾病史</p>
                          <p className="font-medium text-orange-600 dark:text-orange-400">
                            {JSON.parse(client.medicalHistory).join('、')}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 报告文件信息 */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                📄 报告信息
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-zinc-500">文件名</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm break-all">
                    {report.fileName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">文件类型</p>
                  <span className="inline-block px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs rounded">
                    {report.fileType}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">上传时间</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                    {new Date(report.uploadedAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            </div>

            {/* 快速操作 */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                ⚡ 快速操作
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleGenerateRecommendations}
                  className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Apple className="w-4 h-4" />
                  生成专业建议
                </button>
                <Link
                  href={`/recommendations?clientId=${client?.id}`}
                  className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-center"
                >
                  查看历史建议
                </Link>
                <Link
                  href={`/clients/${client?.id}`}
                  className="block w-full px-4 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg hover:bg-zinc-300 transition-colors text-center"
                >
                  查看客户详情
                </Link>
              </div>
            </div>

            {/* 风险因素提示 */}
            {analysis?.riskFactors && analysis.riskFactors.length > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl shadow-md border border-orange-200 dark:border-orange-800">
                <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-4">
                  ⚠️ 风险因素
                </h3>
                <div className="space-y-3">
                  {analysis.riskFactors.map((risk: any, idx: number) => (
                    <div key={idx} className="p-3 bg-white dark:bg-zinc-900 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {risk.factor}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          risk.level === '高' ? 'bg-red-100 text-red-700' :
                          risk.level === '中' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {risk.level}风险
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{risk.mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AnalysisDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <DashboardNavbar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-8 text-center">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-zinc-500 mt-4">加载中...</div>
          </div>
        </main>
      </div>
    }>
      <AnalysisDetailContent />
    </Suspense>
  );
}
