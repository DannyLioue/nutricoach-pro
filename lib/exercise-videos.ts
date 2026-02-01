/**
 * 常见运动动作视频库
 * 优先使用 B站（高质量教学）和小红书（简短易懂）
 */

export interface ExerciseVideo {
  keywords: string[]; // 动作关键词，用于匹配
  videoUrl: string;
  videoPlatform: 'bilibili' | 'douyin' | 'xiaohongshu' | 'weixin'; // 仅国内平台
  videoTitle: string;
  instructor?: string; // 教练/UP主
  duration?: string; // 视频时长
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * 常见运动动作视频库
 * 注：这些是示例链接，实际使用时需要替换为真实的优质教学视频
 */
export const EXERCISE_VIDEO_LIBRARY: Record<string, ExerciseVideo> = {
  // ==================== 上肢训练 ====================
  '俯卧撑': {
    keywords: ['俯卧撑', 'push up', 'pushup', '标准俯卧撑'],
    videoUrl: 'https://www.bilibili.com/video/BV1xx411c7mD',
    videoPlatform: 'bilibili',
    videoTitle: '俯卧撑标准动作教学 - 从零开始',
    instructor: '健身教练',
    duration: '5分钟',
    difficulty: 'beginner',
  },
  '哑铃推举': {
    keywords: ['哑铃推举', '肩推', 'shoulder press', '推肩'],
    videoUrl: 'https://www.bilibili.com/video/example',
    videoPlatform: 'bilibili',
    videoTitle: '哑铃肩推标准动作详解',
    difficulty: 'intermediate',
  },
  '哑铃弯举': {
    keywords: ['哑铃弯举', '二头弯举', 'bicep curl', '臂弯举'],
    videoUrl: 'https://www.bilibili.com/video/example',
    videoPlatform: 'bilibili',
    videoTitle: '哑铃弯举：打造完美二头肌',
    difficulty: 'beginner',
  },

  // ==================== 下肢训练 ====================
  '深蹲': {
    keywords: ['深蹲', 'squat', '徒手深蹲', '自重深蹲'],
    videoUrl: 'https://www.bilibili.com/video/example',
    videoPlatform: 'bilibili',
    videoTitle: '深蹲标准动作教学 - 避免膝盖受伤',
    difficulty: 'beginner',
  },
  '箭步蹲': {
    keywords: ['箭步蹲', 'lunge', '弓箭步'],
    videoUrl: 'https://www.xiaohongshu.com/example',
    videoPlatform: 'xiaohongshu',
    videoTitle: '箭步蹲正确做法',
    difficulty: 'intermediate',
  },
  '保加利亚分腿蹲': {
    keywords: ['保加利亚分腿蹲', 'bulgarian split squat', '单腿蹲'],
    videoUrl: 'https://www.bilibili.com/video/example',
    videoPlatform: 'bilibili',
    videoTitle: '保加利亚分腿蹲：单腿力量训练',
    difficulty: 'advanced',
  },

  // ==================== 核心训练 ====================
  '平板支撑': {
    keywords: ['平板支撑', 'plank', '支撑'],
    videoUrl: 'https://www.bilibili.com/video/example',
    videoPlatform: 'bilibili',
    videoTitle: '平板支撑标准姿势 - 核心激活',
    difficulty: 'beginner',
  },
  '卷腹': {
    keywords: ['卷腹', 'crunch', '腹肌卷腹'],
    videoUrl: 'https://www.xiaohongshu.com/example',
    videoPlatform: 'xiaohongshu',
    videoTitle: '卷腹动作详解',
    difficulty: 'beginner',
  },
  '俄罗斯转体': {
    keywords: ['俄罗斯转体', 'russian twist', '转体'],
    videoUrl: 'https://www.bilibili.com/video/example',
    videoPlatform: 'bilibili',
    videoTitle: '俄罗斯转体：强化腹斜肌',
    difficulty: 'intermediate',
  },

  // ==================== 有氧运动 ====================
  '开合跳': {
    keywords: ['开合跳', 'jumping jack', '开合跃'],
    videoUrl: 'https://www.xiaohongshu.com/example',
    videoPlatform: 'xiaohongshu',
    videoTitle: '开合跳：燃脂热身必备',
    difficulty: 'beginner',
  },
  '波比跳': {
    keywords: ['波比跳', 'burpee', '立卧撑跳'],
    videoUrl: 'https://www.bilibili.com/video/example',
    videoPlatform: 'bilibili',
    videoTitle: '波比跳完整教学 - 燃脂之王',
    difficulty: 'advanced',
  },
  '高抬腿': {
    keywords: ['高抬腿', 'high knee', '原地高抬腿'],
    videoUrl: 'https://www.xiaohongshu.com/example',
    videoPlatform: 'xiaohongshu',
    videoTitle: '高抬腿正确做法',
    difficulty: 'beginner',
  },

  // ==================== 拉伸运动 ====================
  '猫牛式': {
    keywords: ['猫牛式', 'cat cow', '猫式伸展'],
    videoUrl: 'https://www.xiaohongshu.com/example',
    videoPlatform: 'xiaohongshu',
    videoTitle: '猫牛式：脊柱灵活性训练',
    difficulty: 'beginner',
  },
  '婴儿式': {
    keywords: ['婴儿式', 'child pose', '儿童式'],
    videoUrl: 'https://www.xiaohongshu.com/example',
    videoPlatform: 'xiaohongshu',
    videoTitle: '婴儿式放松拉伸',
    difficulty: 'beginner',
  },
};

/**
 * 根据动作名称查找视频
 * @param exerciseName 动作名称
 * @returns 视频信息或 null
 */
export function findExerciseVideo(exerciseName: string): ExerciseVideo | null {
  // 标准化动作名称（去除空格、括号内容等）
  const normalizedName = exerciseName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[（(].*?[)）]/g, '');

  // 遍历视频库查找匹配
  for (const [key, video] of Object.entries(EXERCISE_VIDEO_LIBRARY)) {
    const keywordsMatch = video.keywords.some(keyword => {
      const normalizedKeyword = keyword.toLowerCase().replace(/\s+/g, '');
      return (
        normalizedName.includes(normalizedKeyword) ||
        normalizedKeyword.includes(normalizedName)
      );
    });

    if (keywordsMatch) {
      return video;
    }
  }

  return null;
}

/**
 * 为动作列表批量添加视频信息
 * @param exercises 动作列表
 * @returns 添加了视频信息的动作列表
 */
export function enrichExercisesWithVideos<T extends { name: string }>(
  exercises: T[]
): Array<T & Partial<ExerciseVideo>> {
  return exercises.map(exercise => {
    const video = findExerciseVideo(exercise.name);
    if (video) {
      return {
        ...exercise,
        videoUrl: video.videoUrl,
        videoPlatform: video.videoPlatform,
        videoTitle: video.videoTitle,
      };
    }
    return exercise;
  });
}

/**
 * 获取平台图标和颜色
 */
export function getPlatformInfo(platform: string) {
  const platformMap: Record<string, { name: string; color: string; icon: string }> = {
    bilibili: { name: 'B站', color: '#00A1D6', icon: '📺' },
    xiaohongshu: { name: '小红书', color: '#FF2442', icon: '📕' },
    douyin: { name: '抖音', color: '#000000', icon: '🎵' },
    weixin: { name: '视频号', color: '#07C160', icon: '📱' },
  };
  return platformMap[platform] || { name: platform, color: '#666666', icon: '🎬' };
}
