import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// GET - 获取当前用户的所有建议
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 获取用户所有客户的建议
    const clients = await prisma.client.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    });

    const clientIds = clients.map(c => c.id);

    const recommendations = await prisma.recommendation.findMany({
      where: { clientId: { in: clientIds } },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        report: {
          select: {
            id: true,
            fileName: true,
            uploadedAt: true,
            analysis: true,
          },
        },
      },
      orderBy: { generatedAt: 'desc' },
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('获取建议列表错误:', error);
    return NextResponse.json({ error: '获取建议列表失败' }, { status: 500 });
  }
}
