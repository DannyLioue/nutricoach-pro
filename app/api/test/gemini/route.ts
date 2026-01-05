import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(request: NextRequest) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

    // 测试不同的模型
    const models = [
      'gemini-2.0-flash-exp',
      'gemini-2.0-flash-thinking-exp',
      'gemini-pro',
      'gemini-pro-vision',
    ];

    const results: any = {};

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = '你好，请用一句话介绍你自己。';

        const startTime = Date.now();
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
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
