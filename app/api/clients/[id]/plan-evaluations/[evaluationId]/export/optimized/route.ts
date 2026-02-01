import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { generateOptimizedPlanPDF } from '@/lib/pdf/generator';

/**
 * GET /api/clients/[id]/plan-evaluations/[evaluationId]/export/optimized
 * 导出优化后的计划为 PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; evaluationId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id: clientId, evaluationId } = await params;

    // 获取评估记录
    const evaluation = await prisma.planEvaluation.findFirst({
      where: {
        id: evaluationId,
        clientId,
        client: {
          userId: session.user.id,
        },
      },
      include: {
        client: true,
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: '评估记录不存在' }, { status: 404 });
    }

    // 检查是否有优化后的计划
    if (!evaluation.optimizedPlan) {
      return NextResponse.json({ error: '暂无优化方案' }, { status: 400 });
    }

    const clientName = evaluation.client?.name || '客户';
    const generatedDate = new Date(evaluation.createdAt).toLocaleDateString('zh-CN');
    const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-');
    const planTypeLabel = evaluation.planType === 'diet' ? '饮食方案' : '运动方案';
    const fileName = `AI优化${planTypeLabel}-${clientName}-${timestamp}.pdf`;

    // 生成 PDF
    const buffer = await generateOptimizedPlanPDF(
      {
        planType: evaluation.planType as 'diet' | 'exercise',
        optimizedPlan: evaluation.optimizedPlan,
      },
      clientName,
      generatedDate
    );

    // 返回 PDF 文件
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('PDF生成错误:', error);
    console.error('错误堆栈:', error.stack);
    const message = error.message || 'PDF生成失败';
    return NextResponse.json(
      {
        error: message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
