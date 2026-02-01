import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { logger } from '@/lib/logger';

// GET - 获取单个周饮食汇总详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; summaryId: string }> }
) {
  let clientId = '';
  let summaryId = '';
  try {
    clientId = (await params).id;
    summaryId = (await params).summaryId;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户访问权限
    const accessResult = await verifyClientAccess(clientId, session.user.id);
    if (!accessResult.exists) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.statusCode || 404 });
    }

    // 获取汇总记录
    const summary = await prisma.weeklyDietSummary.findFirst({
      where: {
        id: summaryId,
        clientId: clientId,
      },
    });

    if (!summary) {
      return NextResponse.json({ error: '周饮食汇总不存在' }, { status: 404 });
    }

    // 解析 JSON 字段
    const summaryWithParsedData = {
      ...summary,
      summary: JSON.parse(summary.summary),
      mealGroupIds: JSON.parse(summary.mealGroupIds),
    };

    logger.apiSuccess('GET', `/api/clients/${clientId}/weekly-diet-summary/${summaryId}`, 'Summary retrieved');

    return NextResponse.json({
      success: true,
      summary: summaryWithParsedData,
    });
  } catch (error) {
    logger.apiError('GET', `/api/clients/${clientId}/weekly-diet-summary/${summaryId}`, error);
    return NextResponse.json({ error: '获取周饮食汇总详情失败' }, { status: 500 });
  }
}

// DELETE - 删除周饮食汇总
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; summaryId: string }> }
) {
  let clientId = '';
  let summaryId = '';
  try {
    clientId = (await params).id;
    summaryId = (await params).summaryId;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户访问权限
    const accessResult = await verifyClientAccess(clientId, session.user.id);
    if (!accessResult.exists) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.statusCode || 404 });
    }

    // 验证汇总是否存在
    const existingSummary = await prisma.weeklyDietSummary.findFirst({
      where: {
        id: summaryId,
        clientId: clientId,
      },
    });

    if (!existingSummary) {
      return NextResponse.json({ error: '周饮食汇总不存在' }, { status: 404 });
    }

    // 删除汇总
    await prisma.weeklyDietSummary.delete({
      where: { id: summaryId },
    });

    logger.apiSuccess('DELETE', `/api/clients/${clientId}/weekly-diet-summary/${summaryId}`, 'Weekly diet summary deleted');

    return NextResponse.json({
      success: true,
      message: '周饮食汇总已删除',
    });
  } catch (error) {
    logger.apiError('DELETE', `/api/clients/${clientId}/weekly-diet-summary/${summaryId}`, error);
    return NextResponse.json({ error: '删除周饮食汇总失败' }, { status: 500 });
  }
}
