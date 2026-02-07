'use client';

import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DietSummaryDateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onQuickSelect?: (range: 'today' | 'thisWeek' | 'lastWeek' | 'last7Days') => void;
  maxDays?: number; // 最大天数限制，默认7天
  disabled?: boolean; // 禁用状态
}

// 格式化日期为 YYYY-MM-DD（使用本地时间，避免时区问题）
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 解析 YYYY-MM-DD 为 Date
function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

// 计算两个日期之间的天数
function daysBetween(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export default function DietSummaryDateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onQuickSelect,
  maxDays = 7,
  disabled = false,
}: DietSummaryDateRangePickerProps) {
  const [error, setError] = useState<string>('');

  // 计算选中的天数
  const selectedDays = daysBetween(startDate, endDate);
  const isOverLimit = selectedDays > maxDays;

  // 处理开始日期变化
  const handleStartDateChange = (dateStr: string) => {
    if (disabled) return;
    const newStart = parseDate(dateStr);
    if (newStart > endDate) {
      // 如果开始日期晚于结束日期，调整结束日期
      onEndDateChange(newStart);
    }
    onStartDateChange(newStart);
    setError('');
  };

  // 处理结束日期变化
  const handleEndDateChange = (dateStr: string) => {
    if (disabled) return;
    const newEnd = parseDate(dateStr);
    if (newEnd < startDate) {
      setError('结束日期不能早于开始日期');
      return;
    }
    const days = daysBetween(startDate, newEnd);
    if (days > maxDays) {
      setError(`日期范围不能超过${maxDays}天（当前选择：${days}天）`);
      return;
    }
    onEndDateChange(newEnd);
    setError('');
  };

  // 快捷选择
  const quickSelectOptions = [
    { label: '今天', value: 'today' as const },
    { label: '本周', value: 'thisWeek' as const },
    { label: '上周', value: 'lastWeek' as const },
    { label: '过去7天', value: 'last7Days' as const },
  ];

  const opacityClass = disabled ? 'opacity-50 pointer-events-none' : '';

  return (
    <div className={`space-y-4 ${opacityClass}`}>
      {/* 快捷选择 */}
      {onQuickSelect && (
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            快捷选择
          </label>
          <div className="flex flex-wrap gap-2">
            {quickSelectOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => !disabled && onQuickSelect(option.value)}
                className="px-3 py-1.5 text-sm rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-bg-200)',
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => !disabled && (e.currentTarget.style.backgroundColor = 'var(--color-bg-300)')}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-200)'}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 日期范围选择 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            开始日期
          </label>
          <input
            type="date"
            value={formatDate(startDate)}
            max={formatDate(endDate)}
            onChange={(e) => handleStartDateChange(e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderColor: 'var(--color-primary-300)' }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            结束日期
          </label>
          <input
            type="date"
            value={formatDate(endDate)}
            min={formatDate(startDate)}
            onChange={(e) => handleEndDateChange(e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderColor: 'var(--color-primary-300)' }}
          />
        </div>
      </div>

      {/* 选中天数提示 */}
      <div className="flex items-center justify-between p-3 rounded-xl" style={{
        backgroundColor: isOverLimit ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
      }}>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: isOverLimit ? '#ef4444' : '#10b981' }} />
          <span className="text-sm" style={{ color: isOverLimit ? '#b91c1c' : '#065f46' }}>
            已选择 {selectedDays} 天
          </span>
        </div>
        {isOverLimit && (
          <span className="text-xs font-medium" style={{ color: '#dc2626' }}>
            最多{maxDays}天
          </span>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c' }}>
          {error}
        </div>
      )}
    </div>
  );
}
