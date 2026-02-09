/**
 * 任务进度跟踪相关类型定义
 * 用于支持周饮食汇总等长时间运行任务的断点续传功能
 */

import type { TaskStatus as PrismaTaskStatus } from '@prisma/client';

// 重新导出作为值
export const TaskStatus = {
  PENDING: 'PENDING' as const,
  RUNNING: 'RUNNING' as const,
  PAUSED: 'PAUSED' as const,
  COMPLETED: 'COMPLETED' as const,
  FAILED: 'FAILED' as const,
  CANCELLED: 'CANCELLED' as const,
};

export type TaskStatus = PrismaTaskStatus;

/**
 * 任务类型
 */
export type TaskType =
  | 'weekly-summary'              // 周饮食汇总生成
  | 'incremental-summary-update'  // 增量更新饮食汇总
  | 'meal-analysis'               // 单个食谱组分析
  | 'health-analysis'             // 体检报告分析
  | 'recommendation';             // 营养干预方案生成

/**
 * 任务步骤定义
 */
export const TASK_STEPS = {
  'weekly-summary': [
    { key: 'auth', label: '验证权限', progress: 5 },
    { key: 'fetch', label: '获取记录', progress: 10 },
    { key: 'validate', label: '验证数据', progress: 15 },
    { key: 'recommendation', label: '获取方案', progress: 20 },
    { key: 'analyze', label: '分析食谱', progress: 25, rangeEnd: 65 },
    { key: 'health', label: '体检数据', progress: 70 },
    { key: 'prepare', label: '准备数据', progress: 75 },
    { key: 'generate', label: 'AI 生成', progress: 80 },
    { key: 'save', label: '保存结果', progress: 95 },
    { key: 'complete', label: '完成', progress: 100 },
  ] as const,
} as const;

/**
 * 周饮食汇总任务参数
 */
export interface WeeklySummaryTaskParameters {
  clientId: string;
  startDate: string;      // YYYY-MM-DD
  endDate: string;        // YYYY-MM-DD
  summaryName?: string;
  summaryType: 'week' | 'custom';
  mealGroupIds?: string[];
  forceRegenerate?: boolean; // 是否强制重新生成所有食谱组（忽略已分析状态）
}

/**
 * 周饮食汇总中间数据
 */
export interface WeeklySummaryIntermediateData {
  // 已分析的食谱组ID
  analyzedGroupIds?: string[];

  // 当前正在分析的食谱组ID
  currentGroupId?: string;

  // 营养方案ID
  recommendationId?: string;

  // 体检分析数据
  healthAnalysis?: any;

  // 已获取的食谱组数据
  mealGroups?: Array<{
    id: string;
    date: string;
    name: string;
    mealType: string;
    totalScore?: number | null;
    overallRating?: string | null;
    combinedAnalysis?: any;
  }>;

  // 总照片数
  totalPhotos?: number;

  // AI 生成结果（在 generate 步骤生成，在 save 步骤使用）
  resultData?: any;
}

/**
 * 周饮食汇总结果数据
 */
export interface WeeklySummaryResultData {
  summaryId: string;
  summary: any;
}

/**
 * 通用任务参数
 */
export type TaskParameters = WeeklySummaryTaskParameters | IncrementalUpdateTaskParameters;

/**
 * 通用中间数据
 */
export type TaskIntermediateData = WeeklySummaryIntermediateData | IncrementalUpdateIntermediateData;

/**
 * 通用结果数据
 */
export type TaskResultData = WeeklySummaryResultData;

/**
 * 增量更新饮食汇总任务参数
 */
export interface IncrementalUpdateTaskParameters {
  summaryId: string;      // 要更新的汇总ID
  clientId: string;
  skipGroupIds: string[];     // 跳过的食谱组ID（未变化的）
  analyzeGroupIds: string[];  // 需要分析的食谱组ID（有变化的）
}

/**
 * 增量更新饮食汇总中间数据
 * 与 WeeklySummaryIntermediateData 结构相同，但包含已跳过的食谱组数据
 */
export interface IncrementalUpdateIntermediateData {
  // 已分析的食谱组ID
  analyzedGroupIds?: string[];

  // 当前正在分析的食谱组ID
  currentGroupId?: string;

  // 营养方案ID
  recommendationId?: string;

  // 体检分析数据
  healthAnalysis?: any;

  // 已获取的食谱组数据（包括跳过的和新分析的）
  mealGroups?: Array<{
    id: string;
    date: string;
    name: string;
    mealType: string;
    totalScore?: number | null;
    overallRating?: string | null;
    combinedAnalysis?: any;
  }>;

  // 跳过的食谱组数据（直接使用已有分析结果）
  skippedGroups?: Array<{
    id: string;
    combinedAnalysis: any;
  }>;

  // 总照片数
  totalPhotos?: number;

  // AI 生成结果（在 generate 步骤生成，在 save 步骤使用）
  resultData?: any;
}

/**
 * 任务进度响应
 */
export interface TaskProgressResponse {
  id: string;
  clientId: string;
  taskType: TaskType;
  status: TaskStatus;
  currentStep?: string;
  progress: number;
  completedSteps: string[];
  error?: string;
  startedAt?: string;
  completedAt?: string;
  pausedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * SSE 事件类型
 */
export type TaskSSEEventType =
  | 'progress'        // 进度更新
  | 'stepComplete'    // 步骤完成
  | 'paused'          // 任务暂停
  | 'resumed'         // 任务恢复
  | 'cancelled'       // 任务取消
  | 'done'            // 任务完成
  | 'error';          // 错误

/**
 * SSE 事件数据
 */
export interface TaskSSEEvent {
  type: TaskSSEEventType;
  step?: string;
  progress?: number;
  message: string;
  completedSteps?: string[];
  data?: any;
  error?: string;
  recoverable?: boolean;
  taskId?: string;
  canResume?: boolean;
}

/**
 * 步骤进度信息
 */
export interface StepProgress {
  key: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'skipped';
  progress?: number;
  details?: string;
}

/**
 * 任务创建响应
 */
export interface TaskCreateResponse {
  success: boolean;
  taskId: string;
  status: TaskStatus;
  sseUrl: string;
}

/**
 * 任务状态查询响应
 */
export interface TaskStatusResponse {
  success: true;
  task: TaskProgressResponse;
}

/**
 * 任务操作响应
 */
export interface TaskOperationResponse {
  success: boolean;
  message: string;
  canResume?: boolean;
  cleanupData?: boolean;
}

/**
 * 任务配置选项
 */
export interface TaskOptions {
  maxRetries?: number;
  timeout?: number;
  heartbeatInterval?: number;
}
