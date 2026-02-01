'use client';

import { useState } from 'react';
import {
  Dumbbell,
  Plus,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Target,
  Info,
  Play,
  ExternalLink,
} from 'lucide-react';
import type { DetailedExercisePrescription } from '@/types';
import { validateVideoUrl } from '@/lib/video-validator';
import { getPlatformInfo } from '@/lib/exercise-videos';

interface ExercisePrescriptionProps {
  data: DetailedExercisePrescription;
}

export default function ExercisePrescription({ data }: ExercisePrescriptionProps) {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const toggleDay = (day: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(day)) {
      newExpanded.delete(day);
    } else {
      newExpanded.add(day);
    }
    setExpandedDays(newExpanded);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'essential':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'helpful':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'optional':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'essential':
        return '必需';
      case 'helpful':
        return '推荐';
      case 'optional':
        return '可选';
      default:
        return '';
    }
  };

  const weeklySchedule = data.weeklySchedule.slice(0, 2);
  const selectedWeekData = weeklySchedule.find((w) => w.week === selectedWeek);

  return (
    <div className="space-y-6">
      {/* 概览 */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
        <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-3 flex items-center gap-2">
          <Target className="w-5 h-5" />
          整体运动策略
        </h3>
        <p className="text-sm text-emerald-800 dark:text-emerald-200">{data.overview}</p>
      </div>

      {/* 目标 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">训练目标</h3>
        <ul className="space-y-2">
          {data.goals.map((goal, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{goal}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 器材推荐 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <Dumbbell className="w-5 h-5" />
          运动器材
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 已有器材 */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">已有器材</h4>
            {data.equipment.owned.length > 0 ? (
              <ul className="space-y-2">
                {data.equipment.owned.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-500 italic">暂无器材信息</p>
            )}
          </div>

          {/* 推荐器材 */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
              推荐器材
            </h4>
            {data.equipment.recommended.length > 0 ? (
              <ul className="space-y-3">
                {data.equipment.recommended.map((item, index) => (
                  <li
                    key={index}
                    className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-medium text-sm text-zinc-800 dark:text-zinc-200">
                        {item.item}
                      </span>
                      {item.priority && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(item.priority)}`}
                        >
                          {getPriorityLabel(item.priority)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                      {item.reason}
                    </p>
                    {item.alternatives && item.alternatives.length > 0 && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-500">
                        <span className="font-medium">替代方案：</span>
                        {item.alternatives.join('、')}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-500 italic">暂无推荐</p>
            )}
          </div>
        </div>
      </div>

      {/* 周计划 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* 周切换器 */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-700">
          {weeklySchedule.map((week) => (
            <button
              key={week.week}
              onClick={() => setSelectedWeek(week.week)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                selectedWeek === week.week
                  ? 'bg-emerald-600 text-white'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              第{week.week}周
            </button>
          ))}
        </div>

        {/* 周内容 */}
        {selectedWeekData ? (
          <div className="p-6">
            <div className="mb-4">
              <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {selectedWeekData.focus}
              </h4>
              {selectedWeekData.notes && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  {selectedWeekData.notes}
                </p>
              )}
            </div>

            {/* 日训练 */}
            {selectedWeekData.days.length > 0 ? (
              <div className="space-y-3">
                {selectedWeekData.days.map((day, dayIndex) => {
                  const isExpanded = expandedDays.has(`${selectedWeek}-${day.day}`);
                  const isRestDay = day.type.includes('休息') || day.exercises.length === 0;

                  return (
                    <div
                      key={`${selectedWeek}-${day.day}`}
                      className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleDay(`${selectedWeek}-${day.day}`)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isRestDay
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                            }`}
                          >
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                              {day.day}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              {day.type} · {day.duration}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isRestDay && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {day.exercises.length} 个动作
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-zinc-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-zinc-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-700">
                          {day.focus && (
                            <div className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                              <span className="font-medium">重点：</span>
                              {day.focus}
                            </div>
                          )}

                          {day.exercises.length > 0 ? (
                            <div className="space-y-3">
                              {day.exercises.map((exercise, exerciseIndex) => {
                                // 验证视频链接（只使用AI生成的，不使用本地库）
                                const videoInfo = (exercise as any).videoUrl
                                  ? (() => {
                                      const validation = validateVideoUrl(
                                        (exercise as any).videoUrl,
                                        (exercise as any).videoPlatform
                                      );
                                      if (validation.isValid) {
                                        return {
                                          videoUrl: (exercise as any).videoUrl,
                                          videoPlatform: (exercise as any).videoPlatform || validation.platform || 'bilibili',
                                          videoTitle: (exercise as any).videoTitle || '动作教学视频',
                                        };
                                      }
                                      return null;
                                    })()
                                  : null;

                                return (
                                  <div
                                    key={exerciseIndex}
                                    className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <h5 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                                        {exercise.name}
                                      </h5>
                                      <div className="flex gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                                        <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
                                          {exercise.sets}组
                                        </span>
                                        <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
                                          {exercise.reps}次
                                        </span>
                                        <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
                                          休息{exercise.rest}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                      <div className="text-zinc-700 dark:text-zinc-300">
                                        <span className="font-medium">强度：</span>
                                        {exercise.intensity}
                                      </div>

                                      {exercise.targetMuscle && (
                                        <div className="text-zinc-700 dark:text-zinc-300">
                                          <span className="font-medium">目标肌群：</span>
                                          {exercise.targetMuscle}
                                        </div>
                                      )}

                                      {exercise.notes && (
                                        <div className="text-zinc-600 dark:text-zinc-400 text-xs flex items-start gap-1">
                                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                          {exercise.notes}
                                        </div>
                                      )}

                                      {/* 视频教学链接 */}
                                      {videoInfo && videoInfo.videoUrl ? (
                                        <a
                                          href={videoInfo.videoUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 px-3 py-2 mt-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all group"
                                        >
                                          <Play className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                                          <div className="flex-1">
                                            <div className="text-xs font-medium text-purple-900 dark:text-purple-100">
                                              {getPlatformInfo(videoInfo.videoPlatform || 'bilibili').icon}{' '}
                                              动作教学视频
                                            </div>
                                            {videoInfo.videoTitle && (
                                              <div className="text-xs text-purple-700 dark:text-purple-300">
                                                {videoInfo.videoTitle}
                                              </div>
                                            )}
                                          </div>
                                          <ExternalLink className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                        </a>
                                      ) : (
                                        <div className="inline-flex items-center gap-2 px-3 py-2 mt-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                                          <Info className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                                          <div className="text-xs text-zinc-600 dark:text-zinc-400">
                                            💡 建议在B站搜索 "<span className="font-medium text-zinc-700 dark:text-zinc-300">{exercise.name} 标准动作教学</span>" 观看视频
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-sm text-zinc-500 dark:text-zinc-400">
                              休息日 - 主动恢复
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                暂无训练计划
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-zinc-500 dark:text-zinc-400">
            暂无训练计划
          </div>
        )}
      </div>

      {/* 两周进阶 */}
      {data.progression && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">两周进阶</h3>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{data.progression}</p>
        </div>
      )}

      {/* 注意事项 */}
      {data.precautions.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
          <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            注意事项
          </h3>
          <ul className="space-y-2">
            {data.precautions.map((precaution, index) => (
              <li
                key={index}
                className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2"
              >
                <span className="text-amber-600 dark:text-amber-400">•</span>
                {precaution}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 成功标准 */}
      {data.successCriteria.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            成功标准
          </h3>
          <ul className="space-y-2">
            {data.successCriteria.map((criteria, index) => (
              <li
                key={index}
                className="text-sm text-zinc-700 dark:text-zinc-300 flex items-start gap-2"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                {criteria}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
