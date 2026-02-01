import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

/**
 * GET /api/dashboard/todos
 * 获取待办事项列表
 * - 待分析的饮食照片
 * - 待生成干预方案的客户
 * - 待分析的食谱组
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. 获取待分析的饮食照片（已上传但未分析）
    const pendingPhotos = await prisma.dietPhoto.findMany({
      where: {
        analysis: null,
        client: {
          userId,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
      take: 10,
    });

    // 2. 获取待生成干预方案的客户（有体检报告但无COMPREHENSIVE建议）
    const clientsWithReports = await prisma.client.findMany({
      where: {
        userId,
        reports: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            reports: true,
            recommendations: {
              where: {
                type: 'COMPREHENSIVE',
              },
            },
          },
        },
      },
    });

    const pendingRecommendations = clientsWithReports
      .filter((client) => client._count.recommendations === 0)
      .map((client) => ({
        id: client.id,
        name: client.name,
        hasReports: true,
        reportsCount: client._count.reports,
      }))
      .slice(0, 10);

    // 3. 获取待分析的食谱组（已创建但未分析）
    const pendingMealGroups = await prisma.dietPhotoMealGroup.findMany({
      where: {
        combinedAnalysis: null,
        photos: {
          some: {},
        },
        client: {
          userId,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            photos: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // 格式化返回数据
    const formattedPendingPhotos = pendingPhotos.map((photo) => ({
      id: photo.id,
      clientId: photo.clientId,
      clientName: photo.client.name,
      uploadedAt: photo.uploadedAt,
      mealType: photo.mealType,
    }));

    const formattedPendingMealGroups = pendingMealGroups.map((group) => ({
      id: group.id,
      clientId: group.clientId,
      clientName: group.client.name,
      name: group.name,
      photoCount: group._count.photos,
      createdAt: group.createdAt,
    }));

    logger.apiSuccess('GET', '/api/dashboard/todos', '获取待办事项成功');

    return NextResponse.json({
      pendingPhotos: formattedPendingPhotos,
      pendingRecommendations,
      pendingMealGroups: formattedPendingMealGroups,
    });
  } catch (error) {
    logger.apiError('GET', '/api/dashboard/todos', error);
    return NextResponse.json({ error: '获取待办事项失败' }, { status: 500 });
  }
}
