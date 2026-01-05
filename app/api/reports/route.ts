import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// GET - 获取当前用户的所有报告
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 获取用户所有客户的报告
    const clients = await prisma.client.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    });

    const clientIds = clients.map(c => c.id);

    const reports = await prisma.report.findMany({
      where: { clientId: { in: clientIds } },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('获取报告列表错误:', error);
    return NextResponse.json({ error: '获取报告列表失败' }, { status: 500 });
  }
}
