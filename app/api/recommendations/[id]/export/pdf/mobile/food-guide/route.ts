import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { generateFoodGuidePDFMobile } from '@/lib/pdf/generator';

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

    // 获取推荐数据
    const recommendation = await prisma.recommendation.findFirst({
      where: {
        id,
        client: {
          userId: session.user.id,
        },
      },
      include: {
        client: true,
      },
    });

    if (!recommendation) {
      return NextResponse.json({ error: '推荐不存在' }, { status: 404 });
    }

    const content = (recommendation.content || {}) as any;

    if (!content.trafficLightFoods) {
      return NextResponse.json({ error: '暂无食物指南数据' }, { status: 400 });
    }

    const clientName = recommendation.client?.name || '客户';
    const generatedDate = new Date(recommendation.generatedAt || new Date()).toLocaleDateString('zh-CN');
    const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-');

    // 生成移动端PDF
    const buffer = await generateFoodGuidePDFMobile(content, clientName, generatedDate);
    const fileName = `红绿灯食物指南(移动版)-${clientName}-${timestamp}.pdf`;

    // 返回PDF文件
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('移动端PDF生成错误:', error);
    console.error('错误堆栈:', error.stack);
    const message = error.message || 'PDF生成失败';
    return NextResponse.json({
      error: message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
