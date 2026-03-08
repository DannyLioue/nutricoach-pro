import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { isDataUrl, resolvePublicFileAbsolutePath } from '@/lib/reports/file-url';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const report = await prisma.report.findFirst({
      where: {
        id,
        client: { userId: session.user.id },
      },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileUrl: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: '报告不存在' }, { status: 404 });
    }

    if (isDataUrl(report.fileUrl)) {
      const matches = report.fileUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ error: '历史报告格式无效' }, { status: 400 });
      }

      const mimeType = matches[1] || report.fileType || 'application/octet-stream';
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `inline; filename="${encodeURIComponent(report.fileName)}"`,
          'Cache-Control': 'private, max-age=0, must-revalidate',
        },
      });
    }

    const absolutePath = resolvePublicFileAbsolutePath(report.fileUrl);
    const fileBuffer = await readFile(absolutePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': report.fileType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(report.fileName)}"`,
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    console.error('读取报告文件错误:', error);
    return NextResponse.json({ error: '读取报告文件失败' }, { status: 500 });
  }
}

