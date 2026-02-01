interface NutritionInterventionSummaryProps {
  content: any;
  clientName: string;
}

export function NutritionInterventionSummary({ content, clientName }: NutritionInterventionSummaryProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">营养干预方案</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          客户: {clientName}
        </p>
        {content.dailyTargets && (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">每日目标</h3>
            <pre className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg overflow-auto">
              {JSON.stringify(content.dailyTargets, null, 2)}
            </pre>
          </div>
        )}
        {content.biomarkerInterventionMapping && (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">生物标志物干预</h3>
            <pre className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg overflow-auto">
              {JSON.stringify(content.biomarkerInterventionMapping, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
