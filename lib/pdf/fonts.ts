import { Font } from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';

let fontsRegistered = false;

/**
 * 注册 PDF 中文字体
 */
export function registerPDFFonts(force = false) {
  if (fontsRegistered && !force) {
    return;
  }

  try {
    // 获取字体文件路径
    const regularFontPath = path.join(process.cwd(), 'public/fonts/NotoSansSC-Regular.ttf');
    const boldFontPath = path.join(process.cwd(), 'public/fonts/NotoSansSC-Bold.ttf');

    // 检查字体文件是否存在
    if (fs.existsSync(regularFontPath) && fs.existsSync(boldFontPath)) {
      // 注册 Regular 字体
      Font.register({
        family: 'Noto Sans SC',
        src: regularFontPath,
      });

      // 注册 Bold 字体
      Font.register({
        family: 'Noto Sans SC',
        fontWeight: 700,
        src: boldFontPath,
      });

      console.log('[PDF Fonts] 中文字体注册成功');
    } else {
      console.warn('[PDF Fonts] 字体文件不存在，将使用默认字体（中文可能无法显示）');
    }
  } catch (error) {
    console.error('[PDF Fonts] 字体注册失败:', error);
  }

  fontsRegistered = true;
}

/**
 * 重置字体注册状态
 */
export function resetFontRegistration() {
  fontsRegistered = false;
}
