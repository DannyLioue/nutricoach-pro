import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/clients/[id]/reports
 * 获取指定客户的报告列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    // 验证用户登录
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const userId = session.user.id;

    // 获取该用户的指定客户的报告列表
    const reports = await prisma.report.findMany({
      where: {
        client: {
          id: id,
          userId: userId,
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('获取客户报告列表错误:', error);
    return NextResponse.json({ error: '获取报告列表失败' }, { status: 500 });
  }
}
