'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ConsultationForm from '@/components/consultation/ConsultationForm';

export default function EditConsultationPage({
  params,
}: {
  params: Promise<{ id: string; consultationId: string }>;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState<string>('');
  const [consultationId, setConsultationId] = useState<string>('');
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(async (p) => {
      setClientId(p.id);
      setConsultationId(p.consultationId);
      await fetchConsultation(p.id, p.consultationId);
    });
  }, [params]);

  const fetchConsultation = async (id: string, cId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${id}/consultations/${cId}`);
      const data = await res.json();
      if (res.ok) {
        setInitialData(data.consultation);
      } else {
        alert('获取咨询记录失败：' + (data.error || '未知错误'));
        router.back();
      }
    } catch (err) {
      alert('网络错误，请重试');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (!clientId || !consultationId || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 size={24} className="animate-spin" />
          加载中...
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
        <h1 className="text-2xl font-bold text-gray-900">编辑咨询记录</h1>
        <p className="text-gray-600 mt-1">修改咨询类型和备注说明</p>
      </div>

      {/* 编辑表单 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ConsultationForm
          clientId={clientId}
          consultationId={consultationId}
          initialData={initialData}
        />
      </div>
    </div>
  );
}
