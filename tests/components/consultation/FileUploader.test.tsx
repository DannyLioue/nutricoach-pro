import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import FileUploader from '@/components/consultation/FileUploader';
import { validateImageFile, fileToBase64 } from '@/lib/utils/fileUtils';
import { validateTextFile, extractTextFromFile } from '@/lib/utils/textFileUtils';

vi.mock('@/lib/utils/fileUtils', () => ({
  validateImageFile: vi.fn(),
  fileToBase64: vi.fn(),
  formatFileSize: vi.fn((bytes: number) => `${bytes} bytes`),
  MAX_IMAGE_SIZE_MB: 5,
}));

vi.mock('@/lib/utils/textFileUtils', () => ({
  validateTextFile: vi.fn(),
  extractTextFromFile: vi.fn(),
  getTextFileType: vi.fn(() => 'txt'),
}));

describe('FileUploader', () => {
  const onFilesChange = vi.fn();

  function dropFiles(target: HTMLElement, files: File[]) {
    fireEvent.drop(target, {
      dataTransfer: { files },
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    (validateImageFile as any).mockReturnValue({ valid: true });
    (validateTextFile as any).mockReturnValue({ valid: true });
    (fileToBase64 as any).mockResolvedValue('data:base64,...');
    (extractTextFromFile as any).mockResolvedValue({
      success: true,
      content: 'mock text content',
    });
  });

  it('renders text/image hint and max files hint', () => {
    render(
      <FileUploader
        onFilesChange={onFilesChange}
        acceptedTypes={['image', 'text']}
        maxFiles={3}
      />
    );

    expect(screen.getByText(/JPG、PNG、WEBP、GIF/)).toBeInTheDocument();
    expect(screen.getByText(/TXT、MD、DOC、DOCX/)).toBeInTheDocument();
    expect(screen.getByText(/最多上传 3 个文件/)).toBeInTheDocument();
  });

  it('accepts text file and extracts content', async () => {
    render(
      <FileUploader
        onFilesChange={onFilesChange}
        acceptedTypes={['text']}
      />
    );

    const dropzone = screen.getByTestId('dropzone');
    const file = new File(['hello'], 'consultation.txt', { type: 'text/plain' });
    dropFiles(dropzone, [file]);

    await waitFor(() => {
      expect(validateTextFile).toHaveBeenCalledWith(file);
      expect(extractTextFromFile).toHaveBeenCalledWith(file);
      expect(onFilesChange).toHaveBeenCalledTimes(1);
    });
  });

  it('rejects unsupported format', async () => {
    render(
      <FileUploader
        onFilesChange={onFilesChange}
        acceptedTypes={['text']}
      />
    );

    const dropzone = screen.getByTestId('dropzone');
    const file = new File(['binary'], 'recording.mp3', { type: 'audio/mpeg' });
    dropFiles(dropzone, [file]);

    await waitFor(() => {
      expect(screen.getByText(/不支持的文件格式/)).toBeInTheDocument();
    });
  });

  it('enforces max files limit', async () => {
    render(
      <FileUploader
        onFilesChange={onFilesChange}
        acceptedTypes={['image']}
        maxFiles={1}
      />
    );

    const dropzone = screen.getByTestId('dropzone');
    const file1 = new File(['img1'], 'a.jpg', { type: 'image/jpeg' });
    const file2 = new File(['img2'], 'b.jpg', { type: 'image/jpeg' });
    dropFiles(dropzone, [file1]);

    await waitFor(() => expect(onFilesChange).toHaveBeenCalledTimes(1));

    dropFiles(dropzone, [file2]);

    await waitFor(() => {
      expect(screen.getByText(/已达到文件数量上限/)).toBeInTheDocument();
    });
  });
});
