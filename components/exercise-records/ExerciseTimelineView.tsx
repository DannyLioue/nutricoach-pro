'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Dumbbell, Plus } from 'lucide-react';
import ExerciseRecordCard from './ExerciseRecordCard';
import ExerciseRecordForm from './ExerciseRecordForm';

interface ExerciseRecord {
  id: string;
  date: string;
  type: string;
  duration: number;
  intensity?: string;
  notes?: string;
}

interface GroupedRecords {
  date: string;
  formattedDate: string;
  dayOfWeek: string;
  records: ExerciseRecord[];
}

interface ExerciseTimelineViewProps {
  clientId: string;
  records: ExerciseRecord[];
  onDelete?: (recordId: string) => Promise<void>;
  onEdit?: (record: ExerciseRecord) => void;
  onCreate?: (data: Omit<ExerciseRecord, 'id'> & { imageUrl?: string }) => Promise<void>;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === today.toISOString().split('T')[0]) {
    return '今天';
  } else if (dateStr === yesterday.toISOString().split('T')[0]) {
    return '昨天';
  }

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
}

/**
 * 运动记录时间线视图组件
 * 按日期分组展示所有运动记录
 */
export default function ExerciseTimelineView({
  clientId,
  records,
  onDelete,
  onEdit,
  onCreate,
}: ExerciseTimelineViewProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExerciseRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // 按日期分组记录
  const groupedRecords = useMemo(() => {
    const groups: { [key: string]: GroupedRecords } = {};

    records.forEach((record) => {
      // date is string format (ISO), extract YYYY-MM-DD
      const dateStr = record.date.split('T')[0];

      if (!groups[dateStr]) {
        groups[dateStr] = {
          date: dateStr,
          formattedDate: formatDate(dateStr),
          dayOfWeek: getDayOfWeek(dateStr),
          records: [],
        };
      }
      groups[dateStr].records.push(record);
    });

    // 转换为数组并按日期降序排序
    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [records]);

  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const handleEdit = (record: ExerciseRecord) => {
    setEditingRecord(record);
    setShowForm(true);
    setIsCreating(false);
  };

  const handleCreateNew = () => {
    setEditingRecord(null);
    setIsCreating(true);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: Omit<ExerciseRecord, 'id'> & { imageUrl?: string }) => {
    if (editingRecord) {
      // 编辑模式：调用父组件的更新逻辑
      if (onEdit) {
        await onEdit({ ...editingRecord, ...data });
      }
    } else {
      // 创建模式：调用父组件的创建逻辑
      if (onCreate) {
        await onCreate(data);
      }
    }
    setShowForm(false);
    setEditingRecord(null);
    setIsCreating(false);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingRecord(null);
    setIsCreating(false);
  };

  // 计算总时长和总次数
  const totalDuration = records.reduce((sum, r) => sum + r.duration, 0);
  const totalRecords = records.length;

  // 格式化总时长显示
  const formatTotalDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
  };

  return (
    <div className="space-y-4">
      {/* 统计信息和添加按钮 */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-purple-900">运动统计</span>
            </div>
            {totalRecords > 0 && (
              <>
                <div className="text-sm text-purple-700">
                  共 <span className="font-bold">{totalRecords}</span> 次记录
                </div>
                <div className="text-sm text-purple-700">
                  总时长 <span className="font-bold">{formatTotalDuration(totalDuration)}</span>
                </div>
              </>
            )}
            {totalRecords === 0 && (
              <div className="text-sm text-purple-700">
                暂无记录，点击右侧按钮添加
              </div>
            )}
          </div>
          {onCreate && (
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              {showForm ? (
                <>
                  <ChevronDown className="h-4 w-4" />
                  {editingRecord ? '编辑中' : '收起'}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  添加记录
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 添加/编辑记录表单 */}
      {showForm && (onCreate || editingRecord) && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingRecord ? '编辑运动记录' : '添加运动记录'}
          </h3>
          <ExerciseRecordForm
            initialData={editingRecord ? {
              date: editingRecord.date,
              type: editingRecord.type,
              duration: editingRecord.duration,
              intensity: editingRecord.intensity,
              notes: editingRecord.notes,
              imageUrl: editingRecord.imageUrl,
              analysis: editingRecord.analysis,
            } : undefined}
            recordId={editingRecord?.id}
            clientId={clientId}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      {/* 时间线 */}
      {groupedRecords.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Dumbbell className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">还没有运动记录</p>
          <p className="text-sm text-gray-400 mt-1">点击上方"添加记录"开始记录运动</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupedRecords.map((group) => (
            <div
              key={group.date}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* 日期头部 */}
              <div
                className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleDate(group.date)}
              >
                <div className="flex items-center gap-3">
                  {expandedDates.has(group.date) ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">{group.formattedDate}</div>
                    <div className="text-sm text-gray-500">{group.dayOfWeek}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {group.records.length} 条记录 · {group.records.reduce((sum, r) => sum + r.duration, 0)} 分钟
                </div>
              </div>

              {/* 记录列表 */}
              {expandedDates.has(group.date) && (
                <div className="p-3 space-y-2">
                  {group.records.map((record) => (
                    <ExerciseRecordCard
                      key={record.id}
                      record={record}
                      clientId={clientId}
                      onDelete={onDelete}
                      onEdit={handleEdit}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
