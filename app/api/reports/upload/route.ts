import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientId = formData.get('clientId') as string;
    const fileName = formData.get('fileName') as string;
    const fileType = formData.get('fileType') as string;

    if (!file) {
      return NextResponse.json({ error: '未上传文件' }, { status: 400 });
    }

    if (!clientId) {
      return NextResponse.json({ error: '未选择客户' }, { status: 400 });
    }

    // 验证客户是否属于当前用户
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: session.user.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }

    // 将文件转换为 base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileBase64 = buffer.toString('base64');
    const fileDataUrl = `data:${fileType};base64,${fileBase64}`;

    // 创建报告记录
    const report = await prisma.report.create({
      data: {
        clientId: clientId,
        fileName: fileName,
        fileType: fileType,
        fileUrl: fileDataUrl,
        extractedData: {
          uploadDate: new Date().toISOString(),
          fileName: fileName,
          fileSize: file.size,
        },
      },
    });

    // 使用 Gemini AI 分析报告
    let analysis;
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      // 构建提示词
      const prompt = `你是一个专业的营养师和健康分析师。请分析这张体检报告图片，提取所有关键健康指标。

请以 JSON 格式返回分析结果，包含以下字段：
{
  "summary": "整体健康状况的简要总结（1-2句话）",
  "healthScore": 数字（0-100的健康评分）,
  "indicators": [
    {
      "name": "指标名称（如：总胆固醇）",
      "value": "检测值",
      "unit": "单位（如：mmol/L）",
      "normalRange": "正常范围",
      "status": "正常/偏高/偏低",
      "risk": "相关健康风险（如有）"
    }
  ],
  "recommendations": ["基于分析结果的1-3条建议"]
}

客户基本信息：
- 姓名：${client.name}
- 性别：${client.gender === 'MALE' ? '男' : client.gender === 'FEMALE' ? '女' : '其他'}
- 年龄：${new Date().getFullYear() - new Date(client.birthDate).getFullYear()}岁
- 身高：${client.height}cm
- 体重：${client.weight}kg
- 活动水平：${client.activityLevel}
- 过敏原：${client.allergies || '无'}
- 疾病史：${client.medicalHistory || '无'}

请仔细分析图片中的所有数据，给出专业的评估和建议。`;

      // 调用 Gemini API
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: fileBase64,
            mimeType: fileType,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      // 尝试解析 JSON
      try {
        // 清理 markdown 代码块标记
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        analysis = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('JSON 解析失败，使用原始文本:', parseError);
        // 如果 JSON 解析失败，创建基础分析
        analysis = {
          summary: text.substring(0, 200) + '...',
          healthScore: 70,
          indicators: [],
          recommendations: [],
        };
      }

      // 添加分析时间戳
      analysis.analyzedAt = new Date().toISOString();
    } catch (aiError) {
      console.error('AI 分析错误:', aiError);
      // AI 分析失败时返回基础信息
      analysis = {
        summary: '报告已上传，AI 分析暂时不可用。系统已保存文件，您可以稍后重新分析。',
        healthScore: null,
        indicators: [],
        recommendations: [],
        analyzedAt: new Date().toISOString(),
        error: 'AI 分析失败',
      };
    }

    // 更新报告的分析结果
    await prisma.report.update({
      where: { id: report.id },
      data: { analysis: analysis as any },
    });

    return NextResponse.json({
      message: '上传成功',
      report: {
        id: report.id,
        fileName: report.fileName,
        uploadedAt: report.uploadedAt,
      },
      analysis,
    });
  } catch (error) {
    console.error('上传报告错误:', error);
    return NextResponse.json({ error: '上传报告失败' }, { status: 500 });
  }
}
