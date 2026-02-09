import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db/prisma';
import { evaluateDietPhotoCompliance } from '@/lib/ai/gemini';

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

// 解析健康问题
function parseHealthConcerns(healthConcernsStr: string): string[] {
  try {
    const parsed = JSON.parse(healthConcernsStr || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// POST - 分析饮食照片（合规性评估）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  let id = '';
  let photoId = '';
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    photoId = resolvedParams.photoId;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户访问权限
    const accessResult = await verifyClientAccess(id, session.user.id);
    if (!accessResult.exists) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.statusCode || 404 });
    }

    // 验证照片是否属于该客户
    const photo = await prisma.dietPhoto.findFirst({
      where: {
        id: photoId,
        clientId: id,
      },
    });

    if (!photo) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    logger.apiRequest('POST', `/api/clients/${id}/diet-photos/${photoId}/analyze`, photoId);

    // 获取客户的最新综合营养干预方案
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
      return NextResponse.json({
        error: '该客户暂无营养干预方案',
        needsRecommendation: true,
        message: '进行饮食评估需要先为客户生成营养干预方案，这样可以提供更准确的建议',
        suggestion: '请前往 "营养建议" 页面为客户生成专业营养干预方案',
        actionUrl: `/clients/${id}/recommendations/new`,
      }, { status: 400 });
    }

    // 准备客户信息
    const client = accessResult.client!;
    const clientInfo = {
      name: client.name || '',
      gender: client.gender || 'FEMALE',
      age: calculateAge(client.birthDate),
      healthConcerns: parseHealthConcerns(client.healthConcerns || '[]'),
      userRequirements: client.userRequirements || '',
      preferences: client.preferences || '',
    };

    // 打印客户信息日志
    console.log('=== 饮食照片分析 - 客户信息 ===');
    console.log('客户ID:', id);
    console.log('照片ID:', photoId);
    console.log('健康问题:', clientInfo.healthConcerns);
    console.log('用户需求:', clientInfo.userRequirements);
    console.log('饮食偏好:', clientInfo.preferences);
    console.log('干预方案日期:', latestRecommendation.generatedAt);
    console.log('==========================');

    // 调用 AI 合规性评估
    const evaluation = await evaluateDietPhotoCompliance(
      photo.imageUrl,
      clientInfo,
      latestRecommendation.content,
      photo.notes // 传递备注信息，对照片的补充说明
    );

    // 生成个性化建议
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
          reason: '需要DASH饮食模式，每日盐摄入<5g'
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

    // 3. 基于营养平衡评估生成建议
    const nutritionBalance = evaluation.complianceEvaluation?.nutritionBalance;
    if (nutritionBalance) {
      if (nutritionBalance.protein === '不足' || nutritionBalance.protein === '缺乏') {
        personalizedRecommendations.push({
          priority: 'high',
          category: 'nutrition-balance',
          recommendation: '增加优质蛋白摄入（瘦肉、鱼类、蛋类、豆制品）',
          reason: `当前蛋白质${nutritionBalance.protein}，建议每餐包含掌心大小的蛋白质食物`
        });
      }
      if (nutritionBalance.fiber === '不足' || nutritionBalance.fiber === '缺乏') {
        personalizedRecommendations.push({
          priority: 'high',
          category: 'nutrition-balance',
          recommendation: '增加全谷物、蔬菜和水果摄入',
          reason: `当前膳食纤维${nutritionBalance.fiber}，建议每日摄入25-35g膳食纤维`
        });
      }
      if (nutritionBalance.vegetables === '不足' || nutritionBalance.vegetables === '缺乏') {
        personalizedRecommendations.push({
          priority: 'medium',
          category: 'nutrition-balance',
          recommendation: '每餐蔬菜应占餐盘的1/2',
          reason: `当前蔬菜摄入${nutritionBalance.vegetables}，建议每日摄入300-500g蔬菜`
        });
      }
    }

    // 按优先级排序
    personalizedRecommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
    });

    // 打印个性化建议日志
    console.log('=== 生成的个性化建议 ===');
    console.log('建议数量:', personalizedRecommendations.length);
    personalizedRecommendations.forEach((rec, idx) => {
      console.log(`[${idx + 1}] ${rec.category} | ${rec.priority}优先级`);
      console.log(`    建议: ${rec.recommendation}`);
      console.log(`    原因: ${rec.reason}`);
    });
    console.log('========================');

    // 将个性化建议添加到评估结果中
    const evaluationWithRecommendations = {
      ...evaluation,
      personalizedRecommendations,
    };

    logger.apiSuccess('POST', `/api/clients/${id}/diet-photos/${photoId}/analyze`, '合规性评估完成');

    // 更新照片记录，保存评估结果
    const updatedPhoto = await prisma.dietPhoto.update({
      where: { id: photoId },
      data: {
        analysis: JSON.stringify(evaluationWithRecommendations),
        analyzedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      evaluation: evaluationWithRecommendations,
      evaluationMode: 'COMPLIANCE',
      recommendationDate: latestRecommendation.generatedAt,
      analyzedAt: updatedPhoto.analyzedAt,
    });
  } catch (error) {
    logger.apiError('POST', `/api/clients/${id}/diet-photos/${photoId}/analyze`, error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      { error: '分析失败', details: errorMessage },
      { status: 500 }
    );
  }
}
