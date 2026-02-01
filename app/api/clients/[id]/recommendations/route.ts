import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/clients/[id]/recommendations
 * 获取指定客户的建议列表
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

    // 获取该用户的指定客户的建议列表
    const recommendations = await prisma.recommendation.findMany({
      where: {
        clientId: id,
        client: {
          userId: userId,
        },
      },
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
      orderBy: {
        generatedAt: 'desc',
      },
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('获取客户建议列表错误:', error);
    return NextResponse.json({ error: '获取建议列表失败' }, { status: 500 });
  }
}
