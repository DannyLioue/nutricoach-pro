import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

/**
 * 最简单的 Google API 测试
 * 使用与原始 gemini.ts 完全相同的方式
 */
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 使用与原始代码完全相同的方式
    const model = google('gemini-2.5-flash');

    const { text } = await generateText({
      model,
      prompt: '你好，这是最简单的测试！请回复"确认你收到了"',
    });

    return NextResponse.json({
      message: '测试完成',
      result: {
        model: 'gemini-2.5-flash',
        response: text,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: '测试失败',
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
