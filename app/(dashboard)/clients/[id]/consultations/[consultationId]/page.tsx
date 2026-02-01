'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, AlertCircle, Loader2, MessageSquare, Image as ImageIcon, FileText, CheckCircle2, Sparkles, ChevronDown, ChevronUp, RotateCw } from 'lucide-react';
import type { Consultation } from '@/types';

export default function ConsultationDetailPage({
  params,
}: {
  params: Promise<{ id: string; consultationId: string }>;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState<string>('');
  const [consultationId, setConsultationId] = useState<string>('');
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedTextFiles, setExpandedTextFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    params.then(p => {
      setClientId(p.id);
      setConsultationId(p.consultationId);
      fetchConsultation(p.id, p.consultationId);
    });
  }, [params]);

  const fetchConsultation = async (id: string, cId: string, silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetch(`/api/clients/${id}/consultations/${cId}`);
      const data = await res.json();
      if (res.ok) {
        setConsultation(data.consultation);
      } else {
        setError(data.error || '获取咨询记录失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!clientId || !consultationId) return;

    setAnalyzing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/consultations/${consultationId}/analyze`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        // 重新获取咨询记录
        await fetchConsultation(clientId, consultationId, true);
        // 检查更新后的consultation状态
        setSuccessMessage(consultation?.analysis ? '分析已更新' : '分析完成');
        // 3秒后隐藏成功消息
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || 'AI分析失败');
      }
    } catch (err) {
      setError('AI分析失败，请重试');
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleTextFile = (textFileId: string) => {
    const newExpanded = new Set(expandedTextFiles);
    if (newExpanded.has(textFileId)) {
      newExpanded.delete(textFileId);
    } else {
      newExpanded.add(textFileId);
    }
    setExpandedTextFiles(newExpanded);
  };

  if (!clientId || !consultationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 size={24} className="animate-spin" />
            加载中...
          </div>
        </div>
      </div>
    );
  }

  if (error && !consultation) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">加载失败</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-16">
          <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">咨询记录不存在</h3>
          <button
            onClick={() => router.push(`/clients/${clientId}/consultations`)}
            className="text-emerald-600 hover:text-emerald-700"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 页面头部 */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          返回
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{consultation.consultationType}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                {new Date(consultation.consultationDate).toLocaleDateString('zh-CN')}
              </div>
              {consultation.textFiles && consultation.textFiles.length > 0 && (
                <span className="text-gray-600">📄 {consultation.textFiles.length} 个文本文件</span>
              )}
              {consultation.images && consultation.images.length > 0 && (
                <span className="text-gray-600">📷 {consultation.images.length} 张图片</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 成功提示 */}
      {successMessage && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-800 font-medium">{successMessage}</p>
        </div>
      )}

      {/* AI分析区域 */}
      {consultation.analysis ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">AI分析结果</h3>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {analyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <RotateCw size={16} />
                  重新分析
                </>
              )}
            </button>
          </div>
          {consultation.analyzedAt && (
            <div className="text-xs text-blue-600 mb-3">
              最后分析: {new Date(consultation.analyzedAt).toLocaleString('zh-CN')}
            </div>
          )}
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-900 mb-1">总结</h4>
              <p className="text-blue-800">{consultation.analysis.summary}</p>
            </div>

            {consultation.analysis.dietChanges && (
              <div>
                <h4 className="font-medium text-blue-900 mb-1">饮食变化</h4>
                <p className="text-blue-800">
                  依从性: {consultation.analysis.dietChanges.complianceLevel === 'high' ? '高' : consultation.analysis.dietChanges.complianceLevel === 'medium' ? '中' : '低'}
                </p>
                {consultation.analysis.dietChanges.reportedChanges?.length > 0 && (
                  <ul className="list-disc list-inside text-blue-800 mt-1">
                    {consultation.analysis.dietChanges.reportedChanges.map((change, i) => (
                      <li key={i}>{change}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {consultation.analysis.nutritionistActionItems && (
              <div>
                <h4 className="font-medium text-blue-900 mb-1">行动建议</h4>
                <p className="text-blue-800">
                  优先级: {consultation.analysis.nutritionistActionItems.priority === 'high' ? '高' : consultation.analysis.nutritionistActionItems.priority === 'medium' ? '中' : '低'}
                </p>
                {consultation.analysis.nutritionistActionItems.followUpActions?.length > 0 && (
                  <ul className="list-disc list-inside text-blue-800 mt-1">
                    {consultation.analysis.nutritionistActionItems.followUpActions.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">暂无AI分析</h3>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {analyzing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  AI分析
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 咨询内容 */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">咨询笔记</h3>
        {consultation.sessionNotes ? (
          <p className="text-gray-700 whitespace-pre-wrap">{consultation.sessionNotes}</p>
        ) : (
          <p className="text-gray-500 italic">无笔记</p>
        )}
      </div>

      {/* 文本文件 */}
      {consultation.textFiles && consultation.textFiles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText size={18} />
            文本文件 ({consultation.textFiles.length})
          </h3>
          <div className="space-y-3">
            {consultation.textFiles.map((textFile) => {
              const isExpanded = expandedTextFiles.has(textFile.id);

              return (
                <div key={textFile.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* 文件信息 */}
                  <div className="p-3 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">{textFile.fileName}</span>
                      <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700 uppercase">
                        {textFile.fileType}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleTextFile(textFile.id)}
                      className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                  {/* 文件内容（可折叠） */}
                  {isExpanded && textFile.content && (
                    <div className="p-3 bg-white border-t border-gray-200">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded border border-gray-200 max-h-96 overflow-y-auto">
                        {textFile.content}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 图片 */}
      {consultation.images && consultation.images.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ImageIcon size={18} />
            相关图片 ({consultation.images.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {consultation.images.map((image, index) => (
              <div key={index} className="space-y-1">
                <img
                  src={image.imageUrl}
                  alt={`图片 ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                {image.description && (
                  <p className="text-xs text-gray-600">{image.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
