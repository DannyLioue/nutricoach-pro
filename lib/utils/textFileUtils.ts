/**
 * Text File Utilities
 *
 * Utilities for extracting and validating text files (.txt, .md, .doc, .docx)
 */

import mammoth from 'mammoth';

export interface TextFileExtractionResult {
  success: boolean;
  content?: string;
  error?: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.doc', '.docx'];

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
}

/**
 * Get text file type from File object
 */
export function getTextFileType(file: File): 'txt' | 'md' | 'doc' | 'docx' {
  const extension = getFileExtension(file.name);
  switch (extension) {
    case '.txt': return 'txt';
    case '.md': return 'md';
    case '.doc': return 'doc';
    case '.docx': return 'docx';
    default: return 'txt';
  }
}

/**
 * Validate text file
 */
export function validateTextFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: '文件不存在' };
  }

  if (file.size === 0) {
    return { valid: false, error: '文件为空' };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `文件大小超过限制，最大允许 5 MB`,
    };
  }

  const extension = getFileExtension(file.name);
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: '不支持的文件格式，请上传 .txt、.md、.doc 或 .docx 文件',
    };
  }

  return { valid: true };
}

/**
 * Extract text content from file
 */
export async function extractTextFromFile(file: File): Promise<TextFileExtractionResult> {
  try {
    const extension = getFileExtension(file.name);

    switch (extension) {
      case '.txt':
      case '.md':
        // Direct text reading
        const textContent = await file.text();
        return {
          success: true,
          content: textContent,
        };

      case '.doc':
      case '.docx':
        // Use mammoth to extract Word document
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });

        if (result.messages.length > 0) {
          console.warn('[Text Extraction] Warnings:', result.messages);
        }

        return {
          success: true,
          content: result.value,
        };

      default:
        return {
          success: false,
          error: '不支持的文件类型',
        };
    }
  } catch (error) {
    console.error('[Text Extraction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '文件提取失败',
    };
  }
}
