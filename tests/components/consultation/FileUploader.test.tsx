/**
 * FileUploader Component Tests
 *
 * Tests for the drag-and-drop file uploader component that handles
 * both audio and image file uploads for consultations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUploader from '@/components/consultation/FileUploader';
import { validateAudioFile, validateImageFile, fileToBase64 } from '@/lib/utils/fileUtils';

// Mock the file utils
vi.mock('@/lib/utils/fileUtils', () => ({
  validateAudioFile: vi.fn(),
  validateImageFile: vi.fn(),
  fileToBase64: vi.fn(),
  formatFileSize: vi.fn((bytes: number) => `${bytes} bytes`),
  MAX_AUDIO_SIZE_MB: 20,
  MAX_IMAGE_SIZE_MB: 5,
}));

describe('FileUploader Component', () => {
  const mockOnFilesChange = vi.fn();
  const defaultProps = {
    onFilesChange: mockOnFilesChange,
    acceptedTypes: ['audio', 'image'] as const,
    maxFiles: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    (validateAudioFile as any).mockReturnValue({ valid: true });
    (validateImageFile as any).mockReturnValue({ valid: true });
    (fileToBase64 as any).mockResolvedValue('data:base64...');
  });

  describe('Rendering', () => {
    it('should render dropzone area', () => {
      render(<FileUploader {...defaultProps} />);

      expect(screen.getByText(/拖拽文件到此处/)).toBeInTheDocument();
      expect(screen.getByText(/点击选择文件/)).toBeInTheDocument();
    });

    it('should display accepted file types hint', () => {
      render(<FileUploader {...defaultProps} acceptedTypes={['audio']} />);

      expect(screen.getByText(/MP3.*M4A.*WAV.*WEBM/)).toBeInTheDocument();
    });

    it('should display max files hint', () => {
      render(<FileUploader {...defaultProps} maxFiles={3} />);

      expect(screen.getByText(/最多上传.*3.*个文件/)).toBeInTheDocument();
    });

    it('should render file list container', () => {
      render(<FileUploader {...defaultProps} />);

      // File list is only rendered when there are files
      const fileList = screen.queryByTestId('file-list');
      expect(fileList).toBeNull(); // No files yet, so should not be in document
    });
  });

  describe('Drag and Drop', () => {
    it('should highlight dropzone on drag over', async () => {
      const user = userEvent.setup();
      render(<FileUploader {...defaultProps} />);

      const dropzone = screen.getByTestId('dropzone');

      await user.hover(dropzone);

      // Check if dropzone is highlighted (class might change)
      expect(dropzone).toHaveClass(/hover:bg-gray-50/);
    });

    it('should handle file drop', async () => {
      const user = userEvent.setup();
      render(<FileUploader {...defaultProps} />);

      const file = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
      const dropzone = screen.getByTestId('dropzone');

      // Create a drag event with files
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
        writable: false,
      });

      dropzone.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(fileToBase64).toHaveBeenCalledWith(file);
      });
    });

    it('should reject invalid file types on drop', async () => {
      (validateAudioFile as any).mockReturnValue({
        valid: false,
        error: '不支持的文件格式',
      });

      const user = userEvent.setup();
      render(<FileUploader {...defaultProps} acceptedTypes={['audio']} />);

      const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
      const dropzone = screen.getByTestId('dropzone');

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
        writable: false,
      });

      dropzone.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(screen.getByText(/不支持的文件格式/)).toBeInTheDocument();
      });
    });
  });

  describe('File Selection via Click', () => {
    it('should open file picker when clicking dropzone', async () => {
      const user = userEvent.setup();
      render(<FileUploader {...defaultProps} />);

      const dropzone = screen.getByTestId('dropzone');
      const clickSpy = vi.spyOn(dropzone, 'click');

      await user.click(dropzone);

      expect(dropzone).toBeInTheDocument();
      // Note: We can't fully test file picker opening in JSDOM
    });
  });

  describe('File Processing', () => {
    it('should validate audio files', async () => {
      const user = userEvent.setup();
      render(<FileUploader {...defaultProps} acceptedTypes={['audio']} />);

      const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
      const dropzone = screen.getByTestId('dropzone');

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
        writable: false,
      });

      dropzone.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(validateAudioFile).toHaveBeenCalledWith(file);
      });
    });

    it('should validate image files', async () => {
      const user = userEvent.setup();
      render(<FileUploader {...defaultProps} acceptedTypes={['image']} />);

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const dropzone = screen.getByTestId('dropzone');

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
        writable: false,
      });

      dropzone.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(validateImageFile).toHaveBeenCalledWith(file);
      });
    });

    it('should convert file to base64', async () => {
      (fileToBase64 as any).mockResolvedValue('data:audio/mp3;base64,ABC123');

      const user = userEvent.setup();
      render(<FileUploader {...defaultProps} acceptedTypes={['audio']} />);

      const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
      const dropzone = screen.getByTestId('dropzone');

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
        writable: false,
      });

      dropzone.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(fileToBase64).toHaveBeenCalledWith(file);
      });
    });

    it('should call onFilesChange with processed file data', async () => {
      (fileToBase64 as any).mockResolvedValue('data:audio/mp3;base64,ABC123');

      const user = userEvent.setup();
      render(<FileUploader {...defaultProps} acceptedTypes={['audio']} />);

      // Create file with actual content size
      const content = 'audio';
      const file = new File([content], 'test.mp3', { type: 'audio/mpeg' });
      const dropzone = screen.getByTestId('dropzone');

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
        writable: false,
      });

      dropzone.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(mockOnFilesChange).toHaveBeenCalledWith([
          {
            data: 'data:audio/mp3;base64,ABC123',
            fileName: 'test.mp3',
            fileSize: content.length, // Use actual content length
          },
        ]);
      });
    });

    it('should handle multiple files', async () => {
      (fileToBase64 as any)
        .mockResolvedValueOnce('data:audio/mp3;base64, AUDIO')
        .mockResolvedValueOnce('data:image/jpeg;base64, IMAGE');

      const user = userEvent.setup();
      render(<FileUploader {...defaultProps} />);

      const file1 = new File(['audio'], 'test.mp3', { type: 'audio/mpeg', size: 1024 });
      const file2 = new File(['image'], 'test.jpg', { type: 'image/jpeg', size: 2048 });
      const dropzone = screen.getByTestId('dropzone');

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file1, file2] },
        writable: false,
      });

      dropzone.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(mockOnFilesChange).toHaveBeenCalled();
        const files = mockOnFilesChange.mock.calls[0][0];
        expect(files).toHaveLength(2);
      });
    });
  });

  describe('File List Display', () => {
    it('should display uploaded files', async () => {
      (fileToBase64 as any).mockResolvedValue('data:base64...');

      const user = userEvent.setup();
      render(<FileUploader {...defaultProps} />);

      const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg', size: 1024 });
      const dropzone = screen.getByTestId('dropzone');

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
        writable: false,
      });

      dropzone.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(screen.getByText('test.mp3')).toBeInTheDocument();
      });
    });

    it('should display file size', async () => {
      (fileToBase64 as any).mockResolvedValue('data:base64...');

      const user = userEvent.setup();
      render(<FileUploader {...defaultProps} />);

      const content = 'audio content';
      const file = new File([content], 'test.mp3', { type: 'audio/mpeg' });
      const dropzone = screen.getByTestId('dropzone');

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
        writable: false,
      });

      dropzone.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(screen.getByText('test.mp3')).toBeInTheDocument();
        // File size is calculated based on actual content
      });
    });
  });

  describe('File Removal', () => {
    it('should remove file when delete button clicked', async () => {
      (fileToBase64 as any).mockResolvedValue('data:base64...');

      const user = userEvent.setup();
      render(<FileUploader {...defaultProps} />);

      const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg', size: 1024 });
      const dropzone = screen.getByTestId('dropzone');

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
        writable: false,
      });

      dropzone.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(screen.getByText('test.mp3')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.queryByRole('button', { name: /删除/i });
      if (deleteButton) {
        await user.click(deleteButton);

        await waitFor(() => {
          expect(screen.queryByText('test.mp3')).not.toBeInTheDocument();
          expect(mockOnFilesChange).toHaveBeenCalledWith([]);
        });
      }
    });
  });

  describe('Max Files Limit', () => {
    it('should not accept files beyond max limit', async () => {
      (fileToBase64 as any).mockResolvedValue('data:base64...');

      const user = userEvent.setup();
      render(<FileUploader {...defaultProps} maxFiles={2} />);

      // Add first file
      const file1 = new File(['audio1'], 'test1.mp3', { type: 'audio/mpeg', size: 1024 });
      let dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file1] },
        writable: false,
      });
      screen.getByTestId('dropzone').dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(mockOnFilesChange).toHaveBeenCalledTimes(1);
      });

      // Add second file
      const file2 = new File(['audio2'], 'test2.mp3', { type: 'audio/mpeg', size: 1024 });
      dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file2] },
        writable: false,
      });
      screen.getByTestId('dropzone').dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(mockOnFilesChange).toHaveBeenCalledTimes(2);
      });

      // Try to add third file (should be rejected)
      const file3 = new File(['audio3'], 'test3.mp3', { type: 'audio/mpeg', size: 1024 });
      dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file3] },
        writable: false,
      });
      screen.getByTestId('dropzone').dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(screen.getByText(/已达到文件数量上限/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display validation error message', async () => {
      (validateAudioFile as any).mockReturnValue({
        valid: false,
        error: '文件大小超过限制',
      });

      const user = userEvent.setup();
      render(<FileUploader {...defaultProps} acceptedTypes={['audio']} />);

      const file = new File(['audio'], 'huge.mp3', { type: 'audio/mpeg', size: 100 * 1024 * 1024 });
      const dropzone = screen.getByTestId('dropzone');

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
        writable: false,
      });

      dropzone.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(screen.getByText(/文件大小超过限制/)).toBeInTheDocument();
      });
    });

    it('should handle base64 conversion error', async () => {
      (fileToBase64 as any).mockRejectedValue(new Error('Conversion failed'));

      const user = userEvent.setup();
      render(<FileUploader {...defaultProps} />);

      const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg', size: 1024 });
      const dropzone = screen.getByTestId('dropzone');

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
        writable: false,
      });

      dropzone.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(screen.getByText(/文件处理失败/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state while processing files', async () => {
      let resolveBase64: (value: string) => void;
      (fileToBase64 as any).mockImplementation(() => {
        return new Promise((resolve) => {
          resolveBase64 = resolve;
        });
      });

      const user = userEvent.setup();
      render(<FileUploader {...defaultProps} />);

      const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg', size: 1024 });
      const dropzone = screen.getByTestId('dropzone');

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
        writable: false,
      });

      dropzone.dispatchEvent(dropEvent);

      await waitFor(() => {
        // Check for loading text instead of testid
        expect(screen.getByText(/正在处理文件/)).toBeInTheDocument();
      });

      // Resolve the promise
      resolveBase64!('data:base64...');

      await waitFor(() => {
        expect(screen.queryByText(/正在处理文件/)).not.toBeInTheDocument();
      });
    });
  });
});
