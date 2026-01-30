import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { logger } from '@/lib/logger';
import { transcribeAudioWithGemini } from '@/lib/audio/transcribeWithGemini';

// POST - 重新转录单个音频文件
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; consultationId: string; audioId: string }> }
) {
  let clientId = '';
  let consultationId = '';
  let audioId = '';
  try {
    clientId = (await params).id;
    consultationId = (await params).consultationId;
    audioId = (await params).audioId;

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

    if (!consultation.audioFiles) {
      return NextResponse.json({ error: '没有音频文件' }, { status: 400 });
    }

    logger.apiRequest('POST', `/api/clients/${clientId}/consultations/${consultationId}/audio/${audioId}/retranscribe`, audioId);

    // 解析音频文件
    const audioFiles = JSON.parse(consultation.audioFiles);
    const audioIndex = audioFiles.findIndex((a: any) => a.id === audioId);

    if (audioIndex === -1) {
      return NextResponse.json({ error: '音频文件不存在' }, { status: 404 });
    }

    // 更新状态为 transcribing
    audioFiles[audioIndex].transcriptionStatus = 'transcribing';
    await prisma.consultation.update({
      where: { id: consultationId },
      data: { audioFiles: JSON.stringify(audioFiles) },
    });

    // 获取客户信息
    const client = accessResult.client!;

    // 使用 Gemini 重新转录
    const result = await transcribeAudioWithGemini(audioFiles[audioIndex].audioUrl, {
      name: client.name,
      age: calculateAge(client.birthDate),
    });

    if (!result.success) {
      // 转录失败
      audioFiles[audioIndex].transcriptionStatus = 'failed';
      await prisma.consultation.update({
        where: { id: consultationId },
        data: { audioFiles: JSON.stringify(audioFiles) },
      });

      logger.apiError('POST', `/api/clients/${clientId}/consultations/${consultationId}/audio/${audioId}/retranscribe`, result.error);
      return NextResponse.json({ error: '转录失败', details: result.error }, { status: 500 });
    }

    // 保存转录结果
    audioFiles[audioIndex].transcript = result.text;
    if (result.structuredTranscript) {
      audioFiles[audioIndex].structuredTranscript = result.structuredTranscript;
    }
    audioFiles[audioIndex].transcriptionStatus = 'completed';

    await prisma.consultation.update({
      where: { id: consultationId },
      data: { audioFiles: JSON.stringify(audioFiles) },
    });

    logger.apiSuccess('POST', `/api/clients/${clientId}/consultations/${consultationId}/audio/${audioId}/retranscribe`, '重新转录成功');

    return NextResponse.json({
      success: true,
      transcript: result.text,
      structuredTranscript: result.structuredTranscript,
    });
  } catch (error) {
    logger.apiError('POST', `/api/clients/${clientId}/consultations/${consultationId}/audio/${audioId}/retranscribe`, error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: '重新转录失败', details: errorMessage }, { status: 500 });
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
