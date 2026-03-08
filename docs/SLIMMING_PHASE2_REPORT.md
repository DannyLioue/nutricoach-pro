# Phase 2 结项报告（类型导出治理）

日期：2026-03-08

## 目标与范围

- 目标：收敛未使用的对外类型导出，明确 `public types` 与 `internal types` 边界。
- 范围：`types/index.ts`、`types/task-progress.ts`、`types/ai-config.ts`、`types/health-analysis.ts`。

## 已完成内容

- `types/task-progress.ts`
  - 下沉内部类型：`WeeklySummaryResultData`、`TaskIntermediateData`、`TaskResultData`、`StepProgress`、`TaskOptions`、`TaskSSEEventType`。
- `types/index.ts`
  - 移除对以上内部类型的 re-export。
  - 下沉一批仓内未消费的顶层导出类型（仅去除 `export`，不改结构）。
- `types/ai-config.ts`
  - 下沉未被仓内导入的实体/配置类型：`AIProviderType`、`AIProvider`、`AIModel`、`UserAIKey`、`AIModelConfig`、`AITaskConfig`。
- `types/health-analysis.ts`
  - 下沉 `HealthSummary`（仓内未导入）。

## 验证结果

- `npm run build`：通过
- `npx knip`：通过（`Unused exported types` 已清零）

## 结果评估

- 类型出口噪音显著降低，公共 API 面更清晰。
- 业务行为无变更，构建稳定。
- 变更按批次提交，具备回滚粒度。

## 关键提交

- `f2cccfa`：收敛 task-progress 公共导出类型
- `3e74284`：完成 Phase 2 其余未使用类型导出收敛

