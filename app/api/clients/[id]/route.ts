import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

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
  preferences: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
});

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

    const client = await prisma.client.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('获取客户详情错误:', error);
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
    const validatedData = updateClientSchema.parse(body);

    // 准备更新数据
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.gender !== undefined) updateData.gender = validatedData.gender;
    if (validatedData.birthDate !== undefined) updateData.birthDate = new Date(validatedData.birthDate);
    if (validatedData.height !== undefined) updateData.height = parseFloat(validatedData.height);
    if (validatedData.weight !== undefined) updateData.weight = parseFloat(validatedData.weight);
    if (validatedData.activityLevel !== undefined) updateData.activityLevel = validatedData.activityLevel;
    if (validatedData.allergies !== undefined) updateData.allergies = validatedData.allergies;
    if (validatedData.medicalHistory !== undefined) updateData.medicalHistory = validatedData.medicalHistory;
    if (validatedData.preferences !== undefined) updateData.preferences = validatedData.preferences;
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
      return NextResponse.json({ error: '数据验证失败', details: error.errors }, { status: 400 });
    }
    console.error('更新客户错误:', error);
    return NextResponse.json({ error: '更新客户失败' }, { status: 500 });
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

    // 删除客户（会级联删除相关的报告和建议）
    await prisma.client.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: '客户删除成功' });
  } catch (error) {
    console.error('删除客户错误:', error);
    return NextResponse.json({ error: '删除客户失败' }, { status: 500 });
  }
}
