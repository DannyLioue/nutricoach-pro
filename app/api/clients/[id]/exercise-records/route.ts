import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// 验证 schema
const createExerciseRecordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
  type: z.enum(['有氧', '力量', '柔韧', '其他']),
  duration: z.number().min(1, '时长至少1分钟').max(600, '时长不能超过600分钟'),
  intensity: z.enum(['低', '中', '高']).optional(),
  notes: z.string().optional(),
  imageUrl: z.string().optional(), // Base64 encoded image
});

// GET - 获取客户的所有运动记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id = '';
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

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

    // 获取所有运动记录
    const exerciseRecords = await prisma.exerciseRecord.findMany({
      where: { clientId: id },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    // 转换 Date 为字符串
    const recordsWithParsedData = exerciseRecords.map(record => ({
      ...record,
      date: record.date.toISOString(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    }));

    return NextResponse.json({ exerciseRecords: recordsWithParsedData });
  } catch (error) {
    logger.error('Failed to fetch exercise records', error);
    return NextResponse.json({ error: '获取运动记录失败' }, { status: 500 });
  }
}

// POST - 创建新的运动记录
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id = '';
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

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

    const body = await request.json();
    const validatedData = createExerciseRecordSchema.parse(body);

    // 创建运动记录
    const exerciseRecord = await prisma.exerciseRecord.create({
      data: {
        clientId: id,
        date: new Date(validatedData.date + 'T00:00:00'),
        type: validatedData.type,
        duration: validatedData.duration,
        intensity: validatedData.intensity,
        notes: validatedData.notes,
        imageUrl: validatedData.imageUrl,
      },
    });

    logger.debug('Exercise record created', {
      recordId: exerciseRecord.id,
      type: exerciseRecord.type,
      duration: exerciseRecord.duration,
    });

    // 转换 Date 为字符串
    const recordWithParsedData = {
      ...exerciseRecord,
      date: exerciseRecord.date.toISOString(),
      createdAt: exerciseRecord.createdAt.toISOString(),
      updatedAt: exerciseRecord.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      exerciseRecord: recordWithParsedData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '数据验证失败', details: error.issues }, { status: 400 });
    }
    logger.error('Failed to create exercise record', error);
    return NextResponse.json({ error: '创建运动记录失败' }, { status: 500 });
  }
}
