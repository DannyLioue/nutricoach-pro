'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ConsultationForm from '@/components/consultation/ConsultationForm';

export default function NewConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState<string>('');

  // In Next.js 15, params is a Promise
  useState(() => {
    params.then(p => setClientId(p.id));
  });

  if (!clientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
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
        <h1 className="text-2xl font-bold text-gray-900">新建咨询记录</h1>
        <p className="text-gray-600 mt-1">记录本次咨询的详细信息、笔记和多媒体资料</p>
      </div>

      {/* 咨询表单 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ConsultationForm clientId={clientId} />
      </div>
    </div>
  );
}
