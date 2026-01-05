import { NextRequest, NextResponse } from 'next/server';
import { analyzeReportImage } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
  try {
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
