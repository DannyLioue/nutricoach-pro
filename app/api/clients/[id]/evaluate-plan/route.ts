import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { parseNutritionistPlan, evaluateNutritionistPlan } from '@/lib/ai/gemini';
import mammoth from 'mammoth';

// 辅助函数：计算年龄
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * POST /api/clients/[id]/evaluate-plan
 * 上传并评估营养师计划
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 验证用户权限
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 2. 获取客户端 ID
    const { id: clientId } = await params;

    // 3. 解析表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const reportId = formData.get('reportId') as string | null;
    const planType = formData.get('planType') as string || 'diet';

    // 验证 planType
    if (!['diet', 'exercise'].includes(planType)) {
      return NextResponse.json(
        { error: '计划类型必须是 diet 或 exercise' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: '请上传文件' },
        { status: 400 }
      );
    }

    // 4. 验证文件类型
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (
      !allowedTypes.includes(file.type) &&
      !['txt', 'md', 'docx'].includes(fileExt || '')
    ) {
      return NextResponse.json(
        { error: '不支持的文件格式，请上传 .txt、.md 或 .docx 文件' },
        { status: 400 }
      );
    }

    // 5. 验证文件大小（最大 5MB）
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '文件大小超过 5MB 限制' },
        { status: 400 }
      );
    }

    // 6. 读取文件内容
    console.log('[Evaluate Plan] Reading file content...');
    let fileContent: string;

    if (fileExt === 'docx') {
      // 使用 mammoth 解析 .docx
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
      fileContent = result.value;
    } else {
      // .txt 和 .md 直接读取
      fileContent = await file.text();
    }

    console.log('[Evaluate Plan] File content length:', fileContent.length);

    // 7. 获取客户信息
    console.log('[Evaluate Plan] Fetching client data...');
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        reports: {
          orderBy: { uploadedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: '客户不存在' },
        { status: 404 }
      );
    }

    // 8. 解析计划文本
    console.log('[Evaluate Plan] Starting plan parsing...');
    const extractedPlan = await parseNutritionistPlan(fileContent);
    console.log('[Evaluate Plan] Plan parsed:', {
      hasDiet: !!extractedPlan.diet,
      hasExercise: !!extractedPlan.exercise,
    });

    // 9. 获取健康分析
    let healthAnalysis: any = null;
    if (reportId) {
      const report = await prisma.report.findUnique({
        where: { id: reportId },
      });
      if (report?.analysis) {
        healthAnalysis = report.analysis;
      }
    } else if (client.reports[0]?.analysis) {
      healthAnalysis = client.reports[0].analysis;
    }

    // 10. 评估计划
    console.log('[Evaluate Plan] Starting plan evaluation...');
    const clientInfo = {
      name: client.name,
      gender: client.gender,
      age: calculateAge(client.birthDate),
      height: client.height,
      weight: client.weight,
      activityLevel: client.activityLevel,
      allergies: JSON.parse(client.allergies || '[]'),
      medicalHistory: JSON.parse(client.medicalHistory || '[]'),
      healthConcerns: JSON.parse(client.healthConcerns || '[]'),
      preferences: client.preferences || undefined,
    };

    const evaluationResult = await evaluateNutritionistPlan(
      clientInfo,
      healthAnalysis,
      extractedPlan
    );

    // 11. 保存到数据库
    console.log('[Evaluate Plan] Saving evaluation to database...');
    const evaluation = await prisma.planEvaluation.create({
      data: {
        clientId: clientId,
        planType: planType,
        fileName: file.name,
        fileType: fileExt || 'unknown',
        originalContent: fileContent,
        extractedData: extractedPlan as any,
        evaluation: evaluationResult.evaluation as any,
        concerns: evaluationResult.concerns as any,
        suggestions: evaluationResult.suggestions as any,
        optimizedPlan: evaluationResult.optimizedPlan ? (evaluationResult.optimizedPlan as any) : null,
      },
    });

    console.log('[Evaluate Plan] Evaluation saved:', evaluation.id);

    // 12. 返回结果
    return NextResponse.json({
      success: true,
      evaluation: {
        planType: planType,
        id: evaluation.id,
        overallStatus: evaluationResult.evaluation.overallStatus,
        safetyScore: evaluationResult.evaluation.safetyScore,
        summary: evaluationResult.evaluation.summary,
        keyFindings: evaluationResult.evaluation.keyFindings,
        concerns: evaluationResult.concerns,
        suggestions: evaluationResult.suggestions,
        optimizedPlan: evaluationResult.optimizedPlan,
        extractedData: extractedPlan,
      },
    });

  } catch (error) {
    console.error('[Evaluate Plan] Error:', error);
    return NextResponse.json(
      {
        error: '评估失败，请稍后重试',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
