import { prisma } from '@/lib/db/prisma';
import { evaluateDietPhotoCompliance, evaluateTextDescriptionCompliance } from '@/lib/ai/gemini';

// 计算年龄的辅助函数
export function calculateAge(birthDate: Date | string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// 解析健康问题
export function parseHealthConcerns(healthConcernsStr: string): string[] {
  try {
    const parsed = JSON.parse(healthConcernsStr || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * 分析单个食谱组的共享函数
 * 用于：单独分析食谱组 和 批量分析（重新生成汇总）
 */
export async function analyzeMealGroup(
  mealGroupId: string,
  clientId: string,
  recommendationContent: any
): Promise<{ success: boolean; error?: string; combinedAnalysis?: any; totalScore?: number; overallRating?: string }> {
  try {
    // 获取食谱组和照片
    const mealGroup = await prisma.dietPhotoMealGroup.findFirst({
      where: {
        id: mealGroupId,
        clientId,
      },
      include: {
        photos: true,
      },
    });

    if (!mealGroup) {
      return { success: false, error: '食谱组不存在' };
    }

    const hasPhotos = mealGroup.photos && mealGroup.photos.length > 0;
    const hasTextDescription = mealGroup.textDescription && mealGroup.textDescription.trim().length > 0;

    if (!hasPhotos && !hasTextDescription) {
      return { success: false, error: '食谱组既没有照片也没有文字描述' };
    }

    // 获取客户信息
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return { success: false, error: '客户不存在' };
    }

    const clientInfo = {
      name: client.name || '',
      gender: client.gender || 'FEMALE',
      age: calculateAge(client.birthDate),
      healthConcerns: parseHealthConcerns(client.healthConcerns || '[]'),
    };

    let combinedAnalysis: any = null;

    // 如果有照片，分析照片
    if (hasPhotos) {
      const analysisResults = [];

      for (const photo of mealGroup.photos) {
        try {
          // 合并照片备注和食谱组备注
          const photoNotes = photo.notes || '';
          const groupNotes = mealGroup.notes || '';
          const combinedNotes = [
            photoNotes,
            groupNotes,
          ].filter(Boolean).join('; ') || undefined;

          // 详细调试日志
          console.log(`[analyzeMealGroup] 分析照片 ${photo.id}:`);
          console.log(`  - 照片备注: "${photoNotes}"`);
          console.log(`  - 食谱组备注: "${groupNotes}"`);
          console.log(`  - 合并后备注: "${combinedNotes}"`);
          console.log(`  - 是否传递备注给AI: ${!!combinedNotes}`);

          const evaluation = await evaluateDietPhotoCompliance(
            photo.imageUrl,
            clientInfo,
            recommendationContent,
            combinedNotes // 传递合并后的备注信息
          );

          // 保存单张照片的分析结果
          await prisma.dietPhoto.update({
            where: { id: photo.id },
            data: {
              analysis: JSON.stringify(evaluation),
              analyzedAt: new Date(),
            },
          });

          analysisResults.push({
            photoId: photo.id,
            evaluation,
          });
        } catch (error) {
          console.error(`Failed to analyze photo ${photo.id}:`, error);
        }
      }

      // 计算照片的综合分析结果
      if (analysisResults.length > 0) {
        const avgScore = Math.round(
          analysisResults.reduce((sum: number, r: any) => sum + r.evaluation.complianceEvaluation.overallScore, 0) /
          analysisResults.length
        );

        const getRating = (score: number) => {
          if (score >= 90) return '优秀';
          if (score >= 75) return '良好';
          if (score >= 60) return '一般';
          return '需改善';
        };

        // 汇总建议和食物统计
        const allGreenFoods = new Set<string>();
        const allYellowFoods = new Set<string>();
        const allRedFoods = new Set<string>();

        analysisResults.forEach((r: any) => {
          const compliance = r.evaluation.complianceEvaluation?.foodTrafficLightCompliance;
          if (compliance) {
            compliance.greenFoods?.forEach((food: string) => allGreenFoods.add(food));
            compliance.yellowFoods?.forEach((food: string) => allYellowFoods.add(food));
            compliance.redFoods?.forEach((food: string) => allRedFoods.add(food));
          }
        });

        combinedAnalysis = {
          analysisSource: hasTextDescription ? 'both' : 'photos',
          totalPhotos: mealGroup.photos.length,
          analyzedPhotos: analysisResults.length,
          avgScore,
          overallRating: getRating(avgScore),
          summary: {
            greenFoods: Array.from(allGreenFoods),
            yellowFoods: Array.from(allYellowFoods),
            redFoods: Array.from(allRedFoods),
            totalCount: allRedFoods.size,
          },
        };
      }
    }

    // 如果有文字描述（没有照片或需要合并）
    if (hasTextDescription && (!hasPhotos || combinedAnalysis === null)) {
      // 合并文字描述和食谱组备注
      const combinedNotesForText = [
        mealGroup.textDescription || '',
        mealGroup.notes || '',
      ].filter(Boolean).join('; ') || undefined;

      const textEvaluation = await evaluateTextDescriptionCompliance(
        mealGroup.textDescription!,
        clientInfo,
        recommendationContent,
        combinedNotesForText // 传递合并后的备注信息
      );

      combinedAnalysis = {
        analysisSource: 'text',
        totalPhotos: 0,
        hasTextDescription: true,
        ...textEvaluation,
        totalScore: textEvaluation.complianceEvaluation.overallScore,
        overallRating: textEvaluation.complianceEvaluation.overallRating,
      };
    }

    // 如果既有照片又有文字描述，合并结果
    if (hasPhotos && hasTextDescription && combinedAnalysis && combinedAnalysis.analysisSource === 'photos') {
      try {
        // 合并文字描述和食谱组备注
        const combinedNotesForMerge = [
          mealGroup.textDescription || '',
          mealGroup.notes || '',
        ].filter(Boolean).join('; ') || undefined;

        const textEvaluation = await evaluateTextDescriptionCompliance(
          mealGroup.textDescription!,
          clientInfo,
          recommendationContent,
          combinedNotesForMerge // 传递合并后的备注信息
        );

        // 合并评分
        const photoScore = combinedAnalysis.avgScore;
        const textScore = textEvaluation.complianceEvaluation.overallScore;
        const avgScore = Math.round((photoScore + textScore) / 2);

        const getRating = (score: number) => {
          if (score >= 90) return '优秀';
          if (score >= 75) return '良好';
          if (score >= 60) return '一般';
          return '需改善';
        };

        combinedAnalysis = {
          ...combinedAnalysis,
          analysisSource: 'both',
          hasTextDescription: true,
          totalScore: avgScore,
          overallRating: getRating(avgScore),
          avgScore,
        };
      } catch (error) {
        console.error('文字描述分析失败，仅使用照片分析:', error);
      }
    }

    if (!combinedAnalysis) {
      return { success: false, error: '分析失败' };
    }

    // 更新食谱组的综合分析结果
    await prisma.dietPhotoMealGroup.update({
      where: { id: mealGroupId },
      data: {
        combinedAnalysis: JSON.stringify(combinedAnalysis),
        totalScore: combinedAnalysis.totalScore || combinedAnalysis.avgScore,
        overallRating: combinedAnalysis.overallRating,
      },
    });

    return {
      success: true,
      combinedAnalysis,
      totalScore: combinedAnalysis.totalScore || combinedAnalysis.avgScore,
      overallRating: combinedAnalysis.overallRating,
    };
  } catch (error) {
    console.error('analyzeMealGroup error:', error);
    return { success: false, error: (error as Error).message };
  }
}
