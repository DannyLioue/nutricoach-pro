import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// 咨询类型验证
const consultationTypeSchema = z.enum(['初诊', '复诊', '电话咨询', '在线咨询', '微信咨询', '其他']);

// 图片验证
const consultationImageSchema = z.object({
  data: z.string().min(1, '图片数据不能为空'),
  description: z.string().optional(),
});

// 文本文件验证
const textFileSchema = z.object({
  content: z.string().min(1, '文本内容不能为空'),
  fileName: z.string().min(1, '文件名不能为空'),
  fileType: z.enum(['txt', 'md', 'doc', 'docx']),
});

// 创建咨询记录验证 schema
const createConsultationSchema = z.object({
  consultationType: consultationTypeSchema,
  sessionNotes: z.string().optional(),
  images: z.array(consultationImageSchema).optional(),
  textFiles: z.array(textFileSchema).optional(),
});

// GET - 获取客户的所有咨询记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id = '';
  try {
    id = (await params).id;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户访问权限
    const accessResult = await verifyClientAccess(id, session.user.id);
    if (!accessResult.exists) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.statusCode || 404 });
    }

    // 获取所有咨询记录
    const consultations = await prisma.consultation.findMany({
      where: { clientId: id },
      orderBy: { consultationDate: 'desc' },
    });

    // 解析JSON字段
    const consultationsWithParsedData = consultations.map(consultation => ({
      ...consultation,
      images: consultation.images ? JSON.parse(consultation.images) : null,
      textFiles: consultation.textFiles ? JSON.parse(consultation.textFiles) : null,
      analysis: consultation.analysis ? JSON.parse(consultation.analysis) : null,
    }));

    return NextResponse.json({ consultations: consultationsWithParsedData });
  } catch (error) {
    logger.apiError('GET', `/api/clients/${id}/consultations`, error);
    return NextResponse.json({ error: '获取咨询记录失败' }, { status: 500 });
  }
}

// POST - 创建咨询记录
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id = '';
  try {
    id = (await params).id;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户是否属于当前用户
    const client = await prisma.client.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    const body = await request.json();
    logger.apiRequest('POST', `/api/clients/${id}/consultations`, id);
    logger.debug('[CONSULTATIONS POST] Request body:', JSON.stringify(body, null, 2));

    const validatedData = createConsultationSchema.parse(body);
    logger.debug('[CONSULTATIONS POST] Consultation type:', validatedData.consultationType);
    logger.debug('[CONSULTATIONS POST] Text files count:', validatedData.textFiles?.length || 0);

    // 处理图片数据
    let imagesData = null;
    if (validatedData.images && validatedData.images.length > 0) {
      const savedImages = validatedData.images.map(img => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        data: img.data,
        uploadedAt: new Date().toISOString(),
        description: img.description || null,
      }));
      imagesData = JSON.stringify(savedImages);
    }

    // 处理文本文件数据
    let textFilesData = null;
    if (validatedData.textFiles && validatedData.textFiles.length > 0) {
      const savedTextFiles = validatedData.textFiles.map(file => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.fileName,
        fileType: file.fileType,
        content: file.content,
        uploadedAt: new Date().toISOString(),
      }));
      textFilesData = JSON.stringify(savedTextFiles);
      logger.debug('[CONSULTATIONS POST] Text files data:', textFilesData.substring(0, 200));
    }

    // 准备创建数据
    const createData: any = {
      clientId: id,
      consultationType: validatedData.consultationType,
    };

    // 只添加有值的字段
    if (validatedData.sessionNotes && validatedData.sessionNotes.trim().length > 0) {
      createData.sessionNotes = validatedData.sessionNotes;
    }

    if (imagesData) {
      createData.images = imagesData;
    }

    if (textFilesData) {
      createData.textFiles = textFilesData;
    }

    logger.debug('[CONSULTATIONS POST] Create data:', JSON.stringify(createData, null, 2));

    // 创建咨询记录
    const consultation = await prisma.consultation.create({
      data: createData,
    });

    logger.apiSuccess('POST', `/api/clients/${id}/consultations`, `Created consultation ${consultation.id}`);

    // 异步触发 AI 分析
    if (textFilesData || validatedData.sessionNotes) {
      triggerAutoAnalysis(consultation.id, client).catch(error => {
        logger.error('[CONSULTATIONS POST] Auto-analysis error:', error);
      });
    }

    return NextResponse.json({
      success: true,
      consultation: {
        ...consultation,
        images: consultation.images ? JSON.parse(consultation.images) : null,
        textFiles: consultation.textFiles ? JSON.parse(consultation.textFiles) : null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('[CONSULTATIONS POST] Validation error', error.issues);
      const refineError = error.issues.find(issue => issue.code === z.ZodIssueCode.custom);
      if (refineError) {
        return NextResponse.json({ error: refineError.message }, { status: 400 });
      }
      return NextResponse.json({ error: '数据验证失败', details: error.issues }, { status: 400 });
    }
    logger.apiError('POST', `/api/clients/${id}/consultations`, error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: '创建咨询记录失败', details: errorMessage }, { status: 500 });
  }
}

/**
 * 计算年龄
 */
function calculateAge(birthDate: Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * 自动触发AI分析
 * 异步执行，不阻塞主流程
 */
async function triggerAutoAnalysis(consultationId: string, client: { name: string; birthDate: Date }) {
  try {
    // 导入analyzeConsultation（避免循环依赖，在函数内部导入）
    const { analyzeConsultation } = await import('@/lib/ai/gemini');

    // 获取咨询记录
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      logger.error('[AUTO ANALYSIS] Consultation not found:', consultationId);
      return;
    }

    // 如果已经有分析结果，跳过
    if (consultation.analysis) {
      logger.info('[AUTO ANALYSIS] Analysis already exists, skipping');
      return;
    }

    // 准备客户信息
    const clientInfo = {
      name: client.name,
      gender: 'FEMALE', // 默认值，实际应从数据库获取
      age: calculateAge(client.birthDate),
      healthConcerns: [],
      currentRecommendations: null,
    };

    // 准备咨询数据
    const textFiles = consultation.textFiles ? JSON.parse(consultation.textFiles) : [];
    const images = consultation.images ? JSON.parse(consultation.images) : [];

    const consultationData = {
      sessionNotes: consultation.sessionNotes || '',
      imageDescriptions: images.length > 0 ? images.map((img: any) => img.description).filter(Boolean) : undefined,
      textFiles: textFiles.length > 0 ? textFiles.map((tf: any) => ({
        fileName: tf.fileName,
        content: tf.content,
      })) : undefined,
    };

    // 调用 AI 分析
    logger.info('[AUTO ANALYSIS] Starting analysis for consultation:', consultationId);
    const analysis = await analyzeConsultation(clientInfo, consultationData);

    // 保存分析结果
    await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        analysis: JSON.stringify(analysis),
        analyzedAt: new Date(),
      },
    });

    logger.info('[AUTO ANALYSIS] Completed for consultation:', consultationId);
  } catch (error) {
    logger.error('[AUTO ANALYSIS] Error:', error);
  }
}
