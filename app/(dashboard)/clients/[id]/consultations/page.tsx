'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, MessageSquare, Loader2, Edit, Trash2 } from 'lucide-react';
import type { Consultation } from '@/types';

export default function ConsultationsListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState<string>('');
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    params.then(p => {
      setClientId(p.id);
      fetchConsultations(p.id);
    });
  }, [params]);

  const fetchConsultations = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${id}/consultations`);
      const data = await res.json();
      if (res.ok) {
        setConsultations(data.consultations || []);
      } else {
        setError(data.error || '获取咨询记录失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/consultations/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConsultations(prev => prev.filter(c => c.id !== id));
        setDeleteId(null);
      } else {
        const data = await res.json();
        alert(data.error || '删除失败');
      }
    } catch (err) {
      alert('网络错误，请重试');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">咨询记录</h1>
          <p className="text-gray-600 mt-1">查看和管理客户的所有咨询记录</p>
        </div>
        <button
          onClick={() => router.push(`/clients/${clientId}/consultations/new`)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus size={18} />
          新建咨询记录
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => fetchConsultations(clientId)}
            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            重试
          </button>
        </div>
      ) : consultations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <MessageSquare size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600">暂无咨询记录</p>
          <button
            onClick={() => router.push(`/clients/${clientId}/consultations/new`)}
            className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            创建第一条记录
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map((consultation) => (
            <div
              key={consultation.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex-1"
                  onClick={() => router.push(`/clients/${clientId}/consultations/${consultation.id}`)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {consultation.consultationType}
                    </span>
                    {consultation.analysis ? (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                          已分析
                        </span>
                        {consultation.analyzedAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(consultation.analyzedAt).toLocaleDateString('zh-CN')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                        未分析
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(consultation.consultationDate).toLocaleDateString('zh-CN')}
                    </div>
                    {consultation.textFiles && consultation.textFiles.length > 0 && (
                      <span>📄 {consultation.textFiles.length} 个文本文件</span>
                    )}
                    {consultation.images && consultation.images.length > 0 && (
                      <span>📷 {consultation.images.length} 张图片</span>
                    )}
                  </div>
                </div>

                {/* Hover actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/clients/${clientId}/consultations/${consultation.id}/edit`);
                    }}
                    className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(consultation.id);
                    }}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {consultation.sessionNotes && (
                <p
                  className="text-gray-700 text-sm line-clamp-2 mt-3"
                  onClick={() => router.push(`/clients/${clientId}/consultations/${consultation.id}`)}
                >
                  {consultation.sessionNotes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
            <p className="text-gray-600 mb-6">确定要删除这条咨询记录吗？此操作无法撤销。</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
