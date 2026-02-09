import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// 验证 schema - 只需要新日期
const copyMealGroupSchema = z.object({
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
});

// POST - 复制食谱组到新日期
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

    // 解析请求体
    const body = await request.json();
    const validatedData = copyMealGroupSchema.parse(body);

    // 查找源食谱组
    const sourceGroup = await prisma.dietPhotoMealGroup.findFirst({
      where: {
        id: groupId,
        clientId: id,
      },
      include: {
        photos: true,
      },
    });

    if (!sourceGroup) {
      return NextResponse.json(
        { error: '食谱组不存在' },
        { status: 404 }
      );
    }

    // 生成新名称（与创建逻辑一致：时间+餐型，例如 "2024年1月15日早餐"）
    const d = new Date(validatedData.newDate);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const mealTypeName = sourceGroup.mealType || '用餐';
    const newName = `${year}年${month}月${day}日${mealTypeName}`;

    logger.info('[MealGroup Copy] 开始复制食谱组', {
      sourceGroupId: sourceGroup.id,
      sourceName: sourceGroup.name,
      newDate: validatedData.newDate,
      newName,
      photoCount: sourceGroup.photos.length,
    });

    // 使用事务创建新食谱组和照片
    const result = await prisma.$transaction(async (tx) => {
      // 创建新的食谱组
      const newGroup = await tx.dietPhotoMealGroup.create({
        data: {
          clientId: id,
          name: newName,
          date: validatedData.newDate,
          mealType: sourceGroup.mealType,
          notes: sourceGroup.notes,
          textDescription: sourceGroup.textDescription,
          // 不复制分析结果，需要重新分析
          combinedAnalysis: null,
          totalScore: null,
          overallRating: null,
        },
      });

      // 复制所有照片
      const newPhotos = await Promise.all(
        sourceGroup.photos.map((photo) =>
          tx.dietPhoto.create({
            data: {
              clientId: id,
              mealGroupId: newGroup.id,
              imageUrl: photo.imageUrl, // Base64 数据
              mealType: photo.mealType,
              notes: photo.notes,
              // 不复制分析结果，需要重新分析
              analysis: null,
              analyzedAt: null,
            },
          })
        )
      );

      logger.info('[MealGroup Copy] 事务完成', {
        newGroupId: newGroup.id,
        newGroupName: newGroup.name,
        photosCreated: newPhotos.length,
      });

      return {
        group: newGroup,
        photos: newPhotos,
      };
    });

    // 重新获取完整数据以返回
    const fullMealGroup = await prisma.dietPhotoMealGroup.findUnique({
      where: { id: result.group.id },
      include: {
        photos: true,
      },
    });

    if (!fullMealGroup) {
      return NextResponse.json({ error: '创建失败' }, { status: 500 });
    }

    // 转换 Date 为字符串
    const groupWithParsedData = {
      ...fullMealGroup,
      id: fullMealGroup.id,
      clientId: fullMealGroup.clientId,
      name: fullMealGroup.name,
      date: fullMealGroup.date,
      mealType: fullMealGroup.mealType,
      notes: fullMealGroup.notes,
      totalScore: fullMealGroup.totalScore,
      overallRating: fullMealGroup.overallRating,
      createdAt: fullMealGroup.createdAt.toISOString(),
      updatedAt: fullMealGroup.updatedAt.toISOString(),
      combinedAnalysis: fullMealGroup.combinedAnalysis,
      photos: fullMealGroup.photos.map(photo => ({
        ...photo,
        uploadedAt: photo.uploadedAt.toISOString(),
        createdAt: photo.createdAt.toISOString(),
        updatedAt: photo.updatedAt.toISOString(),
        analyzedAt: photo.analyzedAt ? photo.analyzedAt.toISOString() : null,
        analysis: photo.analysis,
      })),
    };

    return NextResponse.json({
      success: true,
      mealGroup: groupWithParsedData,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '数据验证失败', details: error.issues },
        { status: 400 }
      );
    }
    logger.error('[MealGroup Copy] 复制食谱组失败', error);
    return NextResponse.json(
      { error: '复制食谱组失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
