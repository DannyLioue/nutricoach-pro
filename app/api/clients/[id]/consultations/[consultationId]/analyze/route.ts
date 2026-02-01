import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { analyzeConsultation } from '@/lib/ai/gemini';
import { logger } from '@/lib/logger';

// 计算年龄的辅助函数
function calculateAge(birthDate: Date | string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// 解析健康问题
function parseHealthConcerns(healthConcernsStr: string): string[] {
  try {
    const parsed = JSON.parse(healthConcernsStr || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// POST - 分析咨询记录
export async function POST(
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

    // 验证咨询记录是否属于该客户
    const consultation = await prisma.consultation.findFirst({
      where: {
        id: consultationId,
        clientId: clientId,
      },
    });

    if (!consultation) {
      return NextResponse.json({ error: '咨询记录不存在' }, { status: 404 });
    }

    logger.apiRequest('POST', `/api/clients/${clientId}/consultations/${consultationId}/analyze`, consultationId);

    // 获取客户的最新综合营养干预方案
    const latestRecommendation = await prisma.recommendation.findFirst({
      where: {
        clientId: clientId,
        type: 'COMPREHENSIVE',
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });

    // 准备客户信息
    const client = accessResult.client!;
    const clientInfo = {
      name: client.name || '',
      gender: client.gender || 'FEMALE',
      age: calculateAge(client.birthDate),
      healthConcerns: parseHealthConcerns(client.healthConcerns || '[]'),
      currentRecommendations: latestRecommendation?.content || null,
    };

    // 准备咨询数据
    const images = consultation.images ? JSON.parse(consultation.images) : [];
    const textFiles = consultation.textFiles ? JSON.parse(consultation.textFiles) : [];

    // 准备图片描述
    const imageDescriptions = images
      .filter((img: any) => img.description)
      .map((img: any) => img.description);

    // 准备文本文件内容
    const textFilesContent = textFiles.map((tf: any) => ({
      fileName: tf.fileName,
      content: tf.content,
    }));

    const consultationData = {
      sessionNotes: consultation.sessionNotes || '',
      imageDescriptions: imageDescriptions.length > 0 ? imageDescriptions : undefined,
      textFiles: textFilesContent.length > 0 ? textFilesContent : undefined,
    };

    console.log('=== 咨询记录分析 - 客户信息 ===');
    console.log('客户ID:', clientId);
    console.log('咨询ID:', consultationId);
    console.log('健康问题:', clientInfo.healthConcerns);
    console.log('有笔记:', !!consultationData.sessionNotes);
    console.log('有图片描述:', imageDescriptions.length);
    console.log('有文本文件:', textFilesContent.length);
    console.log('文本文件名称:', textFilesContent.map((tf: any) => tf.fileName));
    console.log('文本内容长度:', textFilesContent.reduce((sum: number, tf: any) => sum + (tf.content?.length || 0), 0), '字符');
    console.log('==========================');

    // 调用 AI 分析
    const analysis = await analyzeConsultation(clientInfo, consultationData);

    // 保存分析结果
    const updatedConsultation = await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        analysis: JSON.stringify(analysis),
        analyzedAt: new Date(),
      },
    });

    logger.apiSuccess('POST', `/api/clients/${clientId}/consultations/${consultationId}/analyze`, '咨询分析完成');

    return NextResponse.json({
      success: true,
      analysis,
      analyzedAt: updatedConsultation.analyzedAt,
    });
  } catch (error) {
    logger.apiError('POST', `/api/clients/${clientId}/consultations/${consultationId}/analyze`, error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      { error: 'AI分析失败', details: errorMessage },
      { status: 500 }
    );
  }
}
