import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// 验证 schema
const createClientSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  birthDate: z.string().min(1, '出生日期不能为空'),
  height: z.string().min(1, '身高不能为空'),
  weight: z.string().min(1, '体重不能为空'),
  activityLevel: z.enum(['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE']),
  allergies: z.string().default('[]'),
  medicalHistory: z.string().default('[]'),
  healthConcerns: z.string().default('[]'),
  preferences: z.string().optional(),
  userRequirements: z.string().optional(),
  exerciseDetails: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

// GET - 获取当前用户的所有客户
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ clients });
  } catch (error) {
    logger.error('获取客户列表错误', error);
    return NextResponse.json({ error: '获取客户列表失败' }, { status: 500 });
  }
}

// POST - 创建新客户
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createClientSchema.parse(body);

    // 创建客户
    const client = await prisma.client.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        gender: validatedData.gender,
        birthDate: new Date(validatedData.birthDate),
        height: parseFloat(validatedData.height),
        weight: parseFloat(validatedData.weight),
        activityLevel: validatedData.activityLevel,
        allergies: validatedData.allergies,
        medicalHistory: validatedData.medicalHistory,
        healthConcerns: validatedData.healthConcerns,
        preferences: validatedData.preferences || null,
        userRequirements: validatedData.userRequirements || null,
        exerciseDetails: validatedData.exerciseDetails || null,
        phone: validatedData.phone || null,
        email: validatedData.email || null,
      },
    });

    return NextResponse.json({ message: '客户创建成功', client }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('创建客户验证失败', error.issues);
      return NextResponse.json({ error: '数据验证失败', details: error.issues }, { status: 400 });
    }
    logger.error('创建客户错误', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: '创建客户失败', details: errorMessage }, { status: 500 });
  }
}
