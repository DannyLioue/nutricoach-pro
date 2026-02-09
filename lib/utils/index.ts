/**
 * Utility functions index
 * Re-exports all utility modules for easier imports
 */

// Class name utility for Tailwind CSS
export { cn } from '../utils';

// JSON utilities
export { safeJSONParse, safeJSONStringify, safeJSONParseArray, safeJSONParseObject } from './jsonUtils';

// File utilities
export {
  validateAudioFile,
  validateImageFile,
  fileToBase64,
  formatFileSize,
  isAudioFile,
  isImageFile,
  MAX_AUDIO_SIZE_MB,
  MAX_IMAGE_SIZE_MB,
  type FileValidationResult
} from './fileUtils';

// Text file utilities
export {
  getTextFileType,
  validateTextFile,
  type TextFileExtractionResult
} from './textFileUtils';
