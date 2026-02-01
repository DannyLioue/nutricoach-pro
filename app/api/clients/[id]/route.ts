import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { unlink, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// 验证 schema
const updateClientSchema = z.object({
  name: z.string().min(1, '姓名不能为空').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  birthDate: z.string().min(1, '出生日期不能为空').optional(),
  height: z.string().min(1, '身高不能为空').optional(),
  weight: z.string().min(1, '体重不能为空').optional(),
  activityLevel: z.enum(['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE']).optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  healthConcerns: z.string().optional(),
  preferences: z.string().optional().nullable(),
  userRequirements: z.string().optional().nullable(),
  exerciseDetails: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
});

/**
 * 删除磁盘上的文件
 */
async function deleteFileIfExists(filePath: string) {
  try {
    const fullPath = join(process.cwd(), 'public', filePath);
    if (existsSync(fullPath)) {
      await unlink(fullPath);
      logger.info(`[DELETE] Deleted file: ${filePath}`);
    }
  } catch (error) {
    logger.error(`[DELETE] Failed to delete file: ${filePath}`, error);
  }
}

/**
 * 清理客户的所有关联文件
 * - 咨询记录图片
 * - 饮食照片
 */
async function cleanupClientFiles(clientId: string) {
  const cleanupPromises: Promise<void>[] = [];

  // 1. 清理咨询记录的图片
  const consultations = await prisma.consultation.findMany({
    where: { clientId },
    select: { images: true },
  });

  for (const consultation of consultations) {
    if (consultation.images) {
      try {
        const images = JSON.parse(consultation.images);
        if (Array.isArray(images)) {
          for (const image of images) {
            if (image.imageUrl) {
              const filePath = image.imageUrl.startsWith('/') ? image.imageUrl.slice(1) : image.imageUrl;
              cleanupPromises.push(deleteFileIfExists(filePath));
            }
          }
        }
      } catch (error) {
        logger.error('[DELETE] Failed to parse consultation images', error);
      }
    }
  }

  // 2. 清理饮食照片
  const dietPhotos = await prisma.dietPhoto.findMany({
    where: { clientId },
    select: { imageUrl: true },
  });

  for (const photo of dietPhotos) {
    if (photo.imageUrl) {
      const filePath = photo.imageUrl.startsWith('/') ? photo.imageUrl.slice(1) : photo.imageUrl;
      cleanupPromises.push(deleteFileIfExists(filePath));
    }
  }

  // 3. 尝试删除整个客户上传目录（如果存在）
  const clientUploadDir = join(process.cwd(), 'public', 'uploads', 'clients', clientId);
  if (existsSync(clientUploadDir)) {
    cleanupPromises.push(
      rm(clientUploadDir, { recursive: true, force: true }).catch((err) => {
        logger.warn(`[DELETE] Failed to remove directory ${clientUploadDir}:`, err);
      })
    );
  }

  await Promise.all(cleanupPromises);
  logger.info(`[DELETE] Cleaned up all files for client ${clientId}`);
}

// GET - 获取单个客户详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户访问权限
    const accessResult = await verifyClientAccess(id, session.user.id);
    if (!accessResult.exists) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.statusCode || 404 });
    }

    return NextResponse.json({ client: accessResult.client });
  } catch (error) {
    logger.error('获取客户详情错误', error);
    return NextResponse.json({ error: '获取客户详情失败' }, { status: 500 });
  }
}

// PUT - 更新客户信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户是否属于当前用户
    const existingClient = await prisma.client.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    const body = await request.json();
    logger.apiRequest('PUT', `/api/clients/${id}`, id);

    const validatedData = updateClientSchema.parse(body);

    // 准备更新数据 - 使用类型安全的 Partial
    const updateData: Partial<{
      name: string;
      gender: 'MALE' | 'FEMALE' | 'OTHER';
      birthDate: Date;
      height: number;
      weight: number;
      activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
      allergies: string;
      medicalHistory: string;
      healthConcerns: string;
      preferences: string | null;
      userRequirements: string | null;
      exerciseDetails: string | null;
      phone: string | null;
      email: string | null;
    }> = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.gender !== undefined) updateData.gender = validatedData.gender;
    if (validatedData.birthDate !== undefined) updateData.birthDate = new Date(validatedData.birthDate);
    if (validatedData.height !== undefined) updateData.height = parseFloat(validatedData.height);
    if (validatedData.weight !== undefined) updateData.weight = parseFloat(validatedData.weight);
    if (validatedData.activityLevel !== undefined) updateData.activityLevel = validatedData.activityLevel;
    if (validatedData.allergies !== undefined) updateData.allergies = validatedData.allergies;
    if (validatedData.medicalHistory !== undefined) updateData.medicalHistory = validatedData.medicalHistory;
    if (validatedData.healthConcerns !== undefined) updateData.healthConcerns = validatedData.healthConcerns;
    if (validatedData.preferences !== undefined) updateData.preferences = validatedData.preferences;
    if (validatedData.userRequirements !== undefined) updateData.userRequirements = validatedData.userRequirements;
    if (validatedData.exerciseDetails !== undefined) updateData.exerciseDetails = validatedData.exerciseDetails;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
    if (validatedData.email !== undefined) updateData.email = validatedData.email;

    // 更新客户
    const client = await prisma.client.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json({ message: '客户更新成功', client });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('[UPDATE CLIENT] Validation error', error.issues);
      return NextResponse.json({ error: '数据验证失败', details: error.issues }, { status: 400 });
    }
    logger.error('[UPDATE CLIENT] Update error', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: '更新客户失败', details: errorMessage }, { status: 500 });
  }
}

// DELETE - 删除客户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户访问权限
    const accessResult = await verifyClientAccess(id, session.user.id);
    if (!accessResult.exists) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.statusCode || 404 });
    }

    // 先清理所有关联的文件
    await cleanupClientFiles(id);

    // 删除客户（会级联删除相关的报告和建议）
    await prisma.client.delete({
      where: { id: id },
    });

    logger.apiSuccess('DELETE', `/api/clients/${id}`, '客户删除成功（包含文件清理）');
    return NextResponse.json({ message: '客户删除成功' });
  } catch (error) {
    logger.error('删除客户错误', error);
    return NextResponse.json({ error: '删除客户失败' }, { status: 500 });
  }
}
