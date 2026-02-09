import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { logger } from '@/lib/logger';

/**
 * GET /api/clients/[id]/weekly-diet-summary/check-updates
 *
 * 检查饮食汇总是否需要更新
 * 通过对比食谱组的 updatedAt 与汇总的 updatedAt 来检测变更
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let clientId = '';
  try {
    clientId = (await params).id;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    // 验证客户访问权限
    const access = await verifyClientAccess(clientId, session.user.id);
    if (!access.exists) {
      return NextResponse.json({ success: false, error: '客户不存在或无权访问' }, { status: 404 });
    }

    // 获取 summaryId 查询参数
    const { searchParams } = new URL(request.url);
    const summaryId = searchParams.get('summaryId');

    if (!summaryId) {
      return NextResponse.json(
        { success: false, error: '缺少 summaryId 参数' },
        { status: 400 }
      );
    }

    // 获取汇总记录
    const summary = await prisma.weeklyDietSummary.findFirst({
      where: {
        id: summaryId,
        clientId,
      },
    });

    if (!summary) {
      return NextResponse.json(
        { success: false, error: '汇总不存在' },
        { status: 404 }
      );
    }

    // 解析 mealGroupIds
    let mealGroupIds: string[] = [];
    try {
      mealGroupIds = JSON.parse(summary.mealGroupIds);
    } catch {
      mealGroupIds = [];
    }

    if (mealGroupIds.length === 0) {
      return NextResponse.json({
        success: true,
        hasUpdates: false,
        summary: {
          id: summary.id,
          startDate: summary.startDate,
          endDate: summary.endDate,
          summaryName: summary.summaryName,
          updatedAt: summary.updatedAt.toISOString(),
        },
        mealGroups: [],
        statistics: {
          total: 0,
          needsUpdate: 0,
          unchanged: 0,
        },
      });
    }

    // 获取所有关联的食谱组
    const mealGroups = await prisma.dietPhotoMealGroup.findMany({
      where: {
        id: { in: mealGroupIds },
        clientId,
      },
      select: {
        id: true,
        name: true,
        date: true,
        combinedAnalysis: true,
        updatedAt: true,
      },
      orderBy: { date: 'asc' },
    });

    // 对比时间戳，检测变更
    const summaryUpdateTime = new Date(summary.updatedAt).getTime();

    const mealGroupsWithStatus = mealGroups.map((group) => {
      const groupUpdateTime = new Date(group.updatedAt).getTime();
      const needsUpdate = groupUpdateTime > summaryUpdateTime;

      let reason: 'new_meal_group' | 'meal_group_updated' | 'unchanged';
      if (!group.combinedAnalysis) {
        reason = 'new_meal_group';
      } else if (needsUpdate) {
        reason = 'meal_group_updated';
      } else {
        reason = 'unchanged';
      }

      return {
        id: group.id,
        name: group.name,
        date: group.date,
        needsUpdate,
        reason,
        updatedAt: group.updatedAt.toISOString(),
      };
    });

    // 统计
    const statistics = {
      total: mealGroupIds.length,
      needsUpdate: mealGroupsWithStatus.filter((g) => g.needsUpdate).length,
      unchanged: mealGroupsWithStatus.filter((g) => !g.needsUpdate).length,
    };

    return NextResponse.json({
      success: true,
      hasUpdates: statistics.needsUpdate > 0,
      summary: {
        id: summary.id,
        startDate: summary.startDate,
        endDate: summary.endDate,
        summaryName: summary.summaryName,
        updatedAt: summary.updatedAt.toISOString(),
      },
      mealGroups: mealGroupsWithStatus,
      statistics,
    });
  } catch (error) {
    logger.error('检查汇总更新失败', { clientId, error });
    return NextResponse.json(
      { success: false, error: '检查更新失败' },
      { status: 500 }
    );
  }
}
