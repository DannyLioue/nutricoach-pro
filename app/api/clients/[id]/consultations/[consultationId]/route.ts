import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// 更新咨询记录验证 schema（简化版）
const updateConsultationSchema = z.object({
  consultationType: z.enum(['初诊', '复诊', '电话咨询', '在线咨询', '微信咨询', '其他']).optional(),
  sessionNotes: z.string().optional().nullable(),
});

/**
 * 删除磁盘上的文件
 * @param filePath - 相对于 public 目录的文件路径
 */
async function deleteFileIfExists(filePath: string) {
  try {
    // 构建完整的文件系统路径
    const fullPath = join(process.cwd(), 'public', filePath);

    if (existsSync(fullPath)) {
      await unlink(fullPath);
      logger.info(`[DELETE] Deleted file: ${filePath}`);
    }
  } catch (error) {
    // 记录错误但不中断删除流程
    logger.error(`[DELETE] Failed to delete file: ${filePath}`, error);
  }
}

/**
 * 清理咨询记录关联的所有文件
 */
async function cleanupConsultationFiles(consultation: any) {
  const cleanupPromises: Promise<void>[] = [];

  // 清理图片文件
  if (consultation.images) {
    try {
      const images = JSON.parse(consultation.images);
      if (Array.isArray(images)) {
        for (const image of images) {
          if (image.imageUrl) {
            // imageUrl 格式: "/uploads/clients/..."
            // 移除开头的斜杠以正确拼接路径
            const filePath = image.imageUrl.startsWith('/') ? image.imageUrl.slice(1) : image.imageUrl;
            cleanupPromises.push(deleteFileIfExists(filePath));
          }
        }
      }
    } catch (error) {
      logger.error('[DELETE] Failed to parse images JSON', error);
    }
  }

  // 文本文件内容存储在数据库中，无需单独清理

  await Promise.all(cleanupPromises);
}

// GET - 获取单个咨询记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; consultationId: string }> }
) {
  let clientId = '';
  let consultationId = '';
  try {
    clientId = (await params).id;
    consultationId = (await params).consultationId;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户访问权限
    const accessResult = await verifyClientAccess(clientId, session.user.id);
    if (!accessResult.exists) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.statusCode || 404 });
    }

    // 获取咨询记录
    const consultation = await prisma.consultation.findFirst({
      where: {
        id: consultationId,
        clientId: clientId,
      },
    });

    if (!consultation) {
      return NextResponse.json({ error: '咨询记录不存在' }, { status: 404 });
    }

    // 解析JSON字段
    const consultationWithParsedData = {
      ...consultation,
      images: consultation.images ? JSON.parse(consultation.images) : null,
      textFiles: consultation.textFiles ? JSON.parse(consultation.textFiles) : null,
      analysis: consultation.analysis ? JSON.parse(consultation.analysis) : null,
    };

    return NextResponse.json({ consultation: consultationWithParsedData });
  } catch (error) {
    logger.apiError('GET', `/api/clients/${clientId}/consultations/${consultationId}`, error);
    return NextResponse.json({ error: '获取咨询记录失败' }, { status: 500 });
  }
}

// PUT - 更新咨询记录
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; consultationId: string }> }
) {
  let clientId = '';
  let consultationId = '';
  try {
    clientId = (await params).id;
    consultationId = (await params).consultationId;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户是否属于当前用户
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: session.user.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    // 验证咨询记录是否存在且属于该客户
    const existingConsultation = await prisma.consultation.findFirst({
      where: {
        id: consultationId,
        clientId: clientId,
      },
    });

    if (!existingConsultation) {
      return NextResponse.json({ error: '咨询记录不存在' }, { status: 404 });
    }

    const body = await request.json();
    logger.apiRequest('PUT', `/api/clients/${clientId}/consultations/${consultationId}`, clientId);

    const validatedData = updateConsultationSchema.parse(body);

    // 准备更新数据
    const updateData: Record<string, any> = {};
    if (validatedData.consultationType !== undefined) {
      updateData.consultationType = validatedData.consultationType;
    }
    if (validatedData.sessionNotes !== undefined) {
      updateData.sessionNotes = validatedData.sessionNotes;
    }

    // 更新咨询记录
    const consultation = await prisma.consultation.update({
      where: { id: consultationId },
      data: updateData,
    });

    logger.apiSuccess('PUT', `/api/clients/${clientId}/consultations/${consultationId}`, `Updated consultation ${consultationId}`);

    return NextResponse.json({
      success: true,
      consultation: {
        ...consultation,
        images: consultation.images ? JSON.parse(consultation.images) : null,
        textFiles: consultation.textFiles ? JSON.parse(consultation.textFiles) : null,
        analysis: consultation.analysis ? JSON.parse(consultation.analysis) : null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('[CONSULTATION PUT] Validation error', error.issues);
      return NextResponse.json({ error: '数据验证失败', details: error.issues }, { status: 400 });
    }
    logger.apiError('PUT', `/api/clients/${clientId}/consultations/${consultationId}`, error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: '更新咨询记录失败', details: errorMessage }, { status: 500 });
  }
}

// DELETE - 删除咨询记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; consultationId: string }> }
) {
  let clientId = '';
  let consultationId = '';
  try {
    clientId = (await params).id;
    consultationId = (await params).consultationId;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户是否属于当前用户
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: session.user.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    // 验证咨询记录是否存在且属于该客户
    const existingConsultation = await prisma.consultation.findFirst({
      where: {
        id: consultationId,
        clientId: clientId,
      },
    });

    if (!existingConsultation) {
      return NextResponse.json({ error: '咨询记录不存在' }, { status: 404 });
    }

    // 先清理关联的文件
    await cleanupConsultationFiles(existingConsultation);

    // 删除咨询记录
    await prisma.consultation.delete({
      where: { id: consultationId },
    });

    logger.apiSuccess('DELETE', `/api/clients/${clientId}/consultations/${consultationId}`, `Deleted consultation ${consultationId} and cleaned up files`);

    return NextResponse.json({
      success: true,
      message: '咨询记录已删除',
    });
  } catch (error) {
    logger.apiError('DELETE', `/api/clients/${clientId}/consultations/${consultationId}`, error);
    return NextResponse.json({ error: '删除咨询记录失败' }, { status: 500 });
  }
}
