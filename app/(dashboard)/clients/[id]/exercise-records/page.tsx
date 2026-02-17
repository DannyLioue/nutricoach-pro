'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ExerciseTimelineView } from '@/components/exercise-records';

interface ExerciseRecord {
  id: string;
  date: string;
  type: string;
  duration: number;
  intensity?: string;
  notes?: string;
  imageUrl?: string;
  analysis?: string;
  analyzedAt?: string;
}

export default function ExerciseRecordsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [clientId, setClientId] = useState<string>('');
  const [records, setRecords] = useState<ExerciseRecord[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    params.then((resolvedParams) => {
      setClientId(resolvedParams.id);
      fetchRecords(resolvedParams.id);
    });
  }, [params]);

  const fetchRecords = async (id: string) => {
    try {
      const res = await fetch(`/api/clients/${id}/exercise-records`);
      const data = await res.json();

      if (res.ok) {
        setRecords(data.exerciseRecords || []);
        setError('');
      } else {
        setError(data.error || '无法获取运动记录');
      }
    } catch (error) {
      console.error('Failed to fetch exercise records:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/exercise-records/${recordId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        setRecords(records.filter(r => r.id !== recordId));
        setError('');
      } else {
        setError(data.error || '无法删除运动记录');
      }
    } catch (error) {
      console.error('Failed to delete record:', error);
      setError('网络错误，请稍后重试');
    }
  };

  const handleCreate = async (data: Omit<ExerciseRecord, 'id'> & { imageUrl?: string }) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/exercise-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();

      if (res.ok) {
        setRecords([responseData.exerciseRecord, ...records]);
        setError('');

        // If there's an image and we want to auto-analyze
        if (data.imageUrl && responseData.exerciseRecord?.id) {
          await handleAutoAnalyze(responseData.exerciseRecord.id);
        }
      } else {
        setError(responseData.error || '无法创建运动记录');
      }
    } catch (error) {
      console.error('Failed to create record:', error);
      setError('网络错误，请稍后重试');
    }
  };

  const handleAutoAnalyze = async (recordId: string) => {
    try {
      const res = await fetch(
        `/api/clients/${clientId}/exercise-records/${recordId}/analyze`,
        {
          method: 'POST',
        }
      );

      const data = await res.json();

      if (res.ok) {
        // Refresh records to get updated data
        await fetchRecords(clientId);
      }
      // Don't show error for auto-analyze, it's optional
    } catch (error) {
      console.error('Auto-analyze failed:', error);
      // Auto-analyze is optional, don't show error to user
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">运动记录</h2>
        <p className="text-sm text-gray-600 mt-1">
          记录每日运动情况，跟踪健康生活方式
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 运动记录时间线 */}
      <ExerciseTimelineView
        clientId={clientId}
        records={records}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />
    </div>
  );
}
