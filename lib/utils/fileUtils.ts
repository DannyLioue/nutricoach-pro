/**
 * File Utilities
 *
 * Validation and processing utilities for file uploads in the consultation feature.
 */

// Configuration
export const MAX_AUDIO_SIZE_MB = 20;
export const MAX_IMAGE_SIZE_MB = 5;

// Supported audio formats
const SUPPORTED_AUDIO_FORMATS = [
  'audio/mpeg',     // .mp3
  'audio/mp4',      // .m4a
  'audio/wav',      // .wav
  'audio/webm',     // .webm
  'audio/ogg',      // .ogg
];

// Supported image formats
const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',     // .jpg, .jpeg
  'image/png',      // .png
  'image/webp',     // .webp
  'image/gif',      // .gif
];

// Audio file extensions
const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.wav', '.webm', '.ogg', '.mp4', '.aac'];

/**
 * Validation result interface
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates an audio file for upload
 *
 * @param file - The file to validate
 * @returns Validation result with error message if invalid
 */
export function validateAudioFile(file: File): FileValidationResult {
  // Check if file exists
  if (!file) {
    return { valid: false, error: '文件不存在' };
  }

  // Check if file is empty
  if (file.size === 0) {
    return { valid: false, error: '文件为空' };
  }

  // Check file size
  const maxSizeBytes = MAX_AUDIO_SIZE_MB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `文件大小超过限制，最大允许 ${MAX_AUDIO_SIZE_MB} MB`,
    };
  }

  // Check file type (MIME type)
  if (file.type && !SUPPORTED_AUDIO_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: '不支持的文件格式，请上传 MP3、M4A、WAV、WEBM 或 OGG 格式的音频文件',
    };
  }

  // If no MIME type, try to infer from extension
  if (!file.type) {
    const extension = getFileExtension(file.name);
    if (!AUDIO_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: '不支持的文件格式，请上传 MP3、M4A、WAV、WEBM 或 OGG 格式的音频文件',
      };
    }
  }

  return { valid: true };
}

/**
 * Validates an image file for upload
 *
 * @param file - The file to validate
 * @returns Validation result with error message if invalid
 */
export function validateImageFile(file: File): FileValidationResult {
  // Check if file exists
  if (!file) {
    return { valid: false, error: '文件不存在' };
  }

  // Check if file is empty
  if (file.size === 0) {
    return { valid: false, error: '文件为空' };
  }

  // Check file size
  const maxSizeBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `文件大小超过限制，最大允许 ${MAX_IMAGE_SIZE_MB} MB`,
    };
  }

  // Check file type (MIME type)
  if (file.type && !SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: '不支持的文件格式，请上传 JPG、PNG、WEBP 或 GIF 格式的图片',
    };
  }

  // Explicitly reject SVG (not a photo format)
  if (file.type === 'image/svg+xml') {
    return {
      valid: false,
      error: '不支持的文件格式，请上传 JPG、PNG、WEBP 或 GIF 格式的图片',
    };
  }

  return { valid: true };
}

/**
 * Converts a File object to a base64 data URL
 *
 * @param file - The file to convert
 * @returns Promise resolving to a base64 data URL string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Formats a file size in bytes to a human-readable string
 *
 * @param bytes - File size in bytes
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  // Handle negative numbers
  if (bytes < 0) {
    return '0 B';
  }

  // Handle zero
  if (bytes === 0) {
    return '0 B';
  }

  // Only use units up to GB for more practical display
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Cap at GB (index 3)
  const unitIndex = Math.min(i, units.length - 1);
  const value = bytes / Math.pow(k, unitIndex);

  // Round to 1 decimal place and format
  const formattedValue = value % 1 === 0 ? value : parseFloat(value.toFixed(1));

  return `${formattedValue} ${units[unitIndex]}`;
}

/**
 * Helper function to get file extension from filename
 *
 * @param filename - The filename to extract extension from
 * @returns The file extension (lowercase, with dot)
 */
function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
}

/**
 * Checks if a file is an audio file based on MIME type or extension
 *
 * @param file - The file to check
 * @returns True if the file is an audio file
 */
export function isAudioFile(file: File): boolean {
  if (file.type && SUPPORTED_AUDIO_FORMATS.includes(file.type)) {
    return true;
  }
  const extension = getFileExtension(file.name);
  return AUDIO_EXTENSIONS.includes(extension);
}

/**
 * Checks if a file is an image file based on MIME type
 *
 * @param file - The file to check
 * @returns True if the file is an image file
 */
export function isImageFile(file: File): boolean {
  return file.type ? SUPPORTED_IMAGE_FORMATS.includes(file.type) : false;
}
