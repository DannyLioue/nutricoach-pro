import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * 文件存储服务
 * 将 Base64 数据保存为文件，数据库只存储路径
 */

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

// 确保上传目录存在
async function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

/**
 * 保存 Base64 图片为文件
 * @param clientId 客户ID
 * @param base64Data Base64 编码的图片数据 (支持 data:image/xxx;base64, 格式)
 * @param subdirectory 子目录 (如 'diet-photos', 'consultations')
 * @returns 文件路径 (相对于 public 目录)
 */
export async function saveImageFile(
  clientId: string,
  base64Data: string,
  subdirectory: string
): Promise<string> {
  // 提取 Base64 数据（去除 data:image/xxx;base64, 前缀）
  const base64String = base64Data.includes('base64,')
    ? base64Data.split('base64,')[1]
    : base64Data;

  // 获取图片格式
  const matches = base64Data.match(/^data:image\/(\w+);base64,/);
  const format = matches?.[1] || 'jpg'; // 默认 jpg

  // 转换为 Buffer
  const buffer = Buffer.from(base64String, 'base64');

  // 生成文件名
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const filename = `${timestamp}-${random}.${format}`;

  // 创建目录路径
  const targetDir = join(UPLOAD_DIR, 'clients', clientId, subdirectory);
  await ensureDir(targetDir);

  // 保存文件
  const filepath = join(targetDir, filename);
  await writeFile(filepath, buffer);

  // 返回相对于 public 的路径
  return `/uploads/clients/${clientId}/${subdirectory}/${filename}`;
}

/**
 * 删除文件
 * @param filepath 文件路径 (相对于 public 目录)
 */
export async function deleteFile(filepath: string): Promise<void> {
  const fullPath = join(process.cwd(), 'public', filepath);
  try {
    const { unlink } = await import('fs/promises');
    await unlink(fullPath);
  } catch (error) {
    // 文件不存在或其他错误，忽略
    console.warn(`Failed to delete file: ${filepath}`, error);
  }
}

/**
 * 保存音频文件
 * @param clientId 客户ID
 * @param audioBuffer 音频数据 Buffer
 * @param filename 文件名
 * @returns 文件路径 (相对于 public 目录)
 */
export async function saveAudioFile(
  clientId: string,
  audioBuffer: Buffer,
  filename: string
): Promise<string> {
  const targetDir = join(UPLOAD_DIR, 'clients', clientId, 'consultations', 'audio');
  await ensureDir(targetDir);

  const filepath = join(targetDir, filename);
  await writeFile(filepath, audioBuffer);

  return `/uploads/clients/${clientId}/consultations/audio/${filename}`;
}

/**
 * 保存体检报告文件
 * @param clientId 客户ID
 * @param fileBuffer 文件数据 Buffer
 * @param filename 文件名
 * @returns 文件路径 (相对于 public 目录)
 */
export async function saveReportFile(
  clientId: string,
  fileBuffer: Buffer,
  filename: string
): Promise<string> {
  const targetDir = join(UPLOAD_DIR, 'clients', clientId, 'reports');
  await ensureDir(targetDir);

  const filepath = join(targetDir, filename);
  await writeFile(filepath, fileBuffer);

  return `/uploads/clients/${clientId}/reports/${filename}`;
}
