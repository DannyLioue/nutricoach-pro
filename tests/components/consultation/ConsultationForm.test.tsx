/**
 * Unit tests for ConsultationForm component (Simplified)
 *
 * Tests the simplified consultation recording form including:
 * - Consultation type selection
 * - Text file upload (via FileUploader)
 * - Optional session notes
 * - Image upload
 * - Form validation and submission
 *
 * Note: FileUploader component has its own comprehensive test suite
 * This file focuses on ConsultationForm integration and state management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConsultationForm from '@/components/consultation/ConsultationForm';

// Mock Next.js router
const mockRouter = { push: vi.fn(), back: vi.fn() };
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
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
      </div>
    );
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('ConsultationForm Component (Simplified)', () => {
  const mockClientId = 'client-123';

  // Mock window.alert
  const originalAlert = window.alert;
  beforeEach(() => {
    vi.clearAllMocks();
    mockRouter.push.mockClear();
    mockRouter.back.mockClear();
    window.alert = vi.fn();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        consultation: { id: 'new-consultation-123' },
      }),
    });
  });

  afterEach(() => {
    window.alert = originalAlert;
  });

  describe('Component Rendering', () => {
    it('should render the consultation form', () => {
      render(<ConsultationForm clientId={mockClientId} />);

      expect(screen.getByText('咨询类型')).toBeInTheDocument();
      expect(screen.getByText('备注说明')).toBeInTheDocument();
      expect(screen.getByText('相关图片')).toBeInTheDocument();
    });

    it('should render consultation type buttons', () => {
      render(<ConsultationForm clientId={mockClientId} />);

      const types = ['初诊', '复诊', '电话咨询', '在线咨询', '微信咨询', '其他'];
      types.forEach(type => {
        expect(screen.getByText(type)).toBeInTheDocument();
      });
    });

    it('should render text file upload area', () => {
      render(<ConsultationForm clientId={mockClientId} />);

      expect(screen.getByTestId('file-uploader')).toBeInTheDocument();
    });

    it('should display hint about text file support', () => {
      render(<ConsultationForm clientId={mockClientId} />);

      expect(screen.getByText(/支持上传 TXT、MD、DOC、DOCX 格式的文本文件/)).toBeInTheDocument();
    });

    it('should render image upload button', () => {
      render(<ConsultationForm clientId={mockClientId} />);

      expect(screen.getByText('上传图片')).toBeInTheDocument();
      expect(screen.getByText(/支持 JPG、PNG、WEBP、GIF 格式/)).toBeInTheDocument();
    });
  });

  describe('Consultation Type Selection', () => {
    it('should select nutritionist type by default', () => {
      render(<ConsultationForm clientId={mockClientId} />);

      const defaultButton = screen.getByText('复诊');
      expect(defaultButton.closest('button')).toHaveClass('border-emerald-500');
    });

    it('should change consultation type when clicked', async () => {
      const user = vi.fn();
      render(<ConsultationForm clientId={mockClientId} />);

      const 初诊Button = screen.getByText('初诊');
      fireEvent.click(初诊Button);

      expect(初诊Button.closest('button')).toHaveClass('border-emerald-500');
    });
  });

  describe('Session Notes Input', () => {
    it('should update session notes when typed', async () => {
      render(<ConsultationForm clientId={mockClientId} />);

      const textarea = screen.getByPlaceholderText(/补充说明/);
      fireEvent.change(textarea, { target: { value: 'Test notes' } });

      expect(textarea).toHaveValue('Test notes');
    });

    it('should display character count', async () => {
      render(<ConsultationForm clientId={mockClientId} />);

      const textarea = screen.getByPlaceholderText(/补充说明/);
      fireEvent.change(textarea, { target: { value: 'Test notes' } });

      expect(screen.getByText('10 字')).toBeInTheDocument();
    });

    it('should update character count as user types', async () => {
      render(<ConsultationForm clientId={mockClientId} />);

      const textarea = screen.getByPlaceholderText(/补充说明/);

      fireEvent.change(textarea, { target: { value: 'Test' } });
      expect(screen.getByText('4 字')).toBeInTheDocument();

      fireEvent.change(textarea, { target: { value: 'Test notes' } });
      expect(screen.getByText('10 字')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show alert when submitting with empty fields', async () => {
      render(<ConsultationForm clientId={mockClientId} />);

      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      fireEvent.click(submitButton);

      expect(window.alert).toHaveBeenCalledWith('请至少填写咨询内容、上传图片或文本文件');
    });

    it('should allow submission with only session notes', async () => {
      render(<ConsultationForm clientId={mockClientId} />);

      const textarea = screen.getByPlaceholderText(/补充说明/);
      fireEvent.change(textarea, { target: { value: 'Some notes' } });

      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should allow submission with only text files', async () => {
      render(<ConsultationForm clientId={mockClientId} />);

      fireEvent.click(screen.getByTestId('add-text-file-btn'));

      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with all data', async () => {
      render(<ConsultationForm clientId={mockClientId} />);

      // Select consultation type
      fireEvent.click(screen.getByText('初诊'));

      // Add text file
      fireEvent.click(screen.getByTestId('add-text-file-btn'));

      // Add notes
      const textarea = screen.getByPlaceholderText(/补充说明/);
      fireEvent.change(textarea, { target: { value: 'Test notes' } });

      // Submit
      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      fireEvent.click(submitButton);

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
    });

    it('should show success message on successful submission', async () => {
      render(<ConsultationForm clientId={mockClientId} />);

      const textarea = screen.getByPlaceholderText(/补充说明/);
      fireEvent.change(textarea, { target: { value: 'Test notes' } });

      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('咨询记录已创建');
      });
    });

    it('should navigate to consultation detail page after successful submission', async () => {
      render(<ConsultationForm clientId={mockClientId} />);

      const textarea = screen.getByPlaceholderText(/补充说明/);
      fireEvent.change(textarea, { target: { value: 'Test notes' } });

      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(`/clients/${mockClientId}/consultations/new-consultation-123`);
      });
    });

    it('should show error message on failed submission', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({ error: '创建失败' }),
      });

      render(<ConsultationForm clientId={mockClientId} />);

      const textarea = screen.getByPlaceholderText(/补充说明/);
      fireEvent.change(textarea, { target: { value: 'Test notes' } });

      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('创建失败：创建失败');
      });
    });

    it('should handle network error', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(<ConsultationForm clientId={mockClientId} />);

      const textarea = screen.getByPlaceholderText(/补充说明/);
      fireEvent.change(textarea, { target: { value: 'Test notes' } });

      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('创建失败：Network error');
      });
    });

    it('should disable submit button while submitting', async () => {
      render(<ConsultationForm clientId={mockClientId} />);

      const textarea = screen.getByPlaceholderText(/补充说明/);
      fireEvent.change(textarea, { target: { value: 'Test notes' } });

      // Mock slow API response
      (global.fetch as any).mockImplementation(
        () => new Promise((resolve) => {
          setTimeout(() => {
            resolve({ ok: true, json: async () => ({ success: true }) });
          }, 100);
        })
      );

      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show "保存中..." while submitting', async () => {
      render(<ConsultationForm clientId={mockClientId} />);

      const textarea = screen.getByPlaceholderText(/补充说明/);
      fireEvent.change(textarea, { target: { value: 'Test notes' } });

      // Mock slow API response
      (global.fetch as any).mockImplementation(
        () => new Promise((resolve) => {
          setTimeout(() => {
            resolve({ ok: true, json: async () => ({ success: true }) });
          }, 100);
        })
      );

      const submitButton = screen.getByRole('button', { name: /保存记录/ });
      fireEvent.click(submitButton);

      expect(submitButton).toHaveTextContent('保存中...');

      await waitFor(() => {
        expect(submitButton).toHaveTextContent('保存记录');
      });
    });
  });

  describe('Cancel Button', () => {
    it('should call router.back when cancel is clicked', () => {
      render(<ConsultationForm clientId={mockClientId} />);

      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('should not submit form when cancel is clicked', () => {
      render(<ConsultationForm clientId={mockClientId} />);

      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
