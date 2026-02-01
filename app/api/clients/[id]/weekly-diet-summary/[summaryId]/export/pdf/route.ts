import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { generateWeeklyDietSummaryPDF } from '@/lib/pdf/generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; summaryId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id, summaryId } = await params;

    // 验证客户访问权限
    const client = await prisma.client.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    // 获取周饮食汇总
    const summary = await prisma.weeklyDietSummary.findFirst({
      where: {
        id: summaryId,
        clientId: id,
      },
    });

    if (!summary) {
      return NextResponse.json({ error: '周饮食汇总不存在' }, { status: 404 });
    }

    // 解析汇总内容
    const summaryContent = JSON.parse(summary.summary);
    const clientName = client.name || '客户';
    const generatedDate = new Date(summary.generatedAt).toLocaleDateString('zh-CN');
    const weekRange = `${summary.weekStartDate} 至 ${summary.weekEndDate}`;

    // 生成PDF
    const buffer = await generateWeeklyDietSummaryPDF(
      summaryContent,
      clientName,
      generatedDate,
      weekRange
    );

    // 生成文件名
    const fileName = `周饮食汇总-${weekRange}-${clientName}.pdf`;

    // 返回PDF文件
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('周饮食汇总PDF生成错误:', error);
    console.error('错误堆栈:', error.stack);
    const message = error.message || 'PDF生成失败';
    return NextResponse.json({
      error: message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
