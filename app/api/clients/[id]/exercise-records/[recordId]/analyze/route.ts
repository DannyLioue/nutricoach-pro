import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { analyzeExerciseScreenshot } from '@/lib/ai/gemini';

/**
 * POST /api/clients/[id]/exercise-records/[recordId]/analyze
 * Analyze exercise screenshot using AI
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

    // Check if already analyzed
    if (record.analysis) {
      return NextResponse.json({
        message: '该记录已分析',
        analysis: JSON.parse(record.analysis),
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

    // Call AI to analyze the screenshot
    const analysis = await analyzeExerciseScreenshot(
      record.imageUrl,
      record.notes
    );

    // Update the record with analysis results
    const updatedRecord = await prisma.exerciseRecord.update({
      where: { id: recordId },
      data: {
        analysis: JSON.stringify(analysis),
        analyzedAt: new Date(),
      },
    });

    // Return the analysis results
    return NextResponse.json({
      success: true,
      analysis,
      record: {
        id: updatedRecord.id,
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
