/**
 * 数据库清理脚本 - 处理旧的 Base64 数据
 *
 * 这个脚本会：
 * 1. 检查数据库中的 Base64 数据
 * 2. 将 Base64 数据转换为文件
 * 3. 更新数据库中的路径
 *
 * 使用方法：
 *   npx tsx scripts/cleanup-base64-data.ts
 */

import { prisma } from '@/lib/db/prisma';
import { saveImageFile } from '@/lib/storage/file-storage';

// 检测是否为 Base64 数据
function isBase64(str: string): boolean {
  return str.startsWith('data:image');
}

// 从 Base64 数据中提取文件扩展名
function getExtensionFromBase64(base64: string): string {
  const match = base64.match(/^data:image\/(\w+);base64,/);
  if (match) return match[1];

  return 'jpg'; // 默认
}

async function cleanupDietPhotos() {
  console.log('🔍 检查 DietPhoto 表...');

  const photos = await prisma.dietPhoto.findMany();
  let updatedCount = 0;

  for (const photo of photos) {
    if (isBase64(photo.imageUrl)) {
      console.log(`  📸 处理照片 ${photo.id}...`);

      try {
        // 保存文件
        const newPath = await saveImageFile(
          photo.clientId,
          photo.imageUrl,
          'diet-photos'
        );

        // 更新数据库
        await prisma.dietPhoto.update({
          where: { id: photo.id },
          data: { imageUrl: newPath },
        });

        console.log(`    ✅ 已转换为文件: ${newPath}`);
        updatedCount++;
      } catch (error) {
        console.error(`    ❌ 处理失败:`, error);
      }
    }
  }

  console.log(`✨ DietPhoto 清理完成，更新了 ${updatedCount} 条记录`);
  return updatedCount;
}

async function cleanupConsultations() {
  console.log('🔍 检查 Consultation 表...');

  const consultations = await prisma.consultation.findMany();
  let totalImagesUpdated = 0;

  for (const consultation of consultations) {
    let needsUpdate = false;
    let updatedImages: any[] = [];

    // 处理图片
    if (consultation.images) {
      const images = JSON.parse(consultation.images);
      for (const img of images) {
        if (isBase64(img.imageUrl)) {
          console.log(`  📸 处理咨询 ${consultation.id} 的图片...`);

          try {
            const newPath = await saveImageFile(
              consultation.clientId,
              img.imageUrl,
              'consultations/images'
            );

            updatedImages.push({
              ...img,
              imageUrl: newPath,
            });
            totalImagesUpdated++;
          } catch (error) {
            console.error(`    ❌ 处理图片失败:`, error);
            updatedImages.push(img); // 保留原数据
          }
        } else {
          updatedImages.push(img);
        }
      }

      if (updatedImages.length !== images.length) {
        needsUpdate = true;
      }
    }

    // 更新数据库
    if (needsUpdate) {
      await prisma.consultation.update({
        where: { id: consultation.id },
        data: {
          images: updatedImages.length > 0 ? JSON.stringify(updatedImages) : null,
        },
      });
    }
  }

  console.log(`✨ Consultation 清理完成，更新了 ${totalImagesUpdated} 张图片`);
  return { totalImagesUpdated };
}

async function main() {
  console.log('🚀 开始清理数据库中的 Base64 数据...\n');

  try {
    const photoCount = await cleanupDietPhotos();
    console.log();

    const { totalImagesUpdated } = await cleanupConsultations();
    console.log();

    console.log('📊 清理总结:');
    console.log(`  - 饮食照片: ${photoCount} 条`);
    console.log(`  - 咨询图片: ${totalImagesUpdated} 张`);
    console.log('\n✅ 清理完成！');
  } catch (error) {
    console.error('❌ 清理失败:', error);
    process.exit(1);
  }
}

main();
