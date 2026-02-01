import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

// 设置 @ai-sdk/google 需要的环境变量
process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    // 测试不同的模型
    const models = [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
    ];

    const results: any = {};

    const prompt = '你好，请用一句话介绍你自己。';

    for (const modelName of models) {
      try {
        const model = google(modelName);

        const startTime = Date.now();
        const { text } = await generateText({
          model,
          prompt,
        });
        const endTime = Date.now();

        results[modelName] = {
          success: true,
          response: text.substring(0, 100),
          time: `${endTime - startTime}ms`,
        };
      } catch (error: any) {
        results[modelName] = {
          success: false,
          error: error.message,
        };
      }
    }

    return NextResponse.json({
      message: '测试完成',
      results,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: '测试失败',
      message: error.message,
    }, { status: 500 });
  }
}
