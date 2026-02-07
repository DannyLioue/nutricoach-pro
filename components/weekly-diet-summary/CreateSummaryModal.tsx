'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Sparkles, X, CheckCircle2, AlertCircle, Camera, Utensils, Brain, Save, Pause, Play, RotateCcw } from 'lucide-react';
import DietSummaryDateRangePicker from './DietSummaryDateRangePicker';
import type { TaskStatus as TaskStatusType } from '@/types';

interface CreateSummaryModalProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

// 步骤配置类型
interface StepConfig {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  progress: number;
}

// 计算快捷日期范围
function getDateRange(range: 'today' | 'thisWeek' | 'lastWeek' | 'last7Days'): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (range) {
    case 'today':
      return { start: today, end: today };
    case 'thisWeek': {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today);
      monday.setDate(diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { start: monday, end: sunday };
    }
    case 'lastWeek': {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const thisMonday = new Date(today);
      thisMonday.setDate(diff);
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      return { start: lastMonday, end: lastSunday };
    }
    case 'last7Days': {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return { start, end: today };
    }
    default:
      return { start: today, end: today };
  }
}

// 格式化日期为 YYYY-MM-DD（使用本地时间，避免时区问题）
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 获取步骤配置
function getStepConfig(step: string): StepConfig {
  return STEPS.find(s => s.key === step) || { key: 'default', icon: Loader2, label: '处理中', progress: 0 };
}

// 获取步骤状态
function getStepStatus(stepKey: string, currentStep: string, completedSteps: string[]): 'pending' | 'running' | 'completed' {
  if (completedSteps.includes(stepKey)) return 'completed';
  if (stepKey === currentStep) return 'running';
  return 'pending';
}

export default function CreateSummaryModal({ clientId, isOpen, onClose, onSuccess }: CreateSummaryModalProps) {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [summaryName, setSummaryName] = useState('');
  const [error, setError] = useState('');
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
  const [showDetailedProgress, setShowDetailedProgress] = useState(false);

  // EventSource 引用
  const eventSourceRef = useRef<EventSource | null>(null);

  // 客户端挂载检测
  useEffect(() => {
    setIsMounted(true);
    return () => {
      // 清理 EventSource
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // 重置表单
  useEffect(() => {
    if (isOpen) {
      // 打开时重置所有状态
      const { start, end } = getDateRange('last7Days');
      setStartDate(start);
      setEndDate(end);
      setSummaryName('');
      setError('');
      setTaskId(null);
      setTaskStatus(null);
      setCompletedSteps([]);
      setCurrentStep('');
      setProgress(0);
      setProgressMessage('');
      setStepDetails(null);
      setShowDetailedProgress(false);
    } else {
      // 关闭时也重置，确保下次打开时是干净状态
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setTaskId(null);
      setTaskStatus(null);
      setCompletedSteps([]);
      setCurrentStep('');
      setProgress(0);
      setProgressMessage('');
      setStepDetails(null);
    }
  }, [isOpen]);

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
        // 重新连接 SSE
        connectToSSE(taskId);
      }
    } catch (err) {
      console.error('Failed to resume task:', err);
    }
  }, [taskId, clientId]);

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

  // 连接到 SSE
  const connectToSSE = useCallback((taskId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/clients/${clientId}/weekly-diet-summary/task/${taskId}/stream`);
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
        } else if (data.type === 'paused') {
          setTaskStatus('PAUSED');
          eventSource.close();
        } else if (data.type === 'done') {
          eventSource.close();
          setTaskStatus('COMPLETED');
          setProgress(100);
          setProgressMessage('完成！');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 500);
        } else if (data.type === 'error') {
          eventSource.close();
          setTaskStatus('FAILED');
          setError(data.error || '生成失败');
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
  }, [clientId, onSuccess, onClose, taskStatus]);

  const handleQuickSelect = (range: 'today' | 'thisWeek' | 'lastWeek' | 'last7Days') => {
    const { start, end } = getDateRange(range);
    setStartDate(start);
    setEndDate(end);
  };

  const handleGenerate = async () => {
    setError('');
    setProgress(0);
    setProgressMessage('准备生成...');
    setShowDetailedProgress(true);

    try {
      // 启动新任务
      const response = await fetch(`/api/clients/${clientId}/weekly-diet-summary/task/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          summaryName: summaryName || undefined,
          summaryType: 'custom',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '启动任务失败');
      }

      const data = await response.json();
      const newTaskId = data.taskId;

      setTaskId(newTaskId);
      setTaskStatus(data.status);

      // 连接到 SSE 流
      connectToSSE(newTaskId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;
  if (!isMounted) return null;

  const StepIcon = getStepConfig(currentStep).icon;
  const isRunning = taskStatus === 'RUNNING';
  const isPaused = taskStatus === 'PAUSED';
  const isFailed = taskStatus === 'FAILED';
  const canPause = isRunning;
  const canResume = isPaused;
  const canCancel = isRunning || isPaused || isFailed;

  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="glass rounded-2xl shadow-xl max-w-lg w-full flex flex-col max-h-[85vh] my-auto">
        <div className="p-6 flex-shrink-0 overflow-y-auto">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--color-primary-800)' }}>
              创建饮食汇总
            </h3>
            <button
              onClick={onClose}
              disabled={isRunning || isPaused}
              className="p-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-bg-200)' }}
              onMouseEnter={(e) => !isRunning && !isPaused && (e.currentTarget.style.backgroundColor = 'var(--color-bg-300)')}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-200)'}
            >
              <X className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
            </button>
          </div>

          {/* 进度显示 */}
          {(isRunning || isPaused || isFailed || progress > 0) && (
            <div className="mb-6 p-4 rounded-xl" style={{
              backgroundColor: isFailed
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(59, 130, 246, 0.1)',
              border: isFailed
                ? '1px solid rgba(239, 68, 68, 0.2)'
                : '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              {/* 进度条 */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium" style={{
                    color: isFailed ? '#dc2626' : 'var(--color-primary-700)'
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
                    : 'rgba(59, 130, 246, 0.2)'
                }}>
                  <div
                    className="h-full transition-all duration-300 ease-out rounded-full"
                    style={{
                      width: `${progress}%`,
                      background: isFailed
                        ? '#ef4444'
                        : 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                    }}
                  />
                </div>
              </div>

              {/* 当前步骤 */}
              <div className="flex items-center gap-2 text-sm mb-2">
                {currentStep === 'analyzing' && stepDetails ? (
                  <>
                    <Camera className="w-4 h-4 animate-pulse" style={{ color: '#3b82f6' }} />
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      正在分析 <span className="font-medium">{stepDetails.mealName}</span>
                      ({stepDetails.current}/{stepDetails.total})
                    </span>
                  </>
                ) : currentStep === 'generate' && stepDetails ? (
                  <>
                    <Brain className="w-4 h-4 animate-pulse" style={{ color: '#8b5cf6' }} />
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      分析 {stepDetails.mealCount} 餐记录，{stepDetails.photoCount} 张照片
                    </span>
                  </>
                ) : currentStep === 'analyze' && stepDetails ? (
                  <>
                    <Camera className="w-4 h-4" style={{ color: '#3b82f6' }} />
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      发现 {stepDetails.unanalyzedCount} 个未分析的食谱组
                    </span>
                  </>
                ) : isPaused ? (
                  <>
                    <Pause className="w-4 h-4" style={{ color: '#f59e0b' }} />
                    <span style={{ color: 'var(--color-text-secondary)' }}>任务已暂停</span>
                  </>
                ) : (
                  <>
                    <div className="inline-flex">
                      <StepIcon className={`w-4 h-4 ${currentStep === 'generate' ? 'animate-pulse' : ''} text-blue-500`} />
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
                              ? 'bg-blue-100 text-blue-700'
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

          {/* 表单区域 - 仅在未开始任务时显示 */}
          {!taskId && !isFailed && (
            <>
              {/* 日期选择器 */}
              <div className="mb-6">
                <DietSummaryDateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  onQuickSelect={handleQuickSelect}
                  maxDays={7}
                  disabled={false}
                />
              </div>

              {/* 汇总名称 */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  汇总名称（可选）
                </label>
                <input
                  type="text"
                  value={summaryName}
                  onChange={(e) => setSummaryName(e.target.value)}
                  placeholder="例如：第一周汇总、春节假期饮食"
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 bg-white"
                  style={{ borderColor: 'var(--color-primary-300)' }}
                  maxLength={100}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  留空将自动生成名称
                </p>
              </div>
            </>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-3 rounded-xl text-sm flex items-start gap-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">生成失败</div>
                <div className="mt-1 opacity-90">{error}</div>
              </div>
            </div>
          )}

          {/* 按钮组 */}
          <div className="flex gap-3">
            {!taskId && !isFailed ? (
              // 初始状态：取消和生成按钮
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border font-medium transition-all hover:scale-105"
                  style={{ borderColor: 'var(--color-primary-300)', color: 'var(--color-text-primary)' }}
                >
                  取消
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex-1 px-4 py-2.5 text-white font-medium rounded-xl transition-all hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-700) 100%)' }}
                >
                  <Sparkles className="w-4 h-4" />
                  生成汇总
                </button>
              </>
            ) : isPaused ? (
              // 暂停状态：关闭、继续、取消
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
                  继续生成
                </button>
              </>
            ) : isFailed ? (
              // 失败状态：关闭和重试
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border font-medium transition-all hover:scale-105"
                  style={{ borderColor: 'var(--color-primary-300)', color: 'var(--color-text-primary)' }}
                >
                  关闭
                </button>
                <button
                  onClick={() => {
                    setTaskId(null);
                    setTaskStatus(null);
                    setError('');
                    setProgress(0);
                  }}
                  className="flex-1 px-4 py-2.5 text-white font-medium rounded-xl transition-all hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                >
                  <RotateCcw className="w-4 h-4" />
                  重试
                </button>
              </>
            ) : (
              // 运行中状态：暂停和取消
              <>
                <button
                  onClick={handlePause}
                  disabled={!canPause}
                  className="flex-1 px-4 py-2.5 rounded-xl border font-medium transition-all hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ borderColor: '#f59e0b', color: '#f59e0b' }}
                >
                  <Pause className="w-4 h-4" />
                  暂停
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!canCancel}
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
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
