'use client';

import { useState, useEffect } from 'react';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

interface GenerateRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  { label: '读取体检报告...', duration: 2000 },
  { label: '分析健康指标...', duration: 3000 },
  { label: '加载客户信息...', duration: 1500 },
  { label: 'AI 正在生成个性化建议...', duration: 5000 },
  { label: '保存建议到数据库...', duration: 1000 },
];

export default function GenerateRecommendationModal({
  isOpen,
  onClose,
}: GenerateRecommendationModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      startProgress();
    } else {
      setIsMounted(false);
    }
    return () => {};
  }, [isOpen]);

  const startProgress = () => {
    setCurrentStep(0);
    setProgress(0);

    let stepIndex = 0;
    let stepProgress = 0;
    const stepDuration = STEPS[0].duration;

    // 进度条动画 - 循环播放直到外部关闭
    const interval = setInterval(() => {
      stepProgress += 100;
      const totalProgress = ((stepIndex * 100) + stepProgress) / STEPS.length;
      setProgress(Math.min(totalProgress, 98)); // 最多到 98%，保留 2% 给真正的完成

      if (stepProgress >= stepDuration) {
        stepProgress = 0;
        stepIndex++;

        if (stepIndex < STEPS.length) {
          setCurrentStep(stepIndex);
        } else {
          // 完成一轮后，保持最后状态，继续循环最后一个步骤
          setCurrentStep(STEPS.length - 1);
          setProgress(98);
        }
      }
    }, 100);

    // 保存 interval ID 以便清理
    return () => clearInterval(interval);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl transition-all duration-300 ${
          isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                生成健康建议
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                AI 正在分析数据并生成个性化建议
              </p>
            </div>
          </div>
        </div>

        {/* 进度内容 */}
        <div className="px-6 py-6 space-y-6">
          {/* 进度条 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                {Math.round(progress)}%
              </span>
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                {STEPS[currentStep]?.label}
              </span>
            </div>
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 步骤列表 */}
          <div className="space-y-2">
            {STEPS.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 text-sm transition-colors ${
                  index === currentStep
                    ? 'text-blue-600 dark:text-blue-400 font-medium'
                    : index < currentStep
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-zinc-400 dark:text-zinc-600'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  index < currentStep
                    ? 'bg-green-500'
                    : index === currentStep
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-zinc-300 dark:bg-zinc-700'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  ) : index === currentStep ? (
                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-current" />
                  )}
                </div>
                <span>{step.label}</span>
              </div>
            ))}
          </div>

          {/* 提示 */}
          <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            请稍候，正在生成中...
          </div>
        </div>
      </div>
    </div>
  );
}
