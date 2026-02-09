'use client';

import { Camera, FileText } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';

interface AnalysisScoreCardProps {
  avgScore: number;
  overallRating?: '优秀' | '良好' | '一般' | '需改善';
  analyzedPhotos: number;
  totalPhotos: number;
  analysisSource?: 'photos' | 'text' | 'both';
}

/**
 * 分析评分卡片组件
 * 显示综合评分、评级和分析进度
 */
export default function AnalysisScoreCard({
  avgScore,
  overallRating,
  analyzedPhotos,
  totalPhotos,
  analysisSource,
}: AnalysisScoreCardProps) {
  // 获取评级颜色配置
  const getRatingConfig = () => {
    switch (overallRating) {
      case '优秀':
        return {
          colorClass: 'text-green-600',
          bgClass: 'bg-green-50 border-green-200',
          circleBg: 'bg-green-100',
        };
      case '良好':
        return {
          colorClass: 'text-blue-600',
          bgClass: 'bg-blue-50 border-blue-200',
          circleBg: 'bg-blue-100',
        };
      case '一般':
        return {
          colorClass: 'text-yellow-600',
          bgClass: 'bg-yellow-50 border-yellow-200',
          circleBg: 'bg-yellow-100',
        };
      case '需改善':
        return {
          colorClass: 'text-red-600',
          bgClass: 'bg-red-50 border-red-200',
          circleBg: 'bg-red-100',
        };
      default:
        return {
          colorClass: 'text-zinc-600',
          bgClass: 'bg-zinc-50 border-zinc-200',
          circleBg: 'bg-zinc-100',
        };
    }
  };

  const config = getRatingConfig();

  // 获取数据来源标签
  const getSourceLabel = () => {
    switch (analysisSource) {
      case 'photos':
        return '照片分析';
      case 'text':
        return '文字描述';
      case 'both':
        return '照片 + 文字';
      default:
        return '未知';
    }
  };

  return (
    <div className={`rounded-xl border p-4 ${config.bgClass}`}>
      <div className="flex items-center justify-between gap-4">
        {/* 评分圆圈 */}
        <div className={`relative w-20 h-20 rounded-full ${config.circleBg} flex items-center justify-center`}>
          <div className="text-center">
            <div className={`text-3xl font-bold ${config.colorClass}`}>
              {avgScore.toFixed(0)}
            </div>
            <div className="text-xs text-zinc-500">分</div>
          </div>
        </div>

        {/* 评级徽章 */}
        {overallRating && (
          <div className={`px-3 py-1.5 rounded-lg border ${config.bgClass}`}>
            <div className={`text-lg font-semibold ${config.colorClass}`}>
              {overallRating}
            </div>
          </div>
        )}

        {/* 分析进度 */}
        <div className="text-center">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">分析进度</div>
          <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {analyzedPhotos}/{totalPhotos}
          </div>
          <div className="text-xs text-zinc-500">张照片</div>
        </div>

        {/* 数据来源 */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            {analysisSource === 'text' ? (
              <FileText className="w-4 h-4 text-zinc-500" />
            ) : (
              <Camera className="w-4 h-4 text-zinc-500" />
            )}
            <span className="text-xs text-zinc-500">{getSourceLabel()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
