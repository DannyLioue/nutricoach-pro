'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Sparkles, CheckCircle2, AlertCircle, Camera, Utensils, Brain, Save, Pause, Play, X } from 'lucide-react';
import type { TaskStatus as TaskStatusType } from '@/types';

interface UpdateSummaryConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<{ taskId: string; sseUrl: string }>;
  summaryName: string | null;
  mealGroupName: string;
  clientId: string;
  onSuccess?: () => void;
  onMealGroupUpdate?: (mealGroupId: string, data: { totalScore: number; overallRating: string; combinedAnalysis: any }) => void;
}

// 进度步骤配置 - 与后端 TASK_STEPS 保持一致
const STEPS = [
  { key: 'auth', icon: Loader2, label: '验证权限', progress: 5 },
  { key: 'fetch', icon: Utensils, label: '获取记录', progress: 10 },
  { key: 'validate', icon: CheckCircle2, label: '验证数据', progress: 15 },
  { key: 'recommendation', icon: Utensils, label: '获取方案', progress: 20 },
  { key: 'analyze', icon: Camera, label: '分析食谱', progress: 25 },
  { key: 'analyzing', icon: Camera, label: '分析中', progress: 30 },
  { key: 'health', icon: CheckCircle2, label: '体检数据', progress: 70 },
  { key: 'prepare', icon: Loader2, label: '准备数据', progress: 75 },
  { key: 'generate', icon: Brain, label: 'AI 生成', progress: 80 },
  { key: 'save', icon: Save, label: '保存结果', progress: 95 },
  { key: 'complete', icon: CheckCircle2, label: '完成', progress: 100 },
];

interface StepConfig {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  progress: number;
}

function getStepConfig(step: string): StepConfig {
  return STEPS.find(s => s.key === step) || { key: 'default', icon: Loader2, label: '处理中', progress: 0 };
}

function getStepStatus(stepKey: string, currentStep: string, completedSteps: string[]): 'pending' | 'running' | 'completed' {
  if (completedSteps.includes(stepKey)) return 'completed';
  if (stepKey === currentStep) return 'running';
  return 'pending';
}

export default function UpdateSummaryConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  summaryName,
  mealGroupName,
  clientId,
  onSuccess,
  onMealGroupUpdate,
}: UpdateSummaryConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 任务相关状态
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatusType | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // 进度状态
  const [currentStep, setCurrentStep] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [stepDetails, setStepDetails] = useState<any>(null);
  const [error, setError] = useState('');
  const [showDetailedProgress, setShowDetailedProgress] = useState(false);

  // EventSource 引用
  const eventSourceRef = useRef<EventSource | null>(null);

  // 清理 EventSource
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // 确保组件已挂载（用于 createPortal）
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setShowProgress(false);
      setTaskId(null);
      setTaskStatus(null);
      setCompletedSteps([]);
      setCurrentStep('');
      setProgress(0);
      setProgressMessage('');
      setStepDetails(null);
      setError('');
      setShowDetailedProgress(false);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }
  }, [isOpen]);

  // 连接到 SSE
  const connectToSSE = useCallback((taskId: string, sseUrl: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'progress') {
          setCurrentStep(data.step || '');
          setProgress(data.progress || 0);
          setProgressMessage(data.message || '');
          setStepDetails(data.data || null);
          setTaskStatus('RUNNING');
        } else if (data.type === 'stepComplete') {
          setCompletedSteps(data.completedSteps || []);
        } else if (data.type === 'mealGroupUpdated') {
          // 食谱组已更新，通知父组件
          onMealGroupUpdate?.(data.data.mealGroupId, {
            totalScore: data.data.totalScore,
            overallRating: data.data.overallRating,
            combinedAnalysis: data.data.combinedAnalysis,
          });
        } else if (data.type === 'paused') {
          setTaskStatus('PAUSED');
          eventSource.close();
        } else if (data.type === 'done') {
          eventSource.close();
          setTaskStatus('COMPLETED');
          setProgress(100);
          setProgressMessage('完成！');
          setTimeout(() => {
            onSuccess?.();
            onClose();
          }, 500);
        } else if (data.type === 'error') {
          eventSource.close();
          setTaskStatus('FAILED');
          setError(data.error || '更新失败');
        } else if (data.type === 'cancelled') {
          eventSource.close();
          setTaskStatus('CANCELLED');
          onClose();
        }
      } catch (err) {
        console.error('Failed to parse SSE data:', err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      if (taskStatus !== 'PAUSED') {
        setError('连接中断，请重试');
        setTaskStatus('FAILED');
      }
    };
  }, [onSuccess, onClose, taskStatus, onMealGroupUpdate]);

  // 暂停任务
  const handlePause = useCallback(async () => {
    if (!taskId) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/weekly-diet-summary/task/${taskId}`, {
        method: 'POST',
      });

      if (response.ok) {
        setTaskStatus('PAUSED');
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
      }
    } catch (err) {
      console.error('Failed to pause task:', err);
    }
  }, [taskId, clientId]);

  // 恢复任务
  const handleResume = useCallback(async () => {
    if (!taskId) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/weekly-diet-summary/task/${taskId}/resume`, {
        method: 'POST',
      });

      if (response.ok) {
        // 重新获取任务信息并连接 SSE
        const sseUrl = `/api/clients/${clientId}/weekly-diet-summary/task/${taskId}/stream`;
        connectToSSE(taskId, sseUrl);
      }
    } catch (err) {
      console.error('Failed to resume task:', err);
    }
  }, [taskId, clientId, connectToSSE]);

  // 取消任务
  const handleCancel = useCallback(async () => {
    if (!taskId) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/weekly-diet-summary/task/${taskId}/cancel`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        onClose();
      }
    } catch (err) {
      console.error('Failed to cancel task:', err);
    }
  }, [taskId, clientId, onClose]);

  // 确认并开始更新
  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const result = await onConfirm();
      setTaskId(result.taskId);
      setShowProgress(true);
      // 连接到 SSE 流
      connectToSSE(result.taskId, result.sseUrl);
    } catch (err: any) {
      setError(err.message || '启动任务失败');
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;
  if (!isMounted) return null;

  const StepIcon = getStepConfig(currentStep).icon;
  const isRunning = taskStatus === 'RUNNING';
  const isPaused = taskStatus === 'PAUSED';
  const isFailed = taskStatus === 'FAILED';

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div
        className="glass rounded-2xl shadow-xl max-w-lg w-full flex flex-col max-h-[85vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex-shrink-0 overflow-y-auto">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--color-primary-800)' }}>
              {showProgress ? '更新饮食汇总' : '确认更新'}
            </h3>
            <button
              onClick={onClose}
              disabled={isRunning || isPaused || isConfirming}
              className="p-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-bg-200)' }}
            >
              <X className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
            </button>
          </div>

          {/* 进度显示 */}
          {(isRunning || isPaused || isFailed || progress > 0) && (
            <div className="mb-6 p-4 rounded-xl" style={{
              backgroundColor: isFailed
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(16, 185, 129, 0.1)',
              border: isFailed
                ? '1px solid rgba(239, 68, 68, 0.2)'
                : '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              {/* 进度条 */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium" style={{
                    color: isFailed ? '#dc2626' : '#059669'
                  }}>
                    {isPaused ? '任务已暂停' : progressMessage}
                  </span>
                  <span className="font-mono" style={{ color: 'var(--color-text-muted)' }}>
                    {progress}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{
                  backgroundColor: isFailed
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(16, 185, 129, 0.2)'
                }}>
                  <div
                    className="h-full transition-all duration-300 ease-out rounded-full"
                    style={{
                      width: `${progress}%`,
                      background: isFailed
                        ? '#ef4444'
                        : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                    }}
                  />
                </div>
              </div>

              {/* 当前步骤 */}
              <div className="flex items-center gap-2 text-sm mb-2">
                {currentStep === 'analyzing' && stepDetails ? (
                  <>
                    <Camera className="w-4 h-4 animate-pulse" style={{ color: '#10b981' }} />
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      正在分析 <span className="font-medium">{stepDetails.mealName}</span>
                      ({stepDetails.current}/{stepDetails.total})
                    </span>
                  </>
                ) : currentStep === 'generate' && stepDetails ? (
                  <>
                    <Brain className="w-4 h-4 animate-pulse" style={{ color: '#059669' }} />
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      分析 {stepDetails.mealCount} 餐记录，{stepDetails.photoCount} 张照片
                    </span>
                  </>
                ) : isPaused ? (
                  <>
                    <Pause className="w-4 h-4 text-amber-500" />
                    <span style={{ color: 'var(--color-text-secondary)' }}>任务已暂停</span>
                  </>
                ) : (
                  <>
                    <div className="inline-flex">
                      <StepIcon className={`w-4 h-4 ${currentStep === 'generate' ? 'animate-pulse' : ''} text-emerald-600`} />
                    </div>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      {getStepConfig(currentStep).label}
                    </span>
                  </>
                )}
              </div>

              {/* 详细进度展开按钮 */}
              {completedSteps.length > 0 && (
                <button
                  onClick={() => setShowDetailedProgress(!showDetailedProgress)}
                  className="text-xs underline mt-2 hover:opacity-80"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {showDetailedProgress ? '隐藏' : '显示'}详细进度
                </button>
              )}

              {/* 详细进度列表 */}
              {showDetailedProgress && completedSteps.length > 0 && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                  <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    已完成步骤 ({completedSteps.length}/{STEPS.length}):
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {STEPS.map((step) => {
                      const status = getStepStatus(step.key, currentStep, completedSteps);
                      return (
                        <div
                          key={step.key}
                          className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                            status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : status === 'running'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                          {status === 'running' && <Loader2 className="w-3 h-3 animate-spin" />}
                          {step.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 确认对话框内容 */}
          {!showProgress && !isFailed && (
            <div className="space-y-3 mb-6">
              <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                食谱组 <span className="font-medium">"{mealGroupName}"</span> 已重新分析完成。
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                是否更新关联的饮食汇总？
              </p>
              {summaryName && (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  汇总名称：{summaryName}
                </p>
              )}
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-3 rounded-xl text-sm flex items-start gap-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">更新失败</div>
                <div className="mt-1 opacity-90">{error}</div>
              </div>
            </div>
          )}

          {/* 按钮组 */}
          <div className="flex gap-3">
            {!showProgress && !isFailed ? (
              // 确认状态
              <>
                <button
                  onClick={onClose}
                  disabled={isConfirming}
                  className="flex-1 px-4 py-2.5 rounded-xl border font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: 'var(--color-primary-300)', color: 'var(--color-text-primary)' }}
                >
                  暂不更新
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="flex-1 px-4 py-2.5 text-white font-medium rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  {isConfirming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      启动中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      立即更新
                    </>
                  )}
                </button>
              </>
            ) : isPaused ? (
              // 暂停状态
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border font-medium transition-all hover:scale-105"
                  style={{ borderColor: 'var(--color-primary-300)', color: 'var(--color-text-primary)' }}
                >
                  关闭
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 rounded-xl border font-medium transition-all hover:scale-105"
                  style={{ borderColor: '#ef4444', color: '#ef4444' }}
                >
                  取消任务
                </button>
                <button
                  onClick={handleResume}
                  className="flex-1 px-4 py-2.5 text-white font-medium rounded-xl transition-all hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  <Play className="w-4 h-4" />
                  继续更新
                </button>
              </>
            ) : isFailed ? (
              // 失败状态 - 支持断点续传
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border font-medium transition-all hover:scale-105"
                  style={{ borderColor: 'var(--color-primary-300)', color: 'var(--color-text-primary)' }}
                >
                  关闭
                </button>
                <button
                  onClick={handleResume}
                  className="flex-1 px-4 py-2.5 text-white font-medium rounded-xl transition-all hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                >
                  <Play className="w-4 h-4" />
                  重试继续
                </button>
              </>
            ) : (
              // 运行中状态
              <>
                <button
                  onClick={handlePause}
                  disabled={!isRunning}
                  className="flex-1 px-4 py-2.5 rounded-xl border font-medium transition-all hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ borderColor: '#f59e0b', color: '#f59e0b' }}
                >
                  <Pause className="w-4 h-4" />
                  暂停
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!isRunning}
                  className="flex-1 px-4 py-2.5 rounded-xl border font-medium transition-all hover:scale-105 disabled:opacity-50"
                  style={{ borderColor: '#ef4444', color: '#ef4444' }}
                >
                  取消
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
