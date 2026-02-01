import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { 
  generateFoodGuidePDF, 
  generateExercisePlanPDF,
  generateRecommendationSummaryPDF,
  generateHealthAnalysisPDF,
  generateActionPlanPDF,
  generateSupplementsPDF,
} from '@/lib/pdf/generator';

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
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';

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
    const clientName = recommendation.client?.name || '客户';
    const generatedDate = new Date(recommendation.generatedAt || new Date()).toLocaleDateString('zh-CN');

    let buffer: Buffer;
    let fileName: string;
    const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-');

    switch (type) {
      case 'summary':
      case 'overview':
        if (!content.biomarkerInterventionMapping && !content.twoWeekPlan) {
          return NextResponse.json({ error: '暂无干预方案数据' }, { status: 400 });
        }
        fileName = `营养干预方案-${clientName}.pdf`;
        buffer = await generateRecommendationSummaryPDF(content, clientName, generatedDate);
        break;

      case 'health-analysis':
        if (!content.biomarkerInterventionMapping && !content.healthConcernsInterventions) {
          return NextResponse.json({ error: '暂无健康分析数据' }, { status: 400 });
        }
        fileName = `健康分析报告-${clientName}.pdf`;
        buffer = await generateHealthAnalysisPDF(content, clientName, generatedDate);
        break;

      case 'food':
      case 'food-guide':
        if (!content.trafficLightFoods) {
          return NextResponse.json({ error: '暂无食物指南数据' }, { status: 400 });
        }
        fileName = `红绿灯食物指南-${clientName}.pdf`;
        buffer = await generateFoodGuidePDF(content, clientName, generatedDate);
        break;

      case 'exercise':
      case 'exercise-plan':
        if (!content.detailedExercisePrescription) {
          return NextResponse.json({ error: '暂无运动处方数据' }, { status: 400 });
        }
        fileName = `运动处方-${clientName}.pdf`;
        buffer = await generateExercisePlanPDF(content, clientName, generatedDate);
        break;

      case 'action-plan':
        if (!content.twoWeekPlan) {
          return NextResponse.json({ error: '暂无执行计划数据' }, { status: 400 });
        }
        fileName = `两周执行计划-${clientName}.pdf`;
        buffer = await generateActionPlanPDF(content, clientName, generatedDate);
        break;

      case 'supplements':
        if (!content.supplements || content.supplements.length === 0) {
          return NextResponse.json({ error: '暂无补充剂数据' }, { status: 400 });
        }
        fileName = `补充剂清单-${clientName}.pdf`;
        buffer = await generateSupplementsPDF(content, clientName, generatedDate);
        break;

      default:
        return NextResponse.json({ error: '无效的导出类型' }, { status: 400 });
    }

    // 返回PDF文件
    // 使用 RFC 5987 编码的文件名（支持UTF-8）
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
    return NextResponse.json({ 
      error: message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 });
  }
}
