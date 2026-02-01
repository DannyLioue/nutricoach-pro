'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  recommendationId: string;
  module: 'overview' | 'health-analysis' | 'food-guide' | 'exercise-plan' | 'action-plan' | 'supplements';
  clientName?: string;
  label?: string;
  className?: string;
}

const MODULE_LABELS: Record<ExportButtonProps['module'], string> = {
  'overview': '总览',
  'health-analysis': '健康分析',
  'food-guide': '红绿灯食物指南',
  'exercise-plan': '运动处方',
  'action-plan': '两周执行计划',
  'supplements': '补充剂清单',
};

const MODULE_FILENAMES: Record<ExportButtonProps['module'], string> = {
  'overview': '营养方案总览',
  'health-analysis': '健康分析报告',
  'food-guide': '红绿灯食物指南',
  'exercise-plan': '运动处方',
  'action-plan': '两周执行计划',
  'supplements': '补充剂清单',
};

export default function ExportButton({
  recommendationId,
  module,
  clientName,
  label,
  className = '',
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch(
        `/api/recommendations/${recommendationId}/export/pdf?type=${module}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // 生成文件名
      const filename = clientName 
        ? `${MODULE_FILENAMES[module]}-${clientName}.pdf`
        : `${MODULE_FILENAMES[module]}.pdf`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('导出PDF失败:', error);
      alert(`导出失败: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={`
        flex items-center gap-2 px-4 py-2 
        bg-emerald-600 hover:bg-emerald-700 
        disabled:bg-emerald-400 disabled:cursor-not-allowed
        text-white text-sm font-medium rounded-lg 
        transition-colors
        ${className}
      `}
    >
      <Download className="w-4 h-4" />
      {exporting ? '导出中...' : (label || `导出${MODULE_LABELS[module]}`)}
    </button>
  );
}
