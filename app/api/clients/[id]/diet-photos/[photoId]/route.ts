import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// DELETE - 删除单张饮食照片
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  let id = '';
  let photoId = '';
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    photoId = resolvedParams.photoId;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证客户访问权限
    const accessResult = await verifyClientAccess(id, session.user.id);
    if (!accessResult.exists) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.statusCode || 404 });
    }

    // 验证照片是否属于该客户
    const photo = await prisma.dietPhoto.findFirst({
      where: {
        id: photoId,
        clientId: id,
      },
    });

    if (!photo) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    // 先删除磁盘上的图片文件
    if (photo.imageUrl) {
      try {
        const filePath = photo.imageUrl.startsWith('/') ? photo.imageUrl.slice(1) : photo.imageUrl;
        const fullPath = join(process.cwd(), 'public', filePath);
        if (existsSync(fullPath)) {
          await unlink(fullPath);
          logger.info(`[DELETE] Deleted diet photo file: ${filePath}`);
        }
      } catch (error) {
        logger.error(`[DELETE] Failed to delete diet photo file: ${photo.imageUrl}`, error);
        // 继续删除数据库记录，不因文件删除失败而中断
      }
    }

    // 删除数据库记录
    await prisma.dietPhoto.delete({
      where: { id: photoId },
    });

    logger.apiSuccess('DELETE', `/api/clients/${id}/diet-photos/${photoId}`, '照片删除成功');

    return NextResponse.json({
      success: true,
      message: '照片删除成功',
    });
  } catch (error) {
    logger.apiError('DELETE', `/api/clients/${id}/diet-photos/${photoId}`, error);
    return NextResponse.json({ error: '删除照片失败' }, { status: 500 });
  }
}
