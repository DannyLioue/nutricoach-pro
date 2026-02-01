import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/clients/[id]/plan-evaluations
 * 获取客户的计划评估历史记录
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 验证用户权限
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 2. 获取客户端 ID
    const { id: clientId } = await params;

    // 3. 获取评估历史记录（按时间倒序）
    const evaluations = await prisma.planEvaluation.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });

    // 4. 返回结果
    return NextResponse.json({
      success: true,
      evaluations,
    });

  } catch (error) {
    console.error('[Get Plan Evaluations] Error:', error);
    return NextResponse.json(
      {
        error: '获取评估记录失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
