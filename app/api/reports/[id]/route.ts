import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// GET - 获取报告详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 获取报告及其客户信息
    const report = await prisma.report.findFirst({
      where: {
        id: id,
        client: {
          userId: session.user.id,
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: '报告不存在' }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error('获取报告详情错误:', error);
    return NextResponse.json({ error: '获取报告详情失败' }, { status: 500 });
  }
}

// PATCH - 更新报告分析结果
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { analysis } = body;

    // 验证报告是否属于当前用户
    const report = await prisma.report.findFirst({
      where: {
        id: id,
        client: {
          userId: session.user.id,
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: '报告不存在' }, { status: 404 });
    }

    // 更新报告分析结果
    const updatedReport = await prisma.report.update({
      where: { id },
      data: { analysis: analysis as any },
    });

    return NextResponse.json({ report: updatedReport });
  } catch (error) {
    console.error('更新报告错误:', error);
    return NextResponse.json({ error: '更新报告失败' }, { status: 500 });
  }
}

// DELETE - 删除报告
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证报告是否属于当前用户
    const report = await prisma.report.findFirst({
      where: {
        id: id,
        client: {
          userId: session.user.id,
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: '报告不存在' }, { status: 404 });
    }

    // 删除报告（会级联删除相关的建议）
    await prisma.report.delete({
      where: { id },
    });

    return NextResponse.json({ message: '报告删除成功' });
  } catch (error) {
    console.error('删除报告错误:', error);
    return NextResponse.json({ error: '删除报告失败' }, { status: 500 });
  }
}
