'use client';

import { useState } from 'react';
import { Trash2, Calendar, Clock, Flame, Edit2, Image, Sparkles } from 'lucide-react';

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

interface ExerciseRecordCardProps {
  record: ExerciseRecord;
  clientId: string;
  onDelete?: (recordId: string) => Promise<void>;
  onEdit?: (record: ExerciseRecord) => void;
}

export default function ExerciseRecordCard({
  record,
  clientId,
  onDelete,
  onEdit,
}: ExerciseRecordCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;
    if (!confirm('确定要删除这条运动记录吗？')) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(record.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case '有氧':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case '力量':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case '柔韧':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getIntensityColor = (intensity?: string) => {
    switch (intensity) {
      case '高':
        return 'text-red-600';
      case '中':
        return 'text-yellow-600';
      case '低':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* 日期和类型 */}
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getTypeColor(record.type)}`}>
              {record.type}
            </span>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(record.date)}</span>
            </div>
            {/* AI 分析标识 */}
            {record.analyzedAt && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-50 to-blue-50 rounded-md border border-purple-200" title="已通过AI识别">
                <Sparkles className="h-3 w-3 text-purple-600" />
                <span className="text-xs text-purple-700 font-medium">AI</span>
              </div>
            )}
            {/* 图片标识 */}
            {record.imageUrl && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md" title="包含运动截图">
                <Image className="h-3 w-3 text-gray-600" />
                <span className="text-xs text-gray-700">图片</span>
              </div>
            )}
          </div>

          {/* 时长和强度 */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-gray-700">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{record.duration} 分钟</span>
            </div>
            {record.intensity && (
              <div className={`flex items-center gap-1 ${getIntensityColor(record.intensity)}`}>
                <Flame className="h-4 w-4" />
                <span className="font-medium">{record.intensity}强度</span>
              </div>
            )}
          </div>

          {/* 备注 */}
          {record.notes && (
            <div className="mt-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
              {record.notes}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(record)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="编辑"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="删除"
          >
            {isDeleting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
