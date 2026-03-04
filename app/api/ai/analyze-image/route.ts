import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { analyzeReportImage } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: '缺少图片数据' },
        { status: 400 }
      );
    }

    const result = await analyzeReportImage(imageBase64);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Image analysis API error:', error);
    return NextResponse.json(
      { error: '图片分析失败：' + (error as Error).message },
      { status: 500 }
    );
  }
}
