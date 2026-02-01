'use client';

import ExportButton from './ExportButton';
import { Pill } from 'lucide-react';

interface SupplementsTabProps {
  recommendationId: string;
  clientName?: string;
  content: any;
}

export default function SupplementsTab({ recommendationId, clientName, content }: SupplementsTabProps) {
  const supplements = content.supplements || [];

  if (supplements.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
        <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>暂无补充剂推荐</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 导出按钮 */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Pill className="w-6 h-6 text-amber-600" />
          补充剂处方
        </h3>
        <ExportButton
          recommendationId={recommendationId}
          module="supplements"
          clientName={clientName}
        />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {supplements.map((item: any, idx: number) => (
          <div key={idx} className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">{item.name}</h4>
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-1">
              <strong>剂量:</strong> {item.dosage}
            </p>
            {item.duration && (
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-1">
                <strong>周期:</strong> {item.duration}
              </p>
            )}
            {item.notes && (
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                <strong>备注:</strong> {item.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
