'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Camera, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DietPhotoInGroup {
  id: string;
  imageUrl: string;
  mealType?: string | null;
  notes?: string | null;
  analysis?: string | null;
}

interface PhotoAnalysisDetailsProps {
  photos: DietPhotoInGroup[];
}

/**
 * 照片详细分析组件
 * 手风琴式展示每张照片的分析结果
 */
export default function PhotoAnalysisDetails({
  photos,
}: PhotoAnalysisDetailsProps) {
  const [expandedPhotos, setExpandedPhotos] = useState<Set<string>>(new Set());

  const togglePhoto = (photoId: string) => {
    const newExpanded = new Set(expandedPhotos);
    if (newExpanded.has(photoId)) {
      newExpanded.delete(photoId);
    } else {
      newExpanded.add(photoId);
    }
    setExpandedPhotos(newExpanded);
  };

  const getPhotoAnalysis = (photo: DietPhotoInGroup) => {
    if (!photo.analysis) return null;
    try {
      return JSON.parse(photo.analysis);
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-2">
      {photos.map((photo) => {
        const analysis = getPhotoAnalysis(photo);
        const isExpanded = expandedPhotos.has(photo.id);

        // 从 analysis 中提取评分信息
        const score = analysis?.evaluation?.complianceEvaluation?.overallScore || null;
        const rating = analysis?.evaluation?.complianceEvaluation?.overallRating || null;
        const trafficLight = analysis?.evaluation?.complianceEvaluation?.foodTrafficLightCompliance;

        const greenCount = trafficLight?.greenFoods?.length || 0;
        const yellowCount = trafficLight?.yellowFoods?.length || 0;
        const redCount = trafficLight?.redFoods?.length || 0;

        return (
          <div
            key={photo.id}
            className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden"
          >
            {/* 照片头部 - 可点击展开 */}
            <button
              onClick={() => togglePhoto(photo.id)}
              className="w-full px-3 py-2 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <img
                src={photo.imageUrl}
                alt="食谱照片"
                className="w-12 h-12 rounded object-cover border border-zinc-200 dark:border-zinc-700"
              />

              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {photo.mealType || '未分类'}
                  </span>
                  {photo.notes && (
                    <span className="text-xs text-zinc-500 truncate max-w-[150px]">
                      {photo.notes}
                    </span>
                  )}
                </div>

                {/* 评分信息 */}
                {analysis ? (
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    {score !== null && (
                      <span className={`font-semibold ${
                        score >= 90 ? 'text-green-600' :
                        score >= 75 ? 'text-blue-600' :
                        score >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {score}分
                      </span>
                    )}
                    {rating && (
                      <span className="text-zinc-500">· {rating}</span>
                    )}
                    <div className="flex items-center gap-1 text-zinc-500">
                      <span className="flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        {greenCount}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                        {yellowCount}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <span className="w-3 h-3 rounded-full bg-red-500" />
                        {redCount}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-zinc-500">
                    未分析
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </div>
            </button>

            {/* 展开的详细内容 */}
            {isExpanded && analysis && (
              <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-700">
                {/* 食物列表 */}
                {trafficLight && (
                  <div className="space-y-2 text-xs">
                    {/* 绿灯食物 */}
                    {trafficLight.greenFoods && trafficLight.greenFoods.length > 0 && (
                      <div>
                        <div className="text-green-700 dark:text-green-400 font-medium mb-1">
                          ✓ 推荐食物 ({trafficLight.greenFoods.length})
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {trafficLight.greenFoods.map((food: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-green-100 text-green-800 rounded"
                            >
                              {food}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 黄灯食物 */}
                    {trafficLight.yellowFoods && trafficLight.yellowFoods.length > 0 && (
                      <div>
                        <div className="text-yellow-700 dark:text-yellow-400 font-medium mb-1">
                          ○ 适量食物 ({trafficLight.yellowFoods.length})
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {trafficLight.yellowFoods.map((food: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded"
                            >
                              {food}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 红灯食物 */}
                    {trafficLight.redFoods && trafficLight.redFoods.length > 0 && (
                      <div>
                        <div className="text-red-700 dark:text-red-400 font-medium mb-1">
                          ✗ 避免食物 ({trafficLight.redFoods.length})
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {trafficLight.redFoods.map((food: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-red-100 text-red-800 rounded"
                            >
                              {food}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
