'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, AlertCircle, Loader2, MessageSquare, Image as ImageIcon, Mic, CheckCircle2, Sparkles, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
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
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<string>>(new Set());

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
    try {
      const res = await fetch(`/api/clients/${clientId}/consultations/${consultationId}/analyze`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        // 重新获取咨询记录
        await fetchConsultation(clientId, consultationId);
      } else {
        setError(data.error || 'AI分析失败');
      }
    } catch (err) {
      setError('AI分析失败，请重试');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRetranscribe = async (audioId: string) => {
    if (!clientId || !consultationId) {
      console.error('[Retranscribe] Missing clientId or consultationId');
      return;
    }

    console.log('[Retranscribe] Starting re-transcription for audio:', audioId);
    setError(null);
    try {
      const url = `/api/clients/${clientId}/consultations/${consultationId}/audio/${audioId}/retranscribe`;
      console.log('[Retranscribe] Fetching:', url);

      const res = await fetch(url, {
        method: 'POST',
      });

      console.log('[Retranscribe] Response status:', res.status);

      const data = await res.json();
      console.log('[Retranscribe] Response data:', data);

      if (res.ok) {
        console.log('[Retranscribe] Success, refreshing consultation data');
        // 重新获取咨询记录
        await fetchConsultation(clientId, consultationId);
      } else {
        console.error('[Retranscribe] Failed:', data.error);
        setError(data.error || '重新转录失败');
      }
    } catch (err) {
      console.error('[Retranscribe] Exception:', err);
      setError('重新转录失败，请重试');
    }
  };

  const toggleTranscript = (audioId: string) => {
    const newExpanded = new Set(expandedTranscripts);
    if (newExpanded.has(audioId)) {
      newExpanded.delete(audioId);
    } else {
      newExpanded.add(audioId);
    }
    setExpandedTranscripts(newExpanded);
  };

  // 自动轮询更新状态（用于转录中/分析中的状态）
  useEffect(() => {
    if (!consultation) return;

    const hasProcessing = consultation.audioFiles?.some(
      audio => audio.transcriptionStatus === 'transcribing' || audio.transcriptionStatus === 'pending'
    );

    if (hasProcessing) {
      console.log('[Auto-refresh] Starting auto-refresh for processing status');
      const interval = setInterval(() => {
        console.log('[Auto-refresh] Refreshing consultation data');
        fetchConsultation(clientId, consultationId, true); // 使用静默更新
      }, 3000); // 每3秒刷新一次

      return () => {
        console.log('[Auto-refresh] Stopping auto-refresh');
        clearInterval(interval);
      };
    }
  }, [consultation, clientId, consultationId]);

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
              {consultation.audioFiles && consultation.audioFiles.length > 0 && (
                <span className="text-gray-600">🎙️ {consultation.audioFiles.length} 个音频</span>
              )}
              {consultation.images && consultation.images.length > 0 && (
                <span className="text-gray-600">📷 {consultation.images.length} 张图片</span>
              )}
            </div>
          </div>
          {!consultation.analysis && (
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
          )}
        </div>
      </div>

      {/* AI分析结果 */}
      {consultation.analysis && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={20} className="text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">AI分析结果</h3>
          </div>
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

      {/* 音频文件 */}
      {consultation.audioFiles && consultation.audioFiles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Mic size={18} />
            音频文件 ({consultation.audioFiles.length})
            {consultation.audioFiles.some(a => a.transcriptionStatus === 'transcribing' || a.transcriptionStatus === 'pending') && (
              <span className="ml-2 text-sm text-blue-600 flex items-center gap-1">
                <Loader2 size={14} className="animate-spin" />
                处理中...
              </span>
            )}
          </h3>
          <div className="space-y-3">
            {consultation.audioFiles.map((audio) => {
              const isExpanded = expandedTranscripts.has(audio.id);
              const hasTranscript = audio.transcript || audio.structuredTranscript;

              return (
                <div key={audio.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* 音频信息和播放器 */}
                  <div className="p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{audio.fileName}</span>
                      <div className="flex items-center gap-2">
                        {audio.transcriptionStatus === 'completed' && (
                          <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            已转录
                          </span>
                        )}
                        {audio.transcriptionStatus === 'transcribing' && (
                          <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700 flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" />
                            转录中
                          </span>
                        )}
                        {audio.transcriptionStatus === 'pending' && (
                          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                            等待中
                          </span>
                        )}
                        {audio.transcriptionStatus === 'failed' && (
                          <button
                            onClick={() => handleRetranscribe(audio.id)}
                            className="px-3 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                          >
                            <RefreshCw size={12} />
                            重新转录
                          </button>
                        )}
                      </div>
                    </div>
                    <audio src={audio.audioUrl} controls className="w-full" />
                  </div>

                  {/* 转录文本（可折叠） */}
                  {hasTranscript && (
                    <div className="border-t border-gray-200">
                      <button
                        onClick={() => toggleTranscript(audio.id)}
                        className="w-full px-3 py-2 flex items-center justify-between text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <MessageSquare size={14} />
                          转录文本
                        </span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-gray-100">
                          {/* 结构化对话 */}
                          {audio.structuredTranscript && audio.structuredTranscript.length > 0 && (
                            <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                              <p className="text-xs font-medium text-blue-700 mb-2">结构化对话</p>
                              <div className="space-y-2">
                                {audio.structuredTranscript.map((line, i) => (
                                  <div key={i} className="flex gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                                      line.speaker === 'nutritionist' ? 'bg-blue-200 text-blue-800' : 'bg-emerald-200 text-emerald-800'
                                    }`}>
                                      {line.speaker === 'nutritionist' ? '营养师' : '客户'}
                                    </span>
                                    <span className="text-sm text-gray-800">{line.text}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 原始转录文本 */}
                          {audio.transcript && (
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                              <p className="text-xs font-medium text-gray-600 mb-1">原始文本</p>
                              <p className="text-sm text-gray-800 whitespace-pre-wrap">{audio.transcript}</p>
                            </div>
                          )}
                        </div>
                      )}
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
