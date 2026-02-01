/**
 * 健康分析类型定义
 * 用于体检报告分析页面的结构化展示
 */

/**
 * 健康状态等级
 */
export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor';

/**
 * 健康状况摘要
 */
export interface HealthSummary {
  /** 整体状态 */
  status: HealthStatus;
  /** 状态标题 */
  title: string;
  /** 状态描述 */
  description: string;
  /** 关键发现（3-5个要点） */
  keyFindings: string[];
  /** 优先建议 */
  priorities: string[];
}

/**
 * 从原始分析数据转换为健康摘要
 */
export interface RawAnalysisData {
  summary?: string;
  healthScore?: number;
  indicators?: Array<{
    name: string;
    status: string;
    priority?: string;
    intervention?: string;
    clinicalSignificance?: string;
    risk?: string;
  }>;
  riskFactors?: Array<{
    factor: string;
    level: string;
    mitigation?: string;
  }>;
}

/**
 * 组件 Props
 */
export interface HealthSummaryCardProps {
  analysis: RawAnalysisData;
  className?: string;
}

export interface OCRDataDisplayProps {
  extractedData: any;
  fileName?: string;
  className?: string;
}
