'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Calendar, X } from 'lucide-react';

interface CopyMealGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newDate: string) => Promise<void>;
  mealGroupName?: string;
  mealType?: string;
}

export function CopyMealGroupModal({
  isOpen,
  onClose,
  onConfirm,
  mealGroupName,
  mealType,
}: CopyMealGroupModalProps) {
  const [newDate, setNewDate] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 确保组件已挂载（用于 createPortal）
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // 重置日期状态当模态框打开时
  useEffect(() => {
    if (isOpen) {
      setNewDate('');
    }
  }, [isOpen]);

  // 生成新名称（与创建逻辑一致：时间+餐型，例如 "2024年1月15日早餐"）
  const generateNewName = (date: string, type: string | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const mealTypeName = type || '用餐';
    return `${year}年${month}月${day}日${mealTypeName}`;
  };

  const mealTypeNames: Record<string, string> = {
    '早餐': '早餐',
    '午餐': '午餐',
    '晚餐': '晚餐',
    '加餐': '加餐',
    '全天': '全天',
  };

  const mealTypeName = mealType ? mealTypeNames[mealType] || mealType : '用餐';

  const handleConfirm = async () => {
    if (!newDate) return;

    setIsCopying(true);
    try {
      await onConfirm(newDate);
      setNewDate('');
      onClose();
    } catch (error) {
      console.error('Copy failed:', error);
      // Error is handled by the parent
    } finally {
      setIsCopying(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isCopying) {
      onClose();
    }
  };

  if (!isOpen) return null;
  if (!isMounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full flex flex-col my-auto">
        {/* 头部 */}
        <div className="p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Copy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                复制食谱组
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={isCopying}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              aria-label="关闭"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            将 <span className="font-medium text-gray-900 dark:text-white">"{mealGroupName}"</span> 复制到新日期，照片和备注将被保留。
          </p>
        </div>

        {/* 内容 */}
        <div className="px-6 pb-6 flex-shrink-0">
          <div className="space-y-4">
            {/* 日期选择器 */}
            <div className="space-y-2">
              <label htmlFor="newDate" className="text-sm font-medium text-gray-900 dark:text-white">
                选择新日期 <span className="text-red-500">*</span>
              </label>
              <input
                id="newDate"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent
                         disabled:opacity-50 disabled:cursor-not-allowed"
                min="2020-01-01"
                max="2030-12-31"
                disabled={isCopying}
              />
            </div>

            {/* 预览新名称 */}
            {newDate && (
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>新食谱组名称：</span>
                  <strong className="break-all">{generateNewName(newDate, mealType)}</strong>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 pb-6 pt-0 flex-shrink-0">
          <div className="flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isCopying}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
                       text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!newDate || isCopying}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600
                       text-white text-sm font-medium rounded-lg
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
            >
              {isCopying ? (
                <>
                  <span className="animate-spin">⏳</span>
                  复制中...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  确认复制
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
