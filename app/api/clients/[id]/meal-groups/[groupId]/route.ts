import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { evaluateDietPhotoCompliance, evaluateTextDescriptionCompliance } from '@/lib/ai/gemini';
import { safeJSONParse, safeJSONParseArray } from '@/lib/utils/jsonUtils';

// 计算年龄的辅助函数
function calculateAge(birthDate: Date | string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// 解析健康问题 - 使用 safeJSONParse
function parseHealthConcerns(healthConcernsStr: string): string[] {
  return safeJSONParseArray<string>(healthConcernsStr);
}

// GET - 获取单个食谱组详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  let id = '';
  let groupId = '';
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    groupId = resolvedParams.groupId;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户访问权限
    const client = await prisma.client.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    // 获取食谱组详情
    const mealGroup = await prisma.dietPhotoMealGroup.findFirst({
      where: {
        id: groupId,
        clientId: id,
      },
      include: {
        photos: {
          orderBy: { uploadedAt: 'asc' },
        },
      },
    });

    if (!mealGroup) {
      return NextResponse.json({ error: '食谱组不存在' }, { status: 404 });
    }

    // 解析 JSON 字段
    const groupWithParsedData = {
      ...mealGroup,
      combinedAnalysis: safeJSONParse(mealGroup.combinedAnalysis, null),
      photos: mealGroup.photos.map(photo => ({
        ...photo,
        analysis: safeJSONParse(photo.analysis, null),
      })),
    };

    return NextResponse.json({ mealGroup: groupWithParsedData });
  } catch (error) {
    logger.error('Failed to fetch meal group', error);
    return NextResponse.json({ error: '获取食谱组详情失败' }, { status: 500 });
  }
}

// DELETE - 删除食谱组
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  let id = '';
  let groupId = '';
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    groupId = resolvedParams.groupId;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户访问权限
    const client = await prisma.client.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    // 验证食谱组是否存在
    const mealGroup = await prisma.dietPhotoMealGroup.findFirst({
      where: {
        id: groupId,
        clientId: id,
      },
    });

    if (!mealGroup) {
      return NextResponse.json({ error: '食谱组不存在' }, { status: 404 });
    }

    // 删除食谱组（关联的照片会自动删除或解除关联）
    await prisma.dietPhotoMealGroup.delete({
      where: { id: groupId },
    });

    logger.apiSuccess('DELETE', `/api/clients/${id}/meal-groups/${groupId}`, '食谱组删除成功');

    return NextResponse.json({
      success: true,
      message: '食谱组删除成功',
    });
  } catch (error) {
    logger.apiError('DELETE', `/api/clients/${id}/meal-groups/${groupId}`, error);
    return NextResponse.json({ error: '删除食谱组失败' }, { status: 500 });
  }
}

// POST - 分析食谱组（综合评估所有照片）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  let id = '';
  let groupId = '';
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    groupId = resolvedParams.groupId;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户访问权限
    const client = await prisma.client.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    // 获取食谱组和照片
    const mealGroup = await prisma.dietPhotoMealGroup.findFirst({
      where: {
        id: groupId,
        clientId: id,
      },
      include: {
        photos: true,
      },
    });

    if (!mealGroup) {
      return NextResponse.json({ error: '食谱组不存在' }, { status: 404 });
    }

    // 检查是否有照片或文字描述
    const hasPhotos = mealGroup.photos.length > 0;
    const hasTextDescription = mealGroup.textDescription && mealGroup.textDescription.trim().length > 0;

    if (!hasPhotos && !hasTextDescription) {
      return NextResponse.json({ error: '食谱组没有照片或文字描述' }, { status: 400 });
    }

    logger.apiRequest('POST', `/api/clients/${id}/meal-groups/${groupId}/analyze`, groupId);

    // 获取客户的最新营养干预方案
    const latestRecommendation = await prisma.recommendation.findFirst({
      where: {
        clientId: id,
        type: 'COMPREHENSIVE',
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });

    if (!latestRecommendation) {
      // 提供更友好的引导和可执行的操作
      return NextResponse.json({
        error: '该客户暂无营养干预方案',
        needsRecommendation: true,
        message: '进行饮食评估需要先为客户生成营养干预方案，这样可以提供更准确的建议',
        suggestion: '请前往 "营养建议" 页面为客户生成专业营养干预方案',
        actionUrl: `/clients/${id}/recommendations/new`,
      }, { status: 400 });
    }

    // 准备客户信息
    const clientInfo = {
      name: client.name || '',
      gender: client.gender || 'FEMALE',
      age: calculateAge(client.birthDate),
      healthConcerns: parseHealthConcerns(client.healthConcerns || '[]'),
      userRequirements: client.userRequirements || '',
      preferences: client.preferences || '',
    };

    // 打印客户信息日志
    logger.debug('食谱组分析 - 开始', {
      clientId: id,
      mealGroupId: groupId,
      mealGroupName: mealGroup.name,
      mealGroupDate: mealGroup.date,
      photosCount: mealGroup.photos.length,
      photoIds: mealGroup.photos.map(p => p.id),
    });

    // 检查是否有孤立的照片（同一天但没有关联到该食谱组的照片）
    const orphanPhotos = await prisma.dietPhoto.findMany({
      where: {
        clientId: id,
        mealGroupId: null,
        uploadedAt: {
          gte: new Date(mealGroup.date + 'T00:00:00'),
          lt: new Date(mealGroup.date + 'T23:59:59'),
        },
      },
    });

    if (orphanPhotos.length > 0) {
      logger.debug('发现孤立照片，正在关联', { count: orphanPhotos.length, photoIds: orphanPhotos.map(p => p.id) });

      // 自动关联孤立照片到当前食谱组
      await prisma.dietPhoto.updateMany({
        where: {
          id: { in: orphanPhotos.map(p => p.id) },
        },
        data: {
          mealGroupId: groupId,
        },
      });

      logger.info('已将孤立照片关联到食谱组', { count: orphanPhotos.length, mealGroupId: groupId });

      // 重新获取食谱组
      const updatedMealGroup = await prisma.dietPhotoMealGroup.findFirst({
        where: {
          id: groupId,
          clientId: id,
        },
        include: {
          photos: true,
        },
      });

      if (updatedMealGroup) {
        logger.debug('关联后照片数量', { count: updatedMealGroup.photos.length });
      }
    }

    logger.debug('食谱组分析上下文', {
      healthConcerns: clientInfo.healthConcerns,
      userRequirements: clientInfo.userRequirements,
      preferences: clientInfo.preferences,
      recommendationDate: latestRecommendation.generatedAt,
    });

    // 使用更新后的mealGroup（如果有关联了孤立照片）
    const finalMealGroup = await prisma.dietPhotoMealGroup.findFirst({
      where: {
        id: groupId,
        clientId: id,
      },
      include: {
        photos: true,
      },
    });

    if (!finalMealGroup) {
      return NextResponse.json({ error: '食谱组不存在' }, { status: 400 });
    }

    const finalHasPhotos = finalMealGroup.photos.length > 0;
    const finalHasTextDescription = finalMealGroup.textDescription && finalMealGroup.textDescription.trim().length > 0;

    if (!finalHasPhotos && !finalHasTextDescription) {
      return NextResponse.json({ error: '食谱组没有照片或文字描述' }, { status: 400 });
    }

    let combinedEvaluation: any = null;
    let analysisSource = ''; // 'photos', 'text', or 'both'

    // 如果有照片，分析照片
    const analysisResults: any[] = []; // 定义在外部，后续代码需要使用
    let successfulAnalyses: any[] = []; // 定义在外部，后续代码需要使用

    if (finalHasPhotos) {
      analysisSource = finalHasTextDescription ? 'both' : 'photos';
      logger.debug('开始分析照片', { photoCount: finalMealGroup.photos.length });

      // 分析所有照片
      for (const photo of finalMealGroup.photos) {
        try {
          logger.debug(`分析照片 ${photo.id}`, {
            urlLength: photo.imageUrl?.length || 0,
          });

          // 合并照片备注和食谱组备注
          const combinedNotes = [
            photo.notes || '',
            finalMealGroup.notes || '',
          ].filter(Boolean).join('; ') || undefined;

          const evaluation = await evaluateDietPhotoCompliance(
            photo.imageUrl,
            clientInfo,
            latestRecommendation.content,
            combinedNotes // 传递合并后的备注信息
          );
          analysisResults.push({
            photoId: photo.id,
            evaluation,
          });

          logger.debug(`照片 ${photo.id} 分析成功`, { score: evaluation.complianceEvaluation?.overallScore });

          // 保存单张照片的分析结果
          await prisma.dietPhoto.update({
            where: { id: photo.id },
            data: {
              analysis: JSON.stringify(evaluation),
              analyzedAt: new Date(),
            },
          });
        } catch (error) {
          logger.error(`Failed to analyze photo ${photo.id}`, error);
          analysisResults.push({
            photoId: photo.id,
            error: (error as Error).message,
          });
        }
      }

      // 计算综合分析结果
      const successfulAnalyses = analysisResults.filter(r => !r.error);
      if (successfulAnalyses.length === 0) {
        // 如果照片分析都失败，但有文字描述，尝试用文字描述
        if (finalHasTextDescription) {
          logger.debug('照片分析失败，尝试使用文字描述分析');
          analysisSource = 'text';
        } else {
          // 返回详细的错误信息
          const errorDetails = analysisResults.map(r => ({
            photoId: r.photoId,
            error: r.error || '未知错误',
          }));
          logger.error('所有照片分析均失败', { photoErrors: errorDetails });
          return NextResponse.json({
            error: '所有照片分析均失败',
            details: '请检查 Gemini API 配置和图片数据格式',
            photoErrors: errorDetails
          }, { status: 500 });
        }
      } else {
        // 计算平均分
        const avgScore = Math.round(
          successfulAnalyses.reduce((sum, r) => sum + (r as any).evaluation.complianceEvaluation.overallScore, 0) /
          successfulAnalyses.length
        );

        // 确定综合评级
        const getRating = (score: number) => {
          if (score >= 90) return '优秀';
          if (score >= 75) return '良好';
          if (score >= 60) return '一般';
          return '需改善';
        };

        // 汇总所有建议
        const allRemovals = successfulAnalyses.flatMap((r: any) =>
          (r.evaluation.improvementSuggestions?.removals || []).map((item: any) => ({
            ...item,
            photoId: r.photoId,
          }))
        );

        const allAdditions = successfulAnalyses.flatMap((r: any) =>
          (r.evaluation.improvementSuggestions?.additions || []).map((item: any) => ({
            ...item,
            photoId: r.photoId,
          }))
        );

        const allModifications = successfulAnalyses.flatMap((r: any) =>
          (r.evaluation.improvementSuggestions?.modifications || []).map((item: any) => ({
            ...item,
            photoId: r.photoId,
          }))
        );

        // 使用第一个成功分析的结果作为基础，合并其他结果
        combinedEvaluation = {
          ...(successfulAnalyses[0] as any).evaluation,
          complianceEvaluation: {
            ...(successfulAnalyses[0] as any).evaluation.complianceEvaluation,
            overallScore: avgScore,
            overallRating: getRating(avgScore),
          },
          improvementSuggestions: {
            removals: allRemovals,
            additions: allAdditions,
            modifications: allModifications,
          },
        };
      }
    }

    // 如果有文字描述且没有照片，或照片分析失败，分析文字描述
    if ((finalHasTextDescription && !finalHasPhotos) || (finalHasTextDescription && analysisSource === 'text')) {
      analysisSource = 'text';
      logger.debug('分析文字描述', {
        preview: finalMealGroup.textDescription?.substring(0, 100) + '...',
      });

      try {
        combinedEvaluation = await evaluateTextDescriptionCompliance(
          finalMealGroup.textDescription!,
          clientInfo,
          latestRecommendation.content,
          finalMealGroup.notes // 传递备注信息
        );
        logger.debug('文字描述分析成功', { score: combinedEvaluation.complianceEvaluation?.overallScore });
      } catch (error) {
        logger.error('文字描述分析失败', error);
        return NextResponse.json({
          error: '文字描述分析失败',
          details: (error as Error).message
        }, { status: 500 });
      }
    }

    // 如果同时有照片和文字描述，合并分析结果
    if (analysisSource === 'both' && finalHasTextDescription && combinedEvaluation) {
      logger.debug('合并照片和文字描述分析结果');
      try {
        const textEvaluation = await evaluateTextDescriptionCompliance(
          finalMealGroup.textDescription!,
          clientInfo,
          latestRecommendation.content,
          finalMealGroup.notes // 传递备注信息
        );

        // 合并两个分析结果，取平均分
        const photoScore = combinedEvaluation.complianceEvaluation.overallScore;
        const textScore = textEvaluation.complianceEvaluation.overallScore;
        const avgScore = Math.round((photoScore + textScore) / 2);

        // 合并建议
        const combinedRemovals = [
          ...(combinedEvaluation.improvementSuggestions?.removals || []),
          ...(textEvaluation.improvementSuggestions?.removals || []),
        ];
        const combinedAdditions = [
          ...(combinedEvaluation.improvementSuggestions?.additions || []),
          ...(textEvaluation.improvementSuggestions?.additions || []),
        ];
        const combinedModifications = [
          ...(combinedEvaluation.improvementSuggestions?.modifications || []),
          ...(textEvaluation.improvementSuggestions?.modifications || []),
        ];

        const getRating = (score: number) => {
          if (score >= 90) return '优秀';
          if (score >= 75) return '良好';
          if (score >= 60) return '一般';
          return '需改善';
        };

        combinedEvaluation = {
          ...combinedEvaluation,
          complianceEvaluation: {
            ...combinedEvaluation.complianceEvaluation,
            overallScore: avgScore,
            overallRating: getRating(avgScore),
          },
          improvementSuggestions: {
            removals: combinedRemovals,
            additions: combinedAdditions,
            modifications: combinedModifications,
          },
        };

        logger.debug('合并后评分', { avgScore });
      } catch (error) {
        logger.error('文字描述分析失败，仅使用照片分析结果', error);
      }
    }

    if (!combinedEvaluation) {
      return NextResponse.json({ error: '分析失败' }, { status: 500 });
    }

    const avgScore = combinedEvaluation.complianceEvaluation.overallScore;
    const getRating = (score: number) => {
      if (score >= 90) return '优秀';
      if (score >= 75) return '良好';
      if (score >= 60) return '一般';
      return '需改善';
    };

    // 从combinedEvaluation中提取建议
    const allRemovals = combinedEvaluation.improvementSuggestions?.removals || [];
    const allAdditions = combinedEvaluation.improvementSuggestions?.additions || [];
    const allModifications = combinedEvaluation.improvementSuggestions?.modifications || [];

    // 提取食物分类数据
    const foodTrafficLight = combinedEvaluation.complianceEvaluation?.foodTrafficLightCompliance || {};
    const nutritionBalanceFromEval = combinedEvaluation.complianceEvaluation?.nutritionBalance || {};

    // 创建combinedAnalysis对象（扁平化结构以匹配组件期望）
    const analyzedPhotosCount = finalHasPhotos ? (analysisResults?.filter((r: any) => !r.error).length || 0) : 0;
    const combinedAnalysis: any = {
      // 顶部字段 - 组件直接访问
      avgScore: avgScore,
      totalScore: avgScore,
      overallRating: getRating(avgScore),
      analyzedPhotos: analyzedPhotosCount,
      totalPhotos: finalMealGroup.photos.length,
      analysisSource,
      hasTextDescription: finalHasTextDescription,

      // 食物分类摘要（扁平化）
      summary: {
        greenFoods: foodTrafficLight.greenFoods || [],
        yellowFoods: foodTrafficLight.yellowFoods || [],
        redFoods: foodTrafficLight.redFoods || [],
        totalCount: (foodTrafficLight.greenFoods?.length || 0) +
                   (foodTrafficLight.yellowFoods?.length || 0) +
                   (foodTrafficLight.redFoods?.length || 0),
      },

      // 营养素摘要（扁平化）
      nutritionSummary: {
        protein: nutritionBalanceFromEval.protein?.status || '一般',
        vegetables: nutritionBalanceFromEval.vegetables?.status || '一般',
        carbs: nutritionBalanceFromEval.carbs?.status || '一般',
        fat: nutritionBalanceFromEval.fat?.status || '一般',
        fiber: nutritionBalanceFromEval.fiber?.status || '一般',
      },

      // 保留原始数据结构
      ...combinedEvaluation,
    };

    // 生成针对客户健康问题和需求的建议
    const personalizedRecommendations: {
      priority: string;
      category: 'health-concern' | 'user-requirement' | 'nutrition-balance';
      recommendation: string;
      reason: string;
    }[] = [];

    // 1. 基于健康问题生成建议
    if (clientInfo.healthConcerns && clientInfo.healthConcerns.length > 0) {
      const healthConcernMap: Record<string, { recommendation: string; reason: string }> = {
        '高血压': {
          recommendation: '控制钠盐摄入，增加钾镁食物',
          reason: `${clientInfo.healthConcerns.includes('高血压') ? '针对高血压' : ''}需要DASH饮食模式，每日盐摄入<5g`
        },
        '高血脂': {
          recommendation: '限制饱和脂肪和反式脂肪，增加Omega-3',
          reason: '需要降低血脂，减少心血管风险'
        },
        '高血糖': {
          recommendation: '选择低GI食物，控制碳水总量',
          reason: '需要稳定血糖，避免血糖波动'
        },
        '肥胖': {
          recommendation: '控制总热量，增加膳食纤维',
          reason: '需要制造热量缺口，增加饱腹感'
        },
        '脂肪肝': {
          recommendation: '减少精制碳水和添加糖，增加优质蛋白',
          reason: '需要减轻肝脏负担，改善代谢'
        },
        '痛风': {
          recommendation: '限制高嘌呤食物，增加饮水',
          reason: '需要降低尿酸水平，减少痛风发作'
        },
        '骨质疏松': {
          recommendation: '增加钙和维生素D摄入',
          reason: '需要增强骨密度，预防骨折'
        },
        '失眠': {
          recommendation: '晚餐避免兴奋性食物，增加镁和B族',
          reason: '需要改善睡眠质量，调节神经系统'
        },
      };

      clientInfo.healthConcerns.forEach((concern: string) => {
        const mapped = healthConcernMap[concern];
        if (mapped) {
          personalizedRecommendations.push({
            priority: 'high',
            category: 'health-concern',
            recommendation: mapped.recommendation,
            reason: mapped.reason,
          });
        }
      });
    }

    // 2. 基于用户需求生成建议
    if (clientInfo.userRequirements) {
      if (clientInfo.userRequirements.includes('减重') || clientInfo.userRequirements.includes('瘦身')) {
        personalizedRecommendations.push({
          priority: 'high',
          category: 'user-requirement',
          recommendation: '控制总热量，制造500kcal/天热量缺口',
          reason: '基于您的减重需求，需要控制能量摄入'
        });
      }
      if (clientInfo.userRequirements.includes('增肌') || clientInfo.userRequirements.includes('健身')) {
        personalizedRecommendations.push({
          priority: 'high',
          category: 'user-requirement',
          recommendation: '增加蛋白质摄入至1.6-2.0g/kg体重',
          reason: '基于您的增肌需求，需要充足蛋白质支持肌肉合成'
        });
      }
      if (clientInfo.userRequirements.includes('改善睡眠') || clientInfo.userRequirements.includes('失眠')) {
        personalizedRecommendations.push({
          priority: 'medium',
          category: 'user-requirement',
          recommendation: '晚餐避免咖啡因和辛辣食物，增加色氨酸食物',
          reason: '基于您的睡眠改善需求，需要调整晚餐结构'
        });
      }
      if (clientInfo.userRequirements.includes('提升精力') || clientInfo.userRequirements.includes('疲劳')) {
        personalizedRecommendations.push({
          priority: 'medium',
          category: 'user-requirement',
          recommendation: '保持规律饮食，避免血糖大幅波动',
          reason: '基于您的精力提升需求，需要稳定血糖和能量供应'
        });
      }
    }

    // 汇总红绿灯食物统计
    const allGreenFoods = new Set<string>();
    const allYellowFoods = new Set<string>();
    const allRedFoods = new Set<string>();

    successfulAnalyses.forEach((r: any) => {
      const compliance = r.evaluation.complianceEvaluation?.foodTrafficLightCompliance;
      if (compliance) {
        compliance.greenFoods?.forEach((food: string) => allGreenFoods.add(food));
        compliance.yellowFoods?.forEach((food: string) => allYellowFoods.add(food));
        compliance.redFoods?.forEach((food: string) => allRedFoods.add(food));
      }
    });

    // 汇总营养素平衡评估
    const nutritionBalance = {
      protein: { 充足: 0, 不足: 0, 缺乏: 0 },
      vegetables: { 充足: 0, 不足: 0, 缺乏: 0 },
      carbs: { 充足: 0, 不足: 0, 缺乏: 0 },
      fat: { 充足: 0, 不足: 0, 缺乏: 0 },
      fiber: { 充足: 0, 不足: 0, 缺乏: 0 },
    };

    successfulAnalyses.forEach((r: any) => {
      const nb = r.evaluation.complianceEvaluation?.nutritionBalance;
      logger.debug('照片营养素数据', { photoId: r.photoId, nutritionBalance: nb });
      if (nb) {
        if (nb.protein) nutritionBalance.protein[nb.protein as keyof typeof nutritionBalance.protein]++;
        if (nb.vegetables) nutritionBalance.vegetables[nb.vegetables as keyof typeof nutritionBalance.vegetables]++;
        if (nb.carbs) nutritionBalance.carbs[nb.carbs as keyof typeof nutritionBalance.carbs]++;
        if (nb.fat) nutritionBalance.fat[nb.fat as keyof typeof nutritionBalance.fat]++;
        if (nb.fiber) nutritionBalance.fiber[nb.fiber as keyof typeof nutritionBalance.fiber]++;
      }
    });

    logger.debug('营养素统计结果', { nutritionBalance });

    // 确定主要的营养素状态（取出现最多的状态）
    const getDominantStatus = (counts: typeof nutritionBalance.protein) => {
      if (counts.充足 >= counts.不足 && counts.充足 >= counts.缺乏) return '充足';
      if (counts.不足 >= counts.缺乏) return '不足';
      return '缺乏';
    };

    // 4. 基于营养素平衡状态生成建议
    const proteinStatus = getDominantStatus(nutritionBalance.protein);
    const fiberStatus = getDominantStatus(nutritionBalance.fiber);
    const veggiesStatus = getDominantStatus(nutritionBalance.vegetables);

    // 根据营养素缺乏/不足添加建议
    if (proteinStatus === '不足' || proteinStatus === '缺乏') {
      personalizedRecommendations.push({
        priority: 'high',
        category: 'nutrition-balance',
        recommendation: `增加优质蛋白摄入（瘦肉、鱼类、蛋类、豆制品）`,
        reason: `当前蛋白质摄入${proteinStatus}，建议每餐包含掌心大小的蛋白质食物`
      });
    }

    if (fiberStatus === '不足' || fiberStatus === '缺乏') {
      personalizedRecommendations.push({
        priority: 'high',
        category: 'nutrition-balance',
        recommendation: '增加全谷物、蔬菜和水果摄入',
        reason: `当前膳食纤维摄入${fiberStatus}，建议每日摄入25-35g膳食纤维`
      });
    }

    if (veggiesStatus === '不足' || veggiesStatus === '缺乏') {
      personalizedRecommendations.push({
        priority: 'medium',
        category: 'nutrition-balance',
        recommendation: '每餐蔬菜应占餐盘的1/2',
        reason: `当前蔬菜摄入${veggiesStatus}，建议每日摄入300-500g蔬菜`
      });
    }

    // 打印个性化建议日志
    logger.debug('生成的个性化建议', {
      count: personalizedRecommendations.length,
      recommendations: personalizedRecommendations.map((rec, idx) => ({
        index: idx + 1,
        category: rec.category,
        priority: rec.priority,
        recommendation: rec.recommendation,
        reason: rec.reason,
      })),
    });

    combinedAnalysis.recommendations = {
      personalized: personalizedRecommendations.sort((a, b) => {
        // 按优先级排序：high > medium > low
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      }),
      general: {
        removals: allRemovals.slice(0, 5), // 最多显示5个
        additions: allAdditions.slice(0, 5),
        modifications: allModifications.slice(0, 5),
      },
    };
    // 不再添加photoAnalysis，因为combinedEvaluation已经包含了所有需要的数据

    // 更新食谱组的综合分析结果
    const updatedMealGroup = await prisma.dietPhotoMealGroup.update({
      where: { id: groupId },
      data: {
        combinedAnalysis: JSON.stringify(combinedAnalysis),
        totalScore: avgScore,
        overallRating: getRating(avgScore),
      },
    });

    logger.apiSuccess('POST', `/api/clients/${id}/meal-groups/${groupId}/analyze`, '食谱组分析完成');

    return NextResponse.json({
      success: true,
      combinedAnalysis,
      totalScore: avgScore,
      overallRating: getRating(avgScore),
    });
  } catch (error) {
    logger.apiError('POST', `/api/clients/${id}/meal-groups/${groupId}/analyze`, error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      { error: '分析食谱组失败', details: errorMessage },
      { status: 500 }
    );
  }
}

// PATCH - 更新食谱组（日期、餐型、备注）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  let id = '';
  let groupId = '';
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    groupId = resolvedParams.groupId;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户访问权限
    const client = await prisma.client.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    // 验证食谱组是否存在
    const mealGroup = await prisma.dietPhotoMealGroup.findFirst({
      where: {
        id: groupId,
        clientId: id,
      },
    });

    if (!mealGroup) {
      return NextResponse.json({ error: '食谱组不存在' }, { status: 404 });
    }

    const body = await request.json();
    const { name, date, mealType, notes, textDescription } = body;

    // 更新食谱组
    const updatedGroup = await prisma.dietPhotoMealGroup.update({
      where: { id: groupId },
      data: {
        name: name || mealGroup.name,
        date: date || mealGroup.date,
        mealType: mealType || mealGroup.mealType,
        notes: notes !== undefined ? notes : mealGroup.notes,
        textDescription: textDescription !== undefined ? textDescription : mealGroup.textDescription,
      },
      include: {
        photos: {
          orderBy: { uploadedAt: 'asc' },
        },
      },
    });

    // 转换 Date 为字符串并解析 JSON 字段
    const groupWithParsedData = {
      ...updatedGroup,
      createdAt: updatedGroup.createdAt.toISOString(),
      updatedAt: updatedGroup.updatedAt.toISOString(),
      combinedAnalysis: safeJSONParse(updatedGroup.combinedAnalysis, null),
      photos: updatedGroup.photos.map(photo => ({
        ...photo,
        uploadedAt: photo.uploadedAt.toISOString(),
        createdAt: photo.createdAt.toISOString(),
        updatedAt: photo.updatedAt.toISOString(),
        analyzedAt: photo.analyzedAt ? photo.analyzedAt.toISOString() : null,
        analysis: safeJSONParse(photo.analysis, null),
      })),
    };

    logger.apiSuccess('PATCH', `/api/clients/${id}/meal-groups/${groupId}`, '食谱组更新成功');

    return NextResponse.json({
      success: true,
      message: '食谱组更新成功',
      mealGroup: groupWithParsedData,
    });
  } catch (error) {
    logger.apiError('PATCH', `/api/clients/${id}/meal-groups/${groupId}`, error);
    return NextResponse.json({ error: '更新食谱组失败' }, { status: 500 });
  }
}
