import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// GET - 获取单个建议详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;

    const recommendation = await prisma.recommendation.findFirst({
      where: {
        id,
        client: {
          userId: session.user.id,
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
    });

    if (!recommendation) {
      return NextResponse.json({ error: '建议不存在' }, { status: 404 });
    }

    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error('获取建议详情错误:', error);
    return NextResponse.json({ error: '获取建议详情失败' }, { status: 500 });
  }
}

// DELETE - 删除建议
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;

    // 验证建议是否属于当前用户
    const recommendation = await prisma.recommendation.findFirst({
      where: {
        id,
        client: {
          userId: session.user.id,
        },
      },
    });

    if (!recommendation) {
      return NextResponse.json({ error: '建议不存在' }, { status: 404 });
    }

    // 删除建议
    await prisma.recommendation.delete({
      where: { id },
    });

    return NextResponse.json({ message: '建议删除成功' });
  } catch (error) {
    console.error('删除建议错误:', error);
    return NextResponse.json({ error: '删除建议失败' }, { status: 500 });
  }
}
