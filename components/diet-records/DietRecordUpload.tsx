'use client';

import { useState } from 'react';
import { Camera, BarChart3, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DietRecordUploadProps {
  clientId: string;
  hasRecommendation: boolean;
  onQuickUploadClick: () => void;
  onMealGroupClick: () => void;
  isAnalyzing?: boolean;
}

/**
 * 统一的饮食记录上传组件
 * 包含两个上传入口：快速记录和合规评估
 */
export default function DietRecordUpload({
  clientId,
  hasRecommendation,
  onQuickUploadClick,
  onMealGroupClick,
  isAnalyzing = false,
}: DietRecordUploadProps) {
  return (
    <div className="space-y-4">
      {/* 上传方式选择 */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* 快速记录 */}
        <button
          onClick={onQuickUploadClick}
          disabled={isAnalyzing}
          className={cn(
            "relative p-6 border-2 border-dashed rounded-xl transition-all duration-200",
            "hover:border-emerald-400 hover:shadow-lg",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300"
          )}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
              <Camera className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">
                快速记录
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                日常饮食随手拍
              </p>
            </div>
            <div className="text-xs text-zinc-400 dark:text-zinc-500 space-y-1">
              <p>• 上传1-9张照片</p>
              <p>• 无需营养方案</p>
              <p>• 基础营养分析</p>
            </div>
            <div className="pt-2">
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                点击或拖拽上传 →
              </span>
            </div>
          </div>
        </button>

        {/* 合规评估 */}
        <button
          onClick={onMealGroupClick}
          disabled={!hasRecommendation || isAnalyzing}
          className={cn(
            "relative p-6 border-2 border-dashed rounded-xl transition-all duration-200",
            hasRecommendation
              ? "hover:border-purple-400 hover:shadow-lg"
              : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50",
            "disabled:cursor-not-allowed"
          )}
        >
          {!hasRecommendation && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-zinc-900/90 rounded-xl z-10">
              <div className="text-center p-4">
                <Sparkles className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  需要营养方案
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  请先生成干预方案
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center text-center space-y-3">
            <div className={cn(
              "p-3 rounded-full",
              hasRecommendation
                ? "bg-purple-100 dark:bg-purple-900/30"
                : "bg-gray-200 dark:bg-gray-700"
            )}>
              <BarChart3 className={cn(
                "w-6 h-6",
                hasRecommendation
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-gray-400"
              )} />
            </div>
            <div>
              <h3 className={cn(
                "font-semibold text-lg",
                hasRecommendation
                  ? "text-zinc-900 dark:text-zinc-100"
                  : "text-gray-400"
              )}>
                合规评估
              </h3>
              <p className={cn(
                "text-sm mt-1",
                hasRecommendation
                  ? "text-zinc-500 dark:text-zinc-400"
                  : "text-gray-400"
              )}>
                深度分析饮食合规性
              </p>
            </div>
            <div className="text-xs text-zinc-400 dark:text-zinc-500 space-y-1">
              <p>• 创建食谱组</p>
              <p>• 评估方案遵守情况</p>
              <p>• 红绿灯食物分析</p>
            </div>
            {hasRecommendation && (
              <div className="pt-2">
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  创建食谱组 →
                </span>
              </div>
            )}
          </div>
        </button>
      </div>

      {/* 功能说明 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          功能说明
        </h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <p className="font-medium mb-1">📸 快速记录</p>
            <p className="text-blue-700/80 dark:text-blue-300/80">
              适合日常饮食记录，了解客户的饮食习惯和偏好。无需营养方案即可使用。
            </p>
          </div>
          <div>
            <p className="font-medium mb-1">📊 合规评估</p>
            <p className="text-blue-700/80 dark:text-blue-300/80">
              评估饮食对营养干预方案的遵守情况。需要先生成营养干预方案后才能使用。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
