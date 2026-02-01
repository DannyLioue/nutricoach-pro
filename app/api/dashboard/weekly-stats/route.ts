import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

/**
 * 获取本周（周一到今天）的统计数据
 * 返回格式化的日期和计数数据，用于图表展示
 */
function getThisWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ...

  // 计算本周一（如果是周日，则认为是上周）
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  // 今天结束
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return { start: monday, end: today };
}

/**
 * 生成本周的日期数组（周一到今天）
 */
function generateWeekDays(): string[] {
  const { start } = getThisWeekRange();
  const today = new Date();
  const days: string[] = [];

  const current = new Date(start);
  while (current <= today) {
    days.push(current.toISOString().split('T')[0]); // YYYY-MM-DD
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * 格式化日期为 MM-DD
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * GET /api/dashboard/weekly-stats
 * 获取本周统计数据
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const userId = session.user.id;
    const { start, end } = getThisWeekRange();
    const weekDays = generateWeekDays();

    // 1. 获取本周每天新增的客户数
    const clientsByDay = await prisma.client.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _count: {
        id: true,
      },
    });

    // 2. 获取本周每天分析的饮食照片数
    const photosByDay = await prisma.dietPhoto.groupBy({
      by: ['analyzedAt'],
      where: {
        analyzedAt: {
          gte: start,
          lte: end,
        },
        client: {
          userId,
        },
      },
      _count: {
        id: true,
      },
    });

    // 3. 获取本周每天生成的建议数
    const recommendationsByDay = await prisma.recommendation.groupBy({
      by: ['generatedAt'],
      where: {
        generatedAt: {
          gte: start,
          lte: end,
        },
        client: {
          userId,
        },
      },
      _count: {
        id: true,
      },
    });

    // 创建映射便于查找
    const clientsMap = new Map(
      clientsByDay.map((item) => [
        new Date(item.createdAt as Date).toISOString().split('T')[0],
        item._count.id,
      ])
    );

    const photosMap = new Map(
      photosByDay
        .filter((item) => item.analyzedAt !== null)
        .map((item) => [
          new Date(item.analyzedAt as Date).toISOString().split('T')[0],
          item._count.id,
        ])
    );

    const recommendationsMap = new Map(
      recommendationsByDay.map((item) => [
        new Date(item.generatedAt as Date).toISOString().split('T')[0],
        item._count.id,
      ])
    );

    // 组装数据
    const clients = weekDays.map((day) => ({
      date: formatDate(day),
      fullDate: day,
      count: clientsMap.get(day) || 0,
    }));

    const photos = weekDays.map((day) => ({
      date: formatDate(day),
      fullDate: day,
      count: photosMap.get(day) || 0,
    }));

    const recommendations = weekDays.map((day) => ({
      date: formatDate(day),
      fullDate: day,
      count: recommendationsMap.get(day) || 0,
    }));

    logger.apiSuccess('GET', '/api/dashboard/weekly-stats', '获取本周统计成功');

    return NextResponse.json({
      clients,
      photos,
      recommendations,
    });
  } catch (error) {
    logger.apiError('GET', '/api/dashboard/weekly-stats', error);
    return NextResponse.json({ error: '获取本周统计失败' }, { status: 500 });
  }
}
