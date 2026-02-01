/**
 * File Utilities Tests
 *
 * Tests for file validation and processing utilities used in
 * consultation feature (audio and image uploads).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateAudioFile,
  validateImageFile,
  fileToBase64,
  formatFileSize,
  MAX_AUDIO_SIZE_MB,
  MAX_IMAGE_SIZE_MB,
} from '@/lib/utils/fileUtils';

describe('File Utilities', () => {
  describe('validateAudioFile', () => {
    const mockAudioFile = (name: string, sizeInBytes: number, type: string): File => {
      // Create actual content of the desired size
      const content = new ArrayBuffer(sizeInBytes);
      return new File([content], name, { type });
    };

    it('should accept valid MP3 file within size limit', () => {
      const file = mockAudioFile('recording.mp3', 5 * 1024 * 1024, 'audio/mpeg'); // 5MB
      const result = validateAudioFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid M4A file', () => {
      const file = mockAudioFile('recording.m4a', 3 * 1024 * 1024, 'audio/mp4'); // 3MB
      const result = validateAudioFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid WAV file', () => {
      const file = mockAudioFile('recording.wav', 2 * 1024 * 1024, 'audio/wav'); // 2MB
      const result = validateAudioFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid WEBM file', () => {
      const file = mockAudioFile('recording.webm', 4 * 1024 * 1024, 'audio/webm'); // 4MB
      const result = validateAudioFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject file that exceeds size limit', () => {
      const maxSize = (MAX_AUDIO_SIZE_MB + 1) * 1024 * 1024; // 1 MB over limit
      const file = mockAudioFile('huge.mp3', maxSize, 'audio/mpeg');
      const result = validateAudioFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('文件大小');
      expect(result.error).toContain(MAX_AUDIO_SIZE_MB.toString());
    });

    it('should reject non-audio file type', () => {
      const file = mockAudioFile('document.pdf', 1024 * 1024, 'application/pdf');
      const result = validateAudioFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('不支持的文件格式');
    });

    it('should reject video file with audio extension', () => {
      const file = mockAudioFile('video.mp4', 5 * 1024 * 1024, 'video/mp4');
      const result = validateAudioFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('不支持的文件格式');
    });

    it('should reject empty file', () => {
      const file = mockAudioFile('empty.mp3', 0, 'audio/mpeg');
      const result = validateAudioFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('文件为空');
    });

    it('should handle file without type', () => {
      const file = new File(['audio'], 'recording.mp3', { type: '' });
      const result = validateAudioFile(file);

      // Should try to infer from extension
      expect(result.valid).toBe(true);
    });
  });

  describe('validateImageFile', () => {
    const mockImageFile = (name: string, sizeInBytes: number, type: string): File => {
      // Create actual content of the desired size
      const content = new ArrayBuffer(sizeInBytes);
      return new File([content], name, { type });
    };

    it('should accept valid JPEG file within size limit', () => {
      const file = mockImageFile('photo.jpg', 2 * 1024 * 1024, 'image/jpeg'); // 2MB
      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid PNG file', () => {
      const file = mockImageFile('photo.png', 1 * 1024 * 1024, 'image/png'); // 1MB
      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid WEBP file', () => {
      const file = mockImageFile('photo.webp', 500 * 1024, 'image/webp'); // 500KB
      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid GIF file', () => {
      const file = mockImageFile('photo.gif', 3 * 1024 * 1024, 'image/gif'); // 3MB
      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject file that exceeds size limit', () => {
      const maxSize = (MAX_IMAGE_SIZE_MB + 1) * 1024 * 1024; // 1 MB over limit
      const file = mockImageFile('huge.jpg', maxSize, 'image/jpeg');
      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('文件大小');
      expect(result.error).toContain(MAX_IMAGE_SIZE_MB.toString());
    });

    it('should reject non-image file type', () => {
      const file = mockImageFile('document.pdf', 1024 * 1024, 'application/pdf');
      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('不支持的文件格式');
    });

    it('should reject SVG files (not supported for photos)', () => {
      const file = mockImageFile('image.svg', 10 * 1024, 'image/svg+xml');
      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('不支持的文件格式');
    });

    it('should reject empty file', () => {
      const file = mockImageFile('empty.jpg', 0, 'image/jpeg');
      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('文件为空');
    });
  });

  describe('fileToBase64', () => {
    it('should convert file to base64 string', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const base64 = await fileToBase64(file);

      expect(typeof base64).toBe('string');
      expect(base64).toMatch(/^data:text\/plain;base64,/);
      // 'test content' in base64 is 'dGVzdCBjb250ZW50'
      expect(base64).toContain('dGVzdCBjb250ZW50');
    });

    it('should handle binary data correctly', async () => {
      // Create a small binary file
      const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0xff]);
      const blob = new Blob([binaryData], { type: 'application/octet-stream' });
      const file = new File([blob], 'binary.bin', { type: 'application/octet-stream' });

      const base64 = await fileToBase64(file);

      expect(base64).toMatch(/^data:application\/octet-stream;base64,/);
      expect(base64).toContain('AAECA/8='); // base64 of the binary data
    });

    it('should handle unicode content', async () => {
      const file = new File(['你好世界'], 'unicode.txt', { type: 'text/plain' });
      const base64 = await fileToBase64(file);

      expect(base64).toMatch(/^data:text\/plain;base64,/);
      // Should be a valid base64 string
      expect(() => atob(base64.split(',')[1])).not.toThrow();
    });

    it('should handle large files', async () => {
      // Create a 1MB file
      const largeContent = 'x'.repeat(1024 * 1024);
      const file = new File([largeContent], 'large.txt', { type: 'text/plain' });

      const base64 = await fileToBase64(file);

      expect(base64).toMatch(/^data:text\/plain;base64,/);
      expect(base64.length).toBeGreaterThan(1024 * 1024);
    });

    it('should handle empty file', async () => {
      const file = new File([''], 'empty.txt', { type: 'text/plain' });
      const base64 = await fileToBase64(file);

      expect(base64).toBe('data:text/plain;base64,');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1023)).toBe('1023 B');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1024 * 100)).toBe('100 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
      expect(formatFileSize(1024 * 1024 * 10)).toBe('10 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(1024 * 1024 * 1024 * 1.5)).toBe('1.5 GB');
    });

    it('should round to 1 decimal place', () => {
      const value = 1024 * 1024 * 1.234; // 1.234 MB
      expect(formatFileSize(value)).toBe('1.2 MB');

      const value2 = 1024 * 1.999; // 1.999 KB
      expect(formatFileSize(value2)).toBe('2 KB');
    });

    it('should handle very large numbers', () => {
      const hugeSize = 1024 * 1024 * 1024 * 1024 * 5; // 5 TB
      expect(formatFileSize(hugeSize)).toBe('5120 GB');
    });

    it('should handle negative numbers gracefully', () => {
      expect(formatFileSize(-100)).toBe('0 B');
    });

    it('should handle decimal precision edge cases', () => {
      expect(formatFileSize(1100)).toBe('1.1 KB');
      expect(formatFileSize(1150)).toBe('1.1 KB');
      expect(formatFileSize(1199)).toBe('1.2 KB');
    });
  });
});
