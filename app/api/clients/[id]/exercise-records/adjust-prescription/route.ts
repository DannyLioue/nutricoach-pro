import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { generateExercisePrescriptionAdjustment } from '@/lib/ai/gemini';

/**
 * POST /api/clients/[id]/exercise-records/adjust-prescription
 * Generate exercise prescription adjustment based on actual performance
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { id: clientId } = await params;

    // Verify client access
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        gender: true,
        birthDate: true,
        healthConcerns: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    // Get exercise records for the past 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);

    const records = await prisma.exerciseRecord.findMany({
      where: {
        clientId: clientId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    // Get current exercise prescription
    const latestRecommendation = await prisma.recommendation.findFirst({
      where: {
        clientId: clientId,
        type: 'COMPREHENSIVE',
      },
      orderBy: { generatedAt: 'desc' },
      take: 1,
    });

    if (!latestRecommendation) {
      return NextResponse.json({ error: '未找到运动处方，请先生成综合建议方案' }, { status: 400 });
    }

    // Parse recommendation content
    let prescription = null;
    try {
      const content = typeof latestRecommendation.content === 'string'
        ? JSON.parse(latestRecommendation.content)
        : latestRecommendation.content;

      if (content.exercisePrescription) {
        prescription = content.exercisePrescription;
      } else if (content.exercise) {
        prescription = content.exercise;
      } else if (content.detailedExercisePrescription) {
        prescription = content.detailedExercisePrescription;
      }
    } catch (error) {
      console.error('Failed to parse recommendation content:', error);
    }

    if (!prescription) {
      return NextResponse.json({ error: '建议方案中没有运动处方信息' }, { status: 400 });
    }

    // Prepare data for AI
    const clientInfo = {
      name: client.name,
      gender: client.gender,
      age: new Date().getFullYear() - new Date(client.birthDate).getFullYear(),
      healthConcerns: (client.healthConcerns
        ? typeof client.healthConcerns === 'string'
          ? JSON.parse(client.healthConcerns)
          : client.healthConcerns
        : []),
    };

    const actualRecords = records.map(r => ({
      date: r.date.toISOString().split('T')[0],
      type: r.type,
      duration: r.duration,
      intensity: r.intensity || undefined,
    }));

    const targetDateRange = `${startDate.toISOString().split('T')[0]} 至 ${endDate.toISOString().split('T')[0]}`;

    // Generate adjustment using AI
    const adjustment = await generateExercisePrescriptionAdjustment(
      clientInfo,
      actualRecords,
      prescription,
      targetDateRange
    );

    return NextResponse.json({
      success: true,
      adjustment,
      summary: {
        totalRecords: actualRecords.length,
        totalDuration: actualRecords.reduce((sum, r) => sum + r.duration, 0),
        dateRange: targetDateRange,
      },
    });
  } catch (error) {
    console.error('Failed to generate prescription adjustment:', error);
    return NextResponse.json(
      {
        error: '生成运动处方调整失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
