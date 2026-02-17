import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/clients/[id]/exercise-records/summary
 * Get 7-day exercise summary
 */
export async function GET(
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

    // Calculate date range (past 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6); // Past 7 days including today

    // Get exercise records for the past 7 days
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

    // Calculate summary statistics
    const totalRecords = records.length;
    const totalDuration = records.reduce((sum, r) => sum + r.duration, 0);

    // Group by type
    const byType: { [key: string]: number } = {};
    records.forEach(r => {
      byType[r.type] = (byType[r.type] || 0) + r.duration;
    });

    // Group by intensity
    const byIntensity: { [key: string]: number } = {};
    records.forEach(r => {
      if (r.intensity) {
        byIntensity[r.intensity] = (byIntensity[r.intensity] || 0) + 1;
      }
    });

    // Group by date
    const byDate: { [key: string]: { count: number; duration: number } } = {};
    const dateRange: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dateRange.push(dateStr);
      byDate[dateStr] = { count: 0, duration: 0 };
    }

    records.forEach(r => {
      const dateStr = r.date.toISOString().split('T')[0];
      if (byDate[dateStr]) {
        byDate[dateStr].count += 1;
        byDate[dateStr].duration += r.duration;
      }
    });

    // Calculate averages
    const avgDurationPerSession = totalRecords > 0 ? Math.round(totalDuration / totalRecords) : 0;
    const avgDurationPerDay = Math.round(totalDuration / 7);

    // Check if there's an exercise prescription in recommendations
    const latestRecommendation = await prisma.recommendation.findFirst({
      where: {
        clientId: clientId,
        type: 'COMPREHENSIVE',
      },
      orderBy: { generatedAt: 'desc' },
      take: 1,
      select: {
        id: true,
        content: true,
      },
    });

    let prescription = null;
    if (latestRecommendation?.content) {
      try {
        const content = typeof latestRecommendation.content === 'string'
          ? JSON.parse(latestRecommendation.content)
          : latestRecommendation.content;

        // Extract exercise prescription if available
        if (content.exercisePrescription) {
          prescription = content.exercisePrescription;
        } else if (content.exercise) {
          prescription = content.exercise;
        }
      } catch (error) {
        console.error('Failed to parse recommendation content:', error);
      }
    }

    const summary = {
      client: {
        id: client.id,
        name: client.name,
        gender: client.gender,
        age: new Date().getFullYear() - new Date(client.birthDate).getFullYear(),
        healthConcerns: client.healthConcerns || [],
      },
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        days: 7,
      },
      statistics: {
        totalRecords,
        totalDuration,
        avgDurationPerSession,
        avgDurationPerDay,
        activeDays: Object.values(byDate).filter(d => d.count > 0).length,
        byType,
        byIntensity,
      },
      dailyBreakdown: dateRange.map(date => ({
        date,
        ...byDate[date],
      })),
      hasPrescription: !!prescription,
      prescription: prescription ? {
        weeklyGoals: prescription.weeklyGoals || prescription.goals,
        activities: prescription.activities || prescription.workouts || [],
      } : null,
      records: records.map(r => ({
        id: r.id,
        date: r.date.toISOString(),
        type: r.type,
        duration: r.duration,
        intensity: r.intensity,
        notes: r.notes,
        imageUrl: r.imageUrl,
        analyzedAt: r.analyzedAt?.toISOString(),
      })),
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Failed to fetch exercise summary:', error);
    return NextResponse.json({ error: '获取运动汇总失败' }, { status: 500 });
  }
}
