import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// 验证 schema
const updateExerciseRecordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD').optional(),
  type: z.string().min(1, '运动类型不能为空').optional(),
  duration: z.number().min(1, '时长至少1分钟').max(600, '时长不能超过600分钟').optional(),
  intensity: z.enum(['低', '中', '高']).optional(),
  notes: z.string().optional(),
  imageUrl: z.string().optional(), // Base64 encoded image
});

// GET - 获取单个运动记录详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  let id = '';
  let recordId = '';
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    recordId = resolvedParams.recordId;
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

    // 获取运动记录详情
    const exerciseRecord = await prisma.exerciseRecord.findFirst({
      where: {
        id: recordId,
        clientId: id,
      },
    });

    if (!exerciseRecord) {
      return NextResponse.json({ error: '运动记录不存在' }, { status: 404 });
    }

    // 转换 Date 为字符串
    const recordWithParsedData = {
      ...exerciseRecord,
      date: exerciseRecord.date.toISOString(),
      createdAt: exerciseRecord.createdAt.toISOString(),
      updatedAt: exerciseRecord.updatedAt.toISOString(),
    };

    return NextResponse.json({ exerciseRecord: recordWithParsedData });
  } catch (error) {
    logger.error('Failed to fetch exercise record', error);
    return NextResponse.json({ error: '获取运动记录详情失败' }, { status: 500 });
  }
}

// PUT - 更新运动记录
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  let id = '';
  let recordId = '';
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    recordId = resolvedParams.recordId;
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

    // 验证运动记录是否存在
    const exerciseRecord = await prisma.exerciseRecord.findFirst({
      where: {
        id: recordId,
        clientId: id,
      },
    });

    if (!exerciseRecord) {
      return NextResponse.json({ error: '运动记录不存在' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateExerciseRecordSchema.parse(body);

    // 更新运动记录
    const updatedRecord = await prisma.exerciseRecord.update({
      where: { id: recordId },
      data: {
        ...(validatedData.date !== undefined && { date: new Date(validatedData.date + 'T00:00:00') }),
        ...(validatedData.type !== undefined && { type: validatedData.type }),
        ...(validatedData.duration !== undefined && { duration: validatedData.duration }),
        ...(validatedData.intensity !== undefined && { intensity: validatedData.intensity }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
        ...(validatedData.imageUrl !== undefined && { imageUrl: validatedData.imageUrl }),
      },
    });

    logger.apiSuccess('PUT', `/api/clients/${id}/exercise-records/${recordId}`, '运动记录更新成功');

    // 转换 Date 为字符串
    const recordWithParsedData = {
      ...updatedRecord,
      date: updatedRecord.date.toISOString(),
      createdAt: updatedRecord.createdAt.toISOString(),
      updatedAt: updatedRecord.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      exerciseRecord: recordWithParsedData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '数据验证失败', details: error.issues }, { status: 400 });
    }
    logger.error('Failed to update exercise record', error);
    return NextResponse.json({ error: '更新运动记录失败' }, { status: 500 });
  }
}

// DELETE - 删除运动记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  let id = '';
  let recordId = '';
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    recordId = resolvedParams.recordId;
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

    // 验证运动记录是否存在
    const exerciseRecord = await prisma.exerciseRecord.findFirst({
      where: {
        id: recordId,
        clientId: id,
      },
    });

    if (!exerciseRecord) {
      return NextResponse.json({ error: '运动记录不存在' }, { status: 404 });
    }

    // 删除运动记录
    await prisma.exerciseRecord.delete({
      where: { id: recordId },
    });

    logger.apiSuccess('DELETE', `/api/clients/${id}/exercise-records/${recordId}`, '运动记录删除成功');

    return NextResponse.json({
      success: true,
      message: '运动记录删除成功',
    });
  } catch (error) {
    logger.apiError('DELETE', `/api/clients/${id}/exercise-records/${recordId}`, error);
    return NextResponse.json({ error: '删除运动记录失败' }, { status: 500 });
  }
}
