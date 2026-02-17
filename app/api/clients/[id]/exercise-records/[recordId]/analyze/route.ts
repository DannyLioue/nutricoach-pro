import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { analyzeExerciseScreenshot } from '@/lib/ai/gemini';

/**
 * POST /api/clients/[id]/exercise-records/[recordId]/analyze
 * Analyze exercise screenshot using AI
 *
 * Body: { force?: boolean } - If true, force re-analysis even if already analyzed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { id: clientId, recordId } = await params;

    // Parse request body to check for force flag
    const body = await request.json().catch(() => ({}));
    const forceReanalysis = body.force === true;

    // Fetch the exercise record
    const record = await prisma.exerciseRecord.findFirst({
      where: {
        id: recordId,
        clientId: clientId,
      },
    });

    if (!record) {
      return NextResponse.json({ error: '运动记录不存在' }, { status: 404 });
    }

    // Check if record has an image
    if (!record.imageUrl) {
      return NextResponse.json({ error: '该记录没有图片，无法分析' }, { status: 400 });
    }

    // Check if already analyzed (only return cache if not forcing re-analysis)
    if (record.analysis && !forceReanalysis) {
      console.log('[Exercise Analysis] Record already analyzed, returning cached result');
      return NextResponse.json({
        success: true,
        message: '该记录已分析',
        analysis: JSON.parse(record.analysis),
        record: {
          id: record.id,
          date: record.date.toISOString().split('T')[0],
          type: record.type,
          duration: record.duration,
          intensity: record.intensity,
        },
      });
    }

    // Get client info for context
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        name: true,
        gender: true,
        birthDate: true,
        healthConcerns: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    // Calculate age from birthDate
    const age = new Date().getFullYear() - new Date(client.birthDate).getFullYear();

    console.log('[Exercise Analysis] Calling AI to analyze screenshot for record:', recordId);
    console.log('[Exercise Analysis] Image URL length:', record.imageUrl?.length);

    // Call AI to analyze the screenshot
    const analysis = await analyzeExerciseScreenshot(
      record.imageUrl,
      record.notes
    );

    console.log('[Exercise Analysis] AI analysis completed:', {
      date: analysis.date,
      exerciseType: analysis.exerciseType,
      duration: analysis.duration?.minutes,
    });

    // Prepare update data
    const updateData: any = {
      analysis: JSON.stringify(analysis),
      analyzedAt: new Date(),
    };

    // Update date if AI recognized it
    if (analysis.date) {
      updateData.date = new Date(analysis.date + 'T00:00:00');
    }

    // Update the record with analysis results
    const updatedRecord = await prisma.exerciseRecord.update({
      where: { id: recordId },
      data: updateData,
    });

    // Return the analysis results
    return NextResponse.json({
      success: true,
      analysis,
      record: {
        id: updatedRecord.id,
        date: updatedRecord.date.toISOString().split('T')[0],
        type: analysis.exerciseType || updatedRecord.type,
        duration: analysis.duration?.minutes || updatedRecord.duration,
        intensity: analysis.intensity || updatedRecord.intensity,
        analyzedAt: updatedRecord.analyzedAt,
      },
    });
  } catch (error) {
    console.error('Exercise screenshot analysis error:', error);
    return NextResponse.json(
      {
        error: '分析失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
