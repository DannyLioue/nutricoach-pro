import { NextRequest, NextResponse } from 'next/server';
import { analyzeHealthReport } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientInfo, reportData } = body;

    if (!clientInfo || !reportData) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const analysis = await analyzeHealthReport(clientInfo, reportData);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: '分析失败：' + (error as Error).message },
      { status: 500 }
    );
  }
}
