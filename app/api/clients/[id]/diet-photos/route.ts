import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// 验证 schema - 单张照片
const dietPhotoSchema = z.object({
  data: z.string().min(1, '图片数据不能为空'),
  mealType: z.enum(['早餐', '午餐', '晚餐', '加餐']).optional(),
  notes: z.string().optional(),
});

// 上传照片 schema
const uploadPhotosSchema = z.object({
  photos: z.array(dietPhotoSchema).min(1, '至少需要上传一张照片').max(9, '单次最多上传9张照片'),
});

// GET - 获取客户的所有饮食照片
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id = '';
  try {
    id = (await params).id;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户访问权限
    const accessResult = await verifyClientAccess(id, session.user.id);
    if (!accessResult.exists) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.statusCode || 404 });
    }

    // 获取所有独立的饮食照片（排除属于食谱组的照片）
    const photos = await prisma.dietPhoto.findMany({
      where: {
        clientId: id,
        mealGroupId: null, // 只获取独立的照片，不包括食谱组中的照片
      },
      orderBy: { uploadedAt: 'desc' },
    });

    // 解析分析结果的JSON字段并转换Date为字符串
    const photosWithParsedAnalysis = photos.map(photo => ({
      ...photo,
      uploadedAt: photo.uploadedAt.toISOString(),
      createdAt: photo.createdAt.toISOString(),
      updatedAt: photo.updatedAt.toISOString(),
      analyzedAt: photo.analyzedAt ? photo.analyzedAt.toISOString() : null,
      analysis: photo.analysis ? JSON.parse(photo.analysis) : null,
    }));

    return NextResponse.json({ photos: photosWithParsedAnalysis });
  } catch (error) {
    logger.apiError('GET', `/api/clients/${id}/diet-photos`, error);
    return NextResponse.json({ error: '获取饮食照片失败' }, { status: 500 });
  }
}

// POST - 上传饮食照片
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id = '';
  try {
    id = (await params).id;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户是否属于当前用户
    const client = await prisma.client.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    const body = await request.json();
    logger.apiRequest('POST', `/api/clients/${id}/diet-photos`, id);

    const validatedData = uploadPhotosSchema.parse(body);
    logger.debug('[DIET PHOTOS POST] Photos count:', validatedData.photos.length);

    // 创建饮食照片记录
    const createdPhotos = await Promise.all(
      validatedData.photos.map(photo => {
        // 直接存储 Base64 数据
        return prisma.dietPhoto.create({
          data: {
            clientId: id,
            imageUrl: photo.data, // 存储 Base64 数据
            mealType: photo.mealType || null,
            notes: photo.notes || null,
          },
        });
      })
    );

    logger.apiSuccess('POST', `/api/clients/${id}/diet-photos`, `Created ${createdPhotos.length} photos`);

    // 转换Date为字符串
    const photosWithFormattedDates = createdPhotos.map(photo => ({
      ...photo,
      uploadedAt: photo.uploadedAt.toISOString(),
      createdAt: photo.createdAt.toISOString(),
      updatedAt: photo.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      message: `成功上传 ${createdPhotos.length} 张照片`,
      photos: photosWithFormattedDates,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('[DIET PHOTOS POST] Validation error', error.issues);
      return NextResponse.json({ error: '数据验证失败', details: error.issues }, { status: 400 });
    }
    logger.apiError('POST', `/api/clients/${id}/diet-photos`, error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: '上传饮食照片失败', details: errorMessage }, { status: 500 });
  }
}
