'use client';

import TwoWeekPlan from '@/components/TwoWeekPlan';
import ExportButton from './ExportButton';
import { Calendar } from 'lucide-react';

interface ActionPlanTabProps {
  recommendationId: string;
  clientName?: string;
  content: any;
}

export default function ActionPlanTab({ recommendationId, clientName, content }: ActionPlanTabProps) {
  const twoWeekPlan = content.twoWeekPlan;
  const followUpPlan = content.followUpPlan;

  if (!twoWeekPlan && !followUpPlan) {
    return (
      <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>暂无执行计划数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 导出按钮 */}
      <div className="flex justify-end">
        <ExportButton
          recommendationId={recommendationId}
          module="action-plan"
          clientName={clientName}
        />
      </div>
      {/* 两周改善计划 */}
      {twoWeekPlan && (
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            两周211饮食法改善计划
          </h3>
          <TwoWeekPlan data={twoWeekPlan} />
        </div>
      )}

      {/* 随访计划 */}
      {followUpPlan && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">随访计划</h3>
          {followUpPlan.timeline && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>随访时间:</strong> {followUpPlan.timeline}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
