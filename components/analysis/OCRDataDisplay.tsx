'use client';

import React, { useState } from 'react';
import { Activity, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import type { OCRDataDisplayProps } from '@/types/health-analysis';

/**
 * OCR原始数据展示组件
 * 可折叠的JSON数据展示，供技术人员参考
 */
export default function OCRDataDisplay({
  extractedData,
  fileName,
  className = '',
}: OCRDataDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 处理空数据
  if (!extractedData || (typeof extractedData === 'object' && Object.keys(extractedData).length === 0)) {
    return (
      <div className={`bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 ${className}`}>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          OCR 提取原始数据
        </h3>
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-6 text-center">
          <FileText className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">暂无OCR数据</p>
        </div>
      </div>
    );
  }

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className={`bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 ${className}`}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          OCR 提取原始数据
        </h3>
        <button
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? '收起数据' : '展开数据'}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronDown className="w-4 h-4" />
              收起
            </>
          ) : (
            <>
              <ChevronRight className="w-4 h-4" />
              展开
            </>
          )}
        </button>
      </div>

      {/* 说明文字 */}
      <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
        <p className="text-sm text-indigo-800 dark:text-indigo-200 flex items-start gap-2">
          <Activity className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>技术参考：</strong>此区域显示AI从体检报告中提取的原始数据，
            供技术人员核对和调试使用。普通用户无需关注此部分内容。
          </span>
        </p>
      </div>

      {/* 文件名（如果有） */}
      {fileName && (
        <div className="mb-3 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <FileText className="w-4 h-4" />
          <span className="font-medium">文件：</span>
          <span className="font-mono text-xs">{fileName}</span>
        </div>
      )}

      {/* 可折叠的数据内容 */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-zinc-950 dark:bg-zinc-950 rounded-lg p-4 max-h-[500px] overflow-y-auto border border-zinc-700">
          <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono leading-relaxed">
            {JSON.stringify(extractedData, null, 2)}
          </pre>
        </div>
      </div>

      {/* 数据统计信息 */}
      <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          数据条目：<strong className="text-zinc-700 dark:text-zinc-300">
            {typeof extractedData === 'object' ? Object.keys(extractedData).length : 1}
          </strong> 项
        </span>
        {typeof extractedData === 'object' && extractedData.indicators && (
          <span>
            指标数：<strong className="text-zinc-700 dark:text-zinc-300">
              {Array.isArray(extractedData.indicators) ? extractedData.indicators.length : 0}
            </strong> 个
          </span>
        )}
      </div>
    </div>
  );
}
