'use client';

import { Award } from 'lucide-react';
import AnalysisScoreCard from './AnalysisScoreCard';
import NutritionBalanceGrid from './NutritionBalanceGrid';
import FoodTrafficLightSummary from './FoodTrafficLightSummary';
import PersonalizedRecommendations from './PersonalizedRecommendations';
import GeneralRecommendations from './GeneralRecommendations';
import PhotoAnalysisDetails from './PhotoAnalysisDetails';
import CollapsibleSection from '@/components/recommendations/CollapsibleSection';

interface CombinedAnalysisDisplayProps {
  analysis: any;
  mealGroupName: string;
  photos: any[];
}

/**
 * 食谱组综合分析结果展示组件
 * 在食谱组展开时显示完整的 AI 分析结果
 */
export default function CombinedAnalysisDisplay({
  analysis,
  mealGroupName,
  photos,
}: CombinedAnalysisDisplayProps) {
  // 解析分析数据（如果是 JSON 字符串）
  const parsedAnalysis = typeof analysis === 'string' ? JSON.parse(analysis) : analysis;

  // 提取评分数据（支持新旧两种数据结构）
  const getScore = () => {
    if (parsedAnalysis.avgScore !== undefined) return parsedAnalysis.avgScore;
    if (parsedAnalysis.totalScore !== undefined) return parsedAnalysis.totalScore;
    // 旧数据结构：嵌套在 complianceEvaluation 中
    if (parsedAnalysis.complianceEvaluation?.overallScore !== undefined) {
      return parsedAnalysis.complianceEvaluation.overallScore;
    }
    return 0;
  };

  const getRating = () => {
    if (parsedAnalysis.overallRating) return parsedAnalysis.overallRating;
    // 旧数据结构：嵌套在 complianceEvaluation 中
    if (parsedAnalysis.complianceEvaluation?.overallRating) {
      return parsedAnalysis.complianceEvaluation.overallRating;
    }
    return undefined;
  };

  const getAnalyzedPhotos = () => {
    if (parsedAnalysis.analyzedPhotos !== undefined) return parsedAnalysis.analyzedPhotos;
    return 0;
  };

  const getTotalPhotos = () => {
    if (parsedAnalysis.totalPhotos !== undefined) return parsedAnalysis.totalPhotos;
    return 0;
  };

  const getAnalysisSource = () => {
    return parsedAnalysis.analysisSource;
  };

  // 提取食物分类数据（支持新旧两种数据结构）
  const getSummary = () => {
    if (parsedAnalysis.summary) return parsedAnalysis.summary;
    // 旧数据结构：嵌套在 complianceEvaluation.foodTrafficLightCompliance 中
    if (parsedAnalysis.complianceEvaluation?.foodTrafficLightCompliance) {
      const ftl = parsedAnalysis.complianceEvaluation.foodTrafficLightCompliance;
      return {
        greenFoods: ftl.greenFoods || [],
        yellowFoods: ftl.yellowFoods || [],
        redFoods: ftl.redFoods || [],
        totalCount: (ftl.greenFoods?.length || 0) +
                   (ftl.yellowFoods?.length || 0) +
                   (ftl.redFoods?.length || 0),
      };
    }
    return null;
  };

  // 提取营养素数据（支持新旧两种数据结构）
  const getNutritionSummary = () => {
    if (parsedAnalysis.nutritionSummary) return parsedAnalysis.nutritionSummary;
    // 旧数据结构：嵌套在 complianceEvaluation.nutritionBalance 中
    if (parsedAnalysis.complianceEvaluation?.nutritionBalance) {
      const nb = parsedAnalysis.complianceEvaluation.nutritionBalance;
      return {
        protein: nb.protein?.status || '一般',
        vegetables: nb.vegetables?.status || '一般',
        carbs: nb.carbs?.status || '一般',
        fat: nb.fat?.status || '一般',
        fiber: nb.fiber?.status || '一般',
      };
    }
    return null;
  };

  // 提取建议数据（支持新旧两种数据结构）
  const getRecommendations = () => {
    if (parsedAnalysis.recommendations) return parsedAnalysis.recommendations;
    // 旧数据结构：嵌套在 improvementSuggestions 中
    if (parsedAnalysis.improvementSuggestions) {
      const is = parsedAnalysis.improvementSuggestions;
      return {
        personalized: [], // 旧数据没有个性化建议
        general: {
          removals: is.removals || [],
          additions: is.additions || [],
          modifications: is.modifications || [],
        },
      };
    }
    return null;
  };

  const score = getScore();
  const rating = getRating();
  const analyzedPhotos = getAnalyzedPhotos();
  const totalPhotos = getTotalPhotos();
  const analysisSource = getAnalysisSource();
  const summary = getSummary();
  const nutritionSummary = getNutritionSummary();
  const recommendations = getRecommendations();

  // 如果没有任何有效数据，显示空状态
  if (!score && !summary && !nutritionSummary) {
    return (
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
          <p className="text-sm text-zinc-500">暂无分析数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-4 h-4 text-purple-600" />
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          AI 分析结果
        </h4>
      </div>

      {/* 评分卡片 */}
      <AnalysisScoreCard
        avgScore={score}
        overallRating={rating}
        analyzedPhotos={analyzedPhotos}
        totalPhotos={totalPhotos}
        analysisSource={analysisSource}
      />

      {/* 营养平衡 - 默认展开 */}
      {nutritionSummary && (
        <CollapsibleSection
          id={`nutrition-${mealGroupName}`}
          title="营养平衡"
          icon={<span className="text-xl">🥗</span>}
          defaultOpen={true}
        >
          <NutritionBalanceGrid nutritionSummary={nutritionSummary} />
        </CollapsibleSection>
      )}

      {/* 食物分类 - 默认展开 */}
      {summary && (
        <CollapsibleSection
          id={`foods-${mealGroupName}`}
          title="食物分类"
          icon={<span className="text-xl">🍽️</span>}
          defaultOpen={true}
        >
          <FoodTrafficLightSummary summary={summary} />
        </CollapsibleSection>
      )}

      {/* 个性化建议 - 默认折叠 */}
      {recommendations?.personalized && recommendations.personalized.length > 0 && (
        <CollapsibleSection
          id={`personalized-recs-${mealGroupName}`}
          title="个性化建议"
          icon={<span className="text-xl">💡</span>}
          defaultOpen={false}
          badge={
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
              {recommendations.personalized.length} 条
            </span>
          }
        >
          <PersonalizedRecommendations
            recommendations={recommendations.personalized}
          />
        </CollapsibleSection>
      )}

      {/* 通用建议 - 默认折叠 */}
      {recommendations?.general && (
        <CollapsibleSection
          id={`general-recs-${mealGroupName}`}
          title="饮食调整建议"
          icon={<span className="text-xl">📋</span>}
          defaultOpen={false}
        >
          <GeneralRecommendations recommendations={recommendations.general} />
        </CollapsibleSection>
      )}

      {/* 照片详情 - 默认折叠 */}
      {photos && photos.length > 0 && (
        <CollapsibleSection
          id={`photo-details-${mealGroupName}`}
          title="照片详细分析"
          icon={<span className="text-xl">📸</span>}
          defaultOpen={false}
          badge={
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {photos.length} 张
            </span>
          }
        >
          <PhotoAnalysisDetails photos={photos} />
        </CollapsibleSection>
      )}
    </div>
  );
}
