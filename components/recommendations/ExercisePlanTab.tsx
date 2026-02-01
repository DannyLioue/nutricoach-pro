'use client';

import { Dumbbell } from 'lucide-react';
import ExportButton from './ExportButton';
import ExercisePrescription from '@/components/ExercisePrescription';

interface ExercisePlanTabProps {
  recommendationId: string;
  clientName?: string;
  content: any;
}

export default function ExercisePlanTab({ recommendationId, clientName, content }: ExercisePlanTabProps) {
  const hasDetailedExercise = !!content.detailedExercisePrescription;
  const hasBasicExercise = !hasDetailedExercise && !!content.exercisePrescription;

  if (!hasDetailedExercise && !hasBasicExercise) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-8 text-center">
        <div className="text-zinc-500">暂无运动处方数据</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 导出按钮 - 仅在有详细运动处方时显示 */}
      {hasDetailedExercise && (
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-orange-600" />
            两周运动训练计划
          </h3>
          <ExportButton
            recommendationId={recommendationId}
            module="exercise-plan"
            clientName={clientName}
          />
        </div>
      )}

      {/* 内容区域 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6">
        {hasDetailedExercise ? (
          <ExercisePrescription data={content.detailedExercisePrescription} />
        ) : (
          <>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
              <Dumbbell className="w-6 h-6 text-orange-600" />
              运动处方
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {content.exercisePrescription?.cardio && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">有氧运动</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-1">
                    类型: {content.exercisePrescription.cardio.type}
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-1">
                    频率: {content.exercisePrescription.cardio.frequency}
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-1">
                    时长: {content.exercisePrescription.cardio.duration}
                  </p>
                </div>
              )}
              {content.exercisePrescription?.resistance && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">力量训练</h4>
                  <p className="text-sm text-orange-800 dark:text-orange-200 mb-1">
                    类型: {content.exercisePrescription.resistance.type}
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-200 mb-1">
                    频率: {content.exercisePrescription.resistance.frequency}
                  </p>
                </div>
              )}
              {content.exercisePrescription?.flexibility && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">柔韧性</h4>
                  <p className="text-sm text-purple-800 dark:text-purple-200 mb-1">
                    类型: {content.exercisePrescription.flexibility.type}
                  </p>
                  <p className="text-sm text-purple-800 dark:text-purple-200 mb-1">
                    频率: {content.exercisePrescription.flexibility.frequency}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
