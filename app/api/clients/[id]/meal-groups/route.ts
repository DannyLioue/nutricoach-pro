import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// 验证 schema - 允许照片或文字描述其中一个
const createMealGroupSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
  mealType: z.enum(['早餐', '午餐', '晚餐', '加餐', '全天']).optional(),
  notes: z.string().optional(),
  textDescription: z.string().optional(), // 文字描述（用于没有照片的情况）
  photos: z.array(z.object({
    data: z.string().min(1, '图片数据不能为空'),
    mealType: z.string().optional(),
    notes: z.string().optional(),
  })).optional(), // 照片可选
}).refine(
  (data) => {
    // 至少需要有照片或文字描述其中一个
    const hasPhotos = data.photos && data.photos.length > 0;
    const hasText = data.textDescription && data.textDescription.trim().length > 0;
    return hasPhotos || hasText;
  },
  { message: '请至少上传一张照片或填写文字描述' }
);

// GET - 获取客户的所有食谱组
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id = '';
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
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

    // 获取所有食谱组
    const mealGroups = await prisma.dietPhotoMealGroup.findMany({
      where: { clientId: id },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: {
        photos: {
          orderBy: { uploadedAt: 'asc' },
        },
      },
    });

    // 自动关联孤立照片到对应的食谱组
    for (const group of mealGroups) {
      const orphanPhotos = await prisma.dietPhoto.findMany({
        where: {
          clientId: id,
          mealGroupId: null,
          uploadedAt: {
            gte: new Date(group.date + 'T00:00:00'),
            lt: new Date(group.date + 'T23:59:59'),
          },
        },
      });

      if (orphanPhotos.length > 0) {
        console.log(`[自动关联] 食谱组 "${group.name}" (${group.date}) 发现 ${orphanPhotos.length} 张孤立照片，正在关联...`);
        await prisma.dietPhoto.updateMany({
          where: {
            id: { in: orphanPhotos.map(p => p.id) },
          },
          data: {
            mealGroupId: group.id,
          },
        });
        console.log(`[自动关联] 已将 ${orphanPhotos.length} 张照片关联到食谱组 "${group.name}"`);
      }
    }

    // 重新获取包含关联后的照片的食谱组
    const finalMealGroups = await prisma.dietPhotoMealGroup.findMany({
      where: { clientId: id },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: {
        photos: {
          orderBy: { uploadedAt: 'asc' },
        },
      },
    });

    // 调试日志
    console.log('=== GET Meal Groups ===');
    console.log('Client ID:', id);
    console.log('Found meal groups:', finalMealGroups.length);
    finalMealGroups.forEach((group, idx) => {
      console.log(`Group ${idx + 1}:`, {
        id: group.id,
        name: group.name,
        date: group.date,
        photosCount: group.photos.length,
        photoIds: group.photos.map(p => p.id),
      });
    });
    console.log('=======================');

    // 解析 JSON 字段并转换 Date 为字符串
    const groupsWithParsedData = finalMealGroups.map(group => ({
      ...group,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
      combinedAnalysis: group.combinedAnalysis ? JSON.parse(group.combinedAnalysis) : null,
      photos: group.photos.map(photo => ({
        ...photo,
        uploadedAt: photo.uploadedAt.toISOString(),
        createdAt: photo.createdAt.toISOString(),
        updatedAt: photo.updatedAt.toISOString(),
        analyzedAt: photo.analyzedAt ? photo.analyzedAt.toISOString() : null,
        analysis: photo.analysis ? JSON.parse(photo.analysis) : null,
      })),
    }));

    return NextResponse.json({ mealGroups: groupsWithParsedData });
  } catch (error) {
    console.error('Failed to fetch meal groups:', error);
    return NextResponse.json({ error: '获取食谱组失败' }, { status: 500 });
  }
}

// POST - 创建新的食谱组
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id = '';
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
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

    const body = await request.json();
    const validatedData = createMealGroupSchema.parse(body);

    // 创建食谱组
    const mealGroup = await prisma.dietPhotoMealGroup.create({
      data: {
        clientId: id,
        name: validatedData.name,
        date: validatedData.date,
        mealType: validatedData.mealType,
        notes: validatedData.notes,
        textDescription: validatedData.textDescription,
      },
    });

    // 创建照片并关联到食谱组（仅当有照片时）
    let createdPhotos: any[] = [];
    if (validatedData.photos && validatedData.photos.length > 0) {
      createdPhotos = await Promise.all(
        validatedData.photos.map(photo =>
          prisma.dietPhoto.create({
            data: {
              clientId: id,
              mealGroupId: mealGroup.id,
              imageUrl: photo.data,
              mealType: photo.mealType || null,
              notes: photo.notes || null,
            },
          })
        )
      );
    }

    // 调试日志
    console.log('=== POST Meal Group Created ===');
    console.log('Meal Group ID:', mealGroup.id);
    console.log('Photos to create:', validatedData.photos?.length || 0);
    console.log('Photos created:', createdPhotos.length);
    console.log('Photo IDs:', createdPhotos.map(p => ({ id: p.id, mealGroupId: p.mealGroupId })));
    console.log('============================');

    // 重新获取完整数据
    const fullMealGroup = await prisma.dietPhotoMealGroup.findUnique({
      where: { id: mealGroup.id },
      include: {
        photos: true,
      },
    });

    if (!fullMealGroup) {
      return NextResponse.json({ error: '创建失败' }, { status: 500 });
    }

    // 转换 Date 为字符串并解析 JSON 字段
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
      combinedAnalysis: fullMealGroup.combinedAnalysis ? JSON.parse(fullMealGroup.combinedAnalysis) : null,
      photos: fullMealGroup.photos.map(photo => ({
        ...photo,
        uploadedAt: photo.uploadedAt.toISOString(),
        createdAt: photo.createdAt.toISOString(),
        updatedAt: photo.updatedAt.toISOString(),
        analyzedAt: photo.analyzedAt ? photo.analyzedAt.toISOString() : null,
        analysis: photo.analysis ? JSON.parse(photo.analysis) : null,
      })),
    };

    return NextResponse.json({
      success: true,
      mealGroup: groupWithParsedData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '数据验证失败', details: error.issues }, { status: 400 });
    }
    console.error('Failed to create meal group:', error);
    return NextResponse.json({ error: '创建食谱组失败' }, { status: 500 });
  }
}
