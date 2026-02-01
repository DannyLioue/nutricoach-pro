/**
 * 视频链接验证工具
 * 用于验证AI生成的视频链接格式是否正确
 * 仅支持国内可访问的视频平台
 */

export type VideoPlatform = 'bilibili' | 'douyin' | 'xiaohongshu' | 'weixin';

export interface VideoValidationResult {
  isValid: boolean;
  platform?: VideoPlatform;
  error?: string;
}

/**
 * 验证视频链接格式
 * @param url 视频URL
 * @param declaredPlatform 声明的平台（可选，用于验证一致性）
 * @returns 验证结果
 */
export function validateVideoUrl(
  url: string,
  declaredPlatform?: VideoPlatform
): VideoValidationResult {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL 为空或格式错误' };
  }

  // 去除前后空格
  url = url.trim();

  // 平台匹配规则（仅国内平台）
  const platformPatterns: Record<VideoPlatform, RegExp> = {
    bilibili: /^https?:\/\/(www\.)?bilibili\.com\/video\/(BV[\w]+|av\d+)/i,
    douyin: /^https?:\/\/(www\.)?douyin\.com\/video\/\d+/i,
    xiaohongshu: /^https?:\/\/(www\.)?xiaohongshu\.com\/(explore|discovery\/item)\/[\w]+/i,
    weixin: /^https?:\/\/mp\.weixin\.qq\.com\/s\/[\w-]+/i,
  };

  // 检查URL是否匹配任何平台
  for (const [platform, pattern] of Object.entries(platformPatterns)) {
    if (pattern.test(url)) {
      const detectedPlatform = platform as VideoPlatform;

      // 如果声明了平台，验证是否一致
      if (declaredPlatform && declaredPlatform !== detectedPlatform) {
        return {
          isValid: false,
          error: `平台不匹配：声明为 ${declaredPlatform}，但链接是 ${detectedPlatform}`,
        };
      }

      return {
        isValid: true,
        platform: detectedPlatform,
      };
    }
  }

  return {
    isValid: false,
    error: '不支持的视频平台或链接格式错误（仅支持B站、抖音、小红书、微信视频号）',
  };
}

/**
 * 批量验证视频链接
 * @param videos 包含视频信息的对象数组
 * @returns 验证结果数组
 */
export function validateVideoUrls(
  videos: Array<{
    videoUrl?: string;
    videoPlatform?: VideoPlatform;
    name?: string;
  }>
): Array<{ name?: string; result: VideoValidationResult }> {
  return videos.map((video) => ({
    name: video.name,
    result: video.videoUrl
      ? validateVideoUrl(video.videoUrl, video.videoPlatform)
      : { isValid: false, error: '未提供视频链接' },
  }));
}

/**
 * 获取视频链接的统计信息
 * @param videos 包含视频信息的对象数组
 * @returns 统计信息
 */
export function getVideoStats(
  videos: Array<{
    videoUrl?: string;
    videoPlatform?: VideoPlatform;
  }>
): {
  total: number;
  withVideo: number;
  valid: number;
  invalid: number;
  byPlatform: Record<VideoPlatform, number>;
} {
  const stats = {
    total: videos.length,
    withVideo: 0,
    valid: 0,
    invalid: 0,
    byPlatform: {
      bilibili: 0,
      douyin: 0,
      xiaohongshu: 0,
      weixin: 0,
    } as Record<VideoPlatform, number>,
  };

  videos.forEach((video) => {
    if (video.videoUrl) {
      stats.withVideo++;
      const result = validateVideoUrl(video.videoUrl, video.videoPlatform);
      if (result.isValid && result.platform) {
        stats.valid++;
        stats.byPlatform[result.platform]++;
      } else {
        stats.invalid++;
      }
    }
  });

  return stats;
}
