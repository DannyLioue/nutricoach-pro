import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';
import path from 'path';

const execAsync = promisify(exec);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 使用 ImageMagick 转换 HEIC 为 JPG
async function convertHeicWithImageMagick(buffer: Buffer): Promise<Buffer> {
  // 创建临时文件
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `input-${Date.now()}-${Math.random().toString(36).substring(7)}.heic`);
  const outputPath = path.join(tempDir, `output-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`);

  try {
    // 写入输入文件
    fs.writeFileSync(inputPath, buffer);

    // 使用 ImageMagick 转换
    // -quality 85: JPEG 质量 85%
    // -strip: 移除元数据以减小文件大小
    const command = `magick "${inputPath}" -quality 85 -strip "${outputPath}"`;

    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 30000, // 30 秒超时
    });

    if (stderr && !stderr.includes('Warning')) {
      console.warn('ImageMagick stderr:', stderr);
    }

    // 读取输出文件
    if (!fs.existsSync(outputPath)) {
      throw new Error('ImageMagick conversion failed - no output file generated');
    }

    const outputBuffer = fs.readFileSync(outputPath);

    if (outputBuffer.length === 0) {
      throw new Error('ImageMagick conversion failed - output buffer is empty');
    }

    return outputBuffer;
  } finally {
    // 清理临时文件
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp files:', cleanupError);
    }
  }
}

// POST - 转换 HEIC 图片为 JPG
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 });
    }

    // 验证文件类型
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' ||
                   file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');

    if (!isHeic) {
      return NextResponse.json({ error: '不是 HEIC 格式文件' }, { status: 400 });
    }

    // 验证文件大小（限制 10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: `文件过大，最大支持 ${maxSize / 1024 / 1024}MB` }, { status: 400 });
    }

    // 将文件转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 使用 ImageMagick 转换
    let convertedBuffer: Buffer;
    try {
      convertedBuffer = await convertHeicWithImageMagick(buffer);
    } catch (error) {
      console.error('HEIC 转换失败:', error);

      return NextResponse.json(
        {
          error: 'HEIC 转换失败',
          details: error instanceof Error ? error.message : '未知错误',
          suggestion: '请确保已安装 ImageMagick: brew install imagemagick',
        },
        { status: 500 }
      );
    }

    // 转换为 Base64
    const base64Data = convertedBuffer.toString('base64');
    const base64 = `data:image/jpeg;base64,${base64Data}`;

    // 验证生成的 data URL 格式
    if (!base64.startsWith('data:image/jpeg;base64,')) {
      throw new Error('生成的 data URL 格式错误');
    }

    return NextResponse.json({
      success: true,
      data: base64,
      originalSize: file.size,
      convertedSize: convertedBuffer.length,
    });
  } catch (error) {
    console.error('HEIC conversion error:', error);
    return NextResponse.json(
      {
        error: 'HEIC 转换失败',
        details: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
