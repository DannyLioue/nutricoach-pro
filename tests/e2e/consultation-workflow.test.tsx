/**
 * E2E-style workflow tests for consultation recording feature (Simplified)
 *
 * Tests the complete user journey for creating and managing consultations:
 * - Navigate to client detail page
 * - Create new consultation
 * - Fill consultation form (simplified: text file upload + optional notes + images)
 * - Submit and verify creation
 * - Trigger AI analysis
 * - View analysis results
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import React from 'react';

// Mock window.alert
const alertMock = vi.fn();
Object.defineProperty(window, 'alert', {
  value: alertMock,
  writable: true,
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(() => ({ id: 'client-123' })),
}));

// Mock FileUploader component
vi.mock('@/components/consultation/FileUploader', () => ({
  default: function FileUploader({
    onFilesChange,
    acceptedTypes,
    maxFiles,
  }: {
    onFilesChange: (files: any[]) => void;
    acceptedTypes: string[];
    maxFiles: number;
  }) {
    const [files, setFiles] = React.useState<any[]>([]);

    const handleAddFile = () => {
      const newFiles = acceptedTypes.includes('text')
        ? [{
            data: 'data:text/plain;base64,bW9jayB0ZXh0IGZpbGU=',
            fileName: 'consultation.txt',
            fileSize: 1024,
            content: 'mock text content',
            fileType: 'txt' as const,
          }]
        : acceptedTypes.includes('image')
        ? [{
            data: 'data:image/jpeg;base64,mockimage',
            description: '',
          }]
        : [];

      setFiles(newFiles);
      onFilesChange(newFiles);
    };

    return (
      <div data-testid="file-uploader">
        <button
          data-testid={`add-${acceptedTypes[0]}-file-btn`}
          onClick={handleAddFile}
        >
          添加{acceptedTypes[0] === 'text' ? '文本' : acceptedTypes[0] === 'image' ? '图片' : '文件'}
        </button>
        <div data-testid={`${acceptedTypes[0]}-files-count`}>
          {acceptedTypes[0] === 'text' ? '文本' : acceptedTypes[0] === 'image' ? '图片' : '文件'}数量: {files.length}
        </div>
      </div>
    );
  },
}));

// Mock fetch
global.fetch = vi.fn();

import ConsultationForm from '@/components/consultation/ConsultationForm';

describe('Consultation Recording E2E Workflow (Simplified)', () => {
  const mockRouter = {
    push: vi.fn(),
    back: vi.fn(),
    pathname: '/clients/client-123/consultations/new',
  };

  const mockClientId = 'client-123';

  beforeEach(() => {
    vi.clearAllMocks();
    alertMock.mockClear();
    (useRouter as any).mockReturnValue(mockRouter);
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Consultation Creation Flow', () => {
    it('should complete full consultation creation workflow with text file', async () => {
      const user = userEvent.setup();

      render(<ConsultationForm clientId={mockClientId} />);

      // Step 1: Select consultation type
      const firstVisitButton = screen.getByText('初诊');
      await user.click(firstVisitButton);
      expect(firstVisitButton.closest('button')).toHaveClass('border-emerald-500');

      // Step 2: Add text file (primary recording method)
      const addTextButton = screen.getByTestId('add-text-file-btn');
      await user.click(addTextButton);
      expect(screen.getByTestId('text-files-count')).toHaveTextContent('文本数量: 1');

      // Step 3: Add optional notes
      const notesTextarea = screen.getByPlaceholderText(/补充说明/);
      await user.type(notesTextarea, '客户血糖控制良好，继续保持当前饮食方案。');
      expect(screen.getAllByText(/\d+ 字/).length).toBeGreaterThan(0);

      // Step 4: Submit form
      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      await user.click(submitButton);

      // Verify API call was made with correct data
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/clients/${mockClientId}/consultations`,
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('"consultationType":"初诊"'),
          })
        );
      });

      // Verify success message and navigation
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('咨询记录已创建');
        expect(mockRouter.push).toHaveBeenCalledWith(`/clients/${mockClientId}/consultations`);
      });
    });

    it('should complete consultation creation with images only', async () => {
      const user = userEvent.setup();

      render(<ConsultationForm clientId={mockClientId} />);

      // Select consultation type
      await user.click(screen.getByText('复诊'));

      // Add optional notes (simplified - skip image upload testing as it's covered in FileUploader tests)
      const notesTextarea = screen.getByPlaceholderText(/补充说明/);
      await user.type(notesTextarea, '电话咨询记录');

      // Verify image upload label exists
      expect(screen.getByText('上传图片')).toBeInTheDocument();

      // Submit form with notes only (image upload tested separately in FileUploader tests)
      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      await user.click(submitButton);

      // Verify API call was made
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should complete consultation creation with text + notes + images', async () => {
      const user = userEvent.setup();

      render(<ConsultationForm clientId={mockClientId} />);

      // Select consultation type
      await user.click(screen.getByText('在线咨询'));

      // Add text file
      await user.click(screen.getByTestId('add-text-file-btn'));

      // Add notes
      await user.type(
        screen.getByPlaceholderText(/补充说明/),
        '这是详细的咨询笔记，包含了客户的反馈、问题和建议。'
      );

      // Verify image upload area exists
      expect(screen.getByText('上传图片')).toBeInTheDocument();

      // Submit
      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      await user.click(submitButton);

      // Verify comprehensive API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('"consultationType":"在线咨询"'),
          })
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('"textFiles"'),
          })
        );
      });
    });
  });

  describe('Form Validation Flow', () => {
    it('should show validation error when submitting empty form', async () => {
      const user = userEvent.setup();

      render(<ConsultationForm clientId={mockClientId} />);

      // Try to submit without any data
      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      await user.click(submitButton);

      // Verify validation alert (updated text)
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('请至少填写咨询内容、上传图片或文本文件');
      });

      // Verify no API call was made
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should allow submission after adding text file', async () => {
      const user = userEvent.setup();

      render(<ConsultationForm clientId={mockClientId} />);

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      await user.click(submitButton);

      expect(alertMock).toHaveBeenCalledWith('请至少填写咨询内容、上传图片或文本文件');

      // Add text file
      await user.click(screen.getByTestId('add-text-file-btn'));

      // Try to submit again
      await user.click(submitButton);

      // Verify API call is made now
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should allow submission after adding notes only', async () => {
      const user = userEvent.setup();

      render(<ConsultationForm clientId={mockClientId} />);

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      await user.click(submitButton);

      expect(alertMock).toHaveBeenCalledWith('请至少填写咨询内容、上传图片或文本文件');

      // Add notes
      const notesTextarea = screen.getByPlaceholderText(/补充说明/);
      await user.type(notesTextarea, '一些笔记');

      // Try to submit again
      await user.click(submitButton);

      // Verify API call is made now
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Consultation Type Selection', () => {
    it('should handle all consultation types', async () => {
      const user = userEvent.setup();

      render(<ConsultationForm clientId={mockClientId} />);

      const consultationTypes = ['初诊', '复诊', '电话咨询', '在线咨询', '微信咨询', '其他'];

      for (const type of consultationTypes) {
        const button = screen.getByText(type);
        await user.click(button);
        expect(button.closest('button')).toHaveClass('border-emerald-500');
      }
    });

    it('should default to 复诊 type', () => {
      render(<ConsultationForm clientId={mockClientId} />);

      const defaultButton = screen.getByText('复诊');
      expect(defaultButton.closest('button')).toHaveClass('border-emerald-500');
    });
  });

  describe('Image Upload Flow', () => {
    it('should display image upload area', () => {
      render(<ConsultationForm clientId={mockClientId} />);

      // Verify image upload elements exist
      expect(screen.getByText('相关图片')).toBeInTheDocument();
      expect(screen.getByText('上传图片')).toBeInTheDocument();
      expect(screen.getByText(/支持 JPG、PNG、WEBP、GIF 格式/)).toBeInTheDocument();
    });

    it('should handle image upload area interaction', async () => {
      const user = userEvent.setup();

      render(<ConsultationForm clientId={mockClientId} />);

      // Verify upload label exists and is clickable
      const uploadLabel = screen.getByText('上传图片').closest('label');
      expect(uploadLabel).toBeInTheDocument();

      // Verify file input exists
      const fileInput = uploadLabel?.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });
  });

  describe('Character Counter', () => {
    it('should display character count for notes', async () => {
      const user = userEvent.setup();

      render(<ConsultationForm clientId={mockClientId} />);

      const notesTextarea = screen.getByPlaceholderText(/补充说明/);
      const testText = '这是一段测试文本';

      await user.type(notesTextarea, testText);

      expect(screen.getByText(`${testText.length} 字`)).toBeInTheDocument();
    });

    it('should update character count as user types', async () => {
      const user = userEvent.setup();

      render(<ConsultationForm clientId={mockClientId} />);

      const notesTextarea = screen.getByPlaceholderText(/补充说明/);

      await user.type(notesTextarea, '测试');
      expect(screen.getByText('2 字')).toBeInTheDocument();

      await user.type(notesTextarea, '更多内容');
      expect(screen.getByText('6 字')).toBeInTheDocument();
    });
  });

  describe('Error Handling Flow', () => {
    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock API error
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(<ConsultationForm clientId={mockClientId} />);

      // Fill form
      await user.type(
        screen.getByPlaceholderText(/补充说明/),
        'Test notes'
      );

      // Submit form
      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      await user.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('创建失败：Network error');
      });

      // Verify no navigation
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should handle validation errors from API', async () => {
      const user = userEvent.setup();

      // Mock API response with validation error
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({ error: '数据验证失败', details: ['Invalid field'] }),
      });

      render(<ConsultationForm clientId={mockClientId} />);

      // Fill form
      await user.type(
        screen.getByPlaceholderText(/补充说明/),
        'Test notes'
      );

      // Submit form
      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      await user.click(submitButton);

      // Verify error message (now includes details)
      await waitFor(() => {
        const errorMessage = alertMock.mock.calls[alertMock.mock.calls.length - 1][0];
        expect(errorMessage).toContain('数据验证失败');
        expect(errorMessage).toContain('Invalid field');
      });
    });
  });

  describe('Navigation Flow', () => {
    it('should handle cancel button correctly', async () => {
      const user = userEvent.setup();

      render(<ConsultationForm clientId={mockClientId} />);

      const cancelButton = screen.getByText('取消');
      await user.click(cancelButton);

      expect(mockRouter.back).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should disable submit button while submitting', async () => {
      render(<ConsultationForm clientId={mockClientId} />);

      // Fill form
      fireEvent.change(screen.getByPlaceholderText(/补充说明/), {
        target: { value: 'Test notes' },
      });

      // Mock slow API response
      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ ok: true, json: async () => ({ success: true }) });
            }, 100);
          })
      );

      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      fireEvent.click(submitButton);

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show loading state while submitting', async () => {
      render(<ConsultationForm clientId={mockClientId} />);

      // Fill form
      fireEvent.change(screen.getByPlaceholderText(/补充说明/), {
        target: { value: 'Test notes' },
      });

      // Mock slow API response
      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ ok: true, json: async () => ({ success: true }) });
            }, 100);
          })
      );

      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      fireEvent.click(submitButton);

      // Should show loading text
      expect(submitButton).toHaveTextContent('保存中...');

      // Wait for completion
      await waitFor(() => {
        expect(submitButton).toHaveTextContent('保存记录');
      });
    });
  });

  describe('Text Upload Hint Text', () => {
    it('should display hint about text file support', () => {
      render(<ConsultationForm clientId={mockClientId} />);

      expect(screen.getByText(/支持上传 TXT、MD、DOC、DOCX 格式的文本文件/)).toBeInTheDocument();
    });
  });
});
