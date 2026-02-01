'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronRight, Camera, UtensilsCrossed, CheckCircle2, Clock, AlertCircle, Edit2, Trash2, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DietPhotoMealGroup } from '@/types';
import MealGroupUpload from '@/components/MealGroupUpload';

// Standalone diet photo (not in meal group) - compatible with local DietPhoto interface
interface StandaloneDietPhoto {
  id: string;
  imageUrl: string;
  mealType: string | null;
  notes: string | null;
  analysis: any;
  analyzedAt: string | null;
  uploadedAt: string;
  mealGroupId?: string | null;
}

interface GroupedRecords {
  date: string;
  formattedDate: string;
  dayOfWeek: string;
  photos: StandaloneDietPhoto[];
  mealGroups: DietPhotoMealGroup[];
}

interface DietTimelineViewProps {
  clientId: string;
  photos: StandaloneDietPhoto[];
  mealGroups: DietPhotoMealGroup[];
  onAnalyzePhoto?: (photoId: string) => void;
  onAnalyzeMealGroup?: (groupId: string) => void;
  onAnalyzeMealGroupPhoto?: (groupId: string, photoId: string) => void;
  onDeletePhoto?: (photoId: string) => void;
  onDeleteMealGroup?: (groupId: string) => void;
  onEditMealGroup?: (group: DietPhotoMealGroup) => void;
}

/**
 * 饮食记录时间线视图组件
 * 按日期分组展示所有照片和食谱组
 */
export default function DietTimelineView({
  clientId,
  photos,
  mealGroups,
  onAnalyzePhoto,
  onAnalyzeMealGroup,
  onAnalyzeMealGroupPhoto,
  onDeletePhoto,
  onDeleteMealGroup,
  onEditMealGroup,
}: DietTimelineViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [editingGroup, setEditingGroup] = useState<DietPhotoMealGroup | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // 按日期分组记录
  const groupedRecords = useMemo(() => {
    const groups: { [key: string]: GroupedRecords } = {};

    console.log('DietTimelineView - Processing mealGroups:', mealGroups.length);
    console.log('DietTimelineView - Processing photos:', photos.length);

    // 处理独立照片
    photos.forEach((photo) => {
      if (photo.mealGroupId) return; // 跳过属于食谱组的照片

      // uploadedAt is string format, extract YYYY-MM-DD
      const dateStr = photo.uploadedAt.split('T')[0];

      if (!groups[dateStr]) {
        groups[dateStr] = {
          date: dateStr,
          formattedDate: formatDate(dateStr),
          dayOfWeek: getDayOfWeek(dateStr),
          photos: [],
          mealGroups: [],
        };
      }
      groups[dateStr].photos.push(photo);
    });

    // 处理食谱组
    mealGroups.forEach((group) => {
      const date = group.date;
      console.log('Processing meal group:', group.name, 'date:', date, 'photos:', group.photos?.length);
      if (!groups[date]) {
        groups[date] = {
          date,
          formattedDate: formatDate(date),
          dayOfWeek: getDayOfWeek(date),
          photos: [],
          mealGroups: [],
        };
      }
      groups[date].mealGroups.push(group);
    });

    // 转换为数组并按日期降序排序
    const result = Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
    console.log('Grouped records:', result.length, 'dates');
    return result;
  }, [photos, mealGroups]);

  // 自动展开最新的日期（让用户能看到刚上传的照片）
  useEffect(() => {
    if (groupedRecords.length > 0 && expandedDates.size === 0) {
      setExpandedDates(new Set([groupedRecords[0].date]));
    }
  }, [groupedRecords, expandedDates.size]);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const getAnalysisStatus = (item: StandaloneDietPhoto | DietPhotoMealGroup) => {
    if ('combinedAnalysis' in item) {
      // 食谱组
      if (item.combinedAnalysis) return 'analyzed';
      return 'pending';
    } else {
      // 单张照片
      if (item.analysis) return 'analyzed';
      return 'pending';
    }
  };

  const getAnalysisIcon = (status: string) => {
    switch (status) {
      case 'analyzed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleEditGroup = (group: DietPhotoMealGroup) => {
    setEditingGroup(group);
    setShowEditModal(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm('确定要删除这个食谱组吗？')) {
      onDeleteMealGroup?.(groupId);
    }
  };

  const handleEditSuccess = (mealGroup: DietPhotoMealGroup) => {
    setShowEditModal(false);
    setEditingGroup(null);
    onEditMealGroup?.(mealGroup);
  };

  if (groupedRecords.length === 0) {
    return (
      <div className="text-center py-16 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
        <UtensilsCrossed className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          暂无饮食记录
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          上传第一张照片开始记录饮食
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {groupedRecords.map((group) => {
          const isDateExpanded = expandedDates.has(group.date);
          const totalItems = group.photos.length + group.mealGroups.length;
          const analyzedCount = [
            ...group.photos,
            ...group.mealGroups,
          ].filter((item) => getAnalysisStatus(item) === 'analyzed').length;

          return (
            <div key={group.date} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* 日期头部 */}
            <button
              onClick={() => toggleDate(group.date)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "transition-transform duration-200",
                  isDateExpanded && "rotate-90"
                )}>
                  <ChevronRight className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {group.formattedDate}
                    </h3>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {group.dayOfWeek}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {totalItems} 条记录 · {analyzedCount} 条已分析
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <span>{isDateExpanded ? '收起' : '展开'}</span>
              </div>
            </button>

            {/* 记录列表 */}
            {isDateExpanded && (
              <div className="px-6 pb-6 space-y-4">
                {/* 独立照片 */}
                {group.photos.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      独立照片 ({group.photos.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {group.photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="group relative border rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-800 hover:shadow-md transition-shadow"
                        >
                          {/* 状态图标 */}
                          <div className="absolute top-2 left-2 z-10">
                            {getAnalysisIcon(getAnalysisStatus(photo))}
                          </div>

                          {/* 图片 */}
                          <img
                            src={photo.imageUrl}
                            alt="饮食照片"
                            className="w-full h-32 object-cover"
                          />

                          {/* 信息覆盖层 */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-white text-xs font-medium truncate">
                              {photo.mealType || '未分类'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 食谱组 */}
                {group.mealGroups.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4" />
                      食谱组 ({group.mealGroups.length})
                    </h4>
                    {group.mealGroups.map((mealGroup) => {
                      const isExpanded = expandedGroups.has(mealGroup.id);
                      const groupPhotos = mealGroup.photos || [];

                      return (
                        <div
                          key={mealGroup.id}
                          className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden"
                        >
                          {/* 食谱组头部 */}
                          <div className="px-4 py-3 flex items-center justify-between bg-purple-50 dark:bg-purple-900/20">
                            <button
                              onClick={() => toggleGroup(mealGroup.id)}
                              className="flex items-center gap-3 flex-1"
                            >
                              <div className={cn(
                                "transition-transform duration-200",
                                isExpanded && "rotate-90"
                              )}>
                                <ChevronRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {mealGroup.name}
                                  </span>
                                  {getAnalysisIcon(getAnalysisStatus(mealGroup))}
                                </div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                  {mealGroup.mealType || '未分类'} · {groupPhotos.length} 张照片
                                </p>
                              </div>
                            </button>

                            {/* 操作按钮 */}
                            <div className="flex items-center gap-2 ml-2">
                              {mealGroup.totalScore && (
                                <div className="text-right mr-2">
                                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {mealGroup.totalScore.toFixed(0)}
                                  </div>
                                  <div className="text-xs text-zinc-500">得分</div>
                                </div>
                              )}
                              {/* 分析整个食谱组按钮 */}
                              {onAnalyzeMealGroup && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAnalyzeMealGroup(mealGroup.id);
                                  }}
                                  className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-md transition-colors"
                                  title="分析整个食谱组"
                                >
                                  <Sparkles className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditGroup(mealGroup);
                                }}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                title="编辑"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteGroup(mealGroup.id);
                                }}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* 展开的照片网格 */}
                          {isExpanded && (
                            <div className="p-4 bg-white dark:bg-zinc-900">
                              {/* 分析整个食谱组按钮 */}
                              {onAnalyzeMealGroup && (
                                <div className="mb-3 flex justify-center">
                                  <button
                                    onClick={() => onAnalyzeMealGroup(mealGroup.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                                  >
                                    <Sparkles size={16} />
                                    分析整个食谱组
                                  </button>
                                </div>
                              )}
                              {/* 照片网格 */}
                              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {groupPhotos.map((photo) => {
                                  const isAnalyzed = !!photo.analysis;
                                  return (
                                    <div
                                      key={photo.id}
                                      className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-shadow group"
                                    >
                                      <img
                                        src={photo.imageUrl}
                                        alt="食谱照片"
                                        className="w-full h-full object-cover"
                                      />
                                      {/* 分析状态指示器 */}
                                      <div className="absolute top-1 left-1 z-10">
                                        {isAnalyzed ? (
                                          <div className="bg-green-500 text-white rounded-full p-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                          </div>
                                        ) : (
                                          <div className="bg-amber-500 text-white rounded-full p-1">
                                            <Clock className="w-3 h-3" />
                                          </div>
                                        )}
                                      </div>
                                      {/* 悬停时显示的分析按钮 */}
                                      {onAnalyzeMealGroupPhoto && (
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <button
                                            onClick={() => onAnalyzeMealGroupPhoto(mealGroup.id, photo.id)}
                                            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                                            title={isAnalyzed ? "重新分析" : "分析这张照片"}
                                          >
                                            <Sparkles className="w-5 h-5 text-emerald-600" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>

    {/* 编辑食谱组弹窗 */}
    {showEditModal && editingGroup && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">编辑食谱组</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingGroup(null);
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <MealGroupUpload
              clientId={clientId}
              editingGroup={editingGroup}
              onCreateSuccess={handleEditSuccess}
              onCancel={() => {
                setShowEditModal(false);
                setEditingGroup(null);
              }}
            />
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// 辅助函数
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === today.toISOString().split('T')[0]) {
    return '今天';
  }
  if (dateStr === yesterday.toISOString().split('T')[0]) {
    return '昨天';
  }

  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
}
