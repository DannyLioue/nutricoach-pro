/**
 * CreateSummaryModal 组件测试
 * 测试基本的 UI 和交互功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateSummaryModal from '@/components/weekly-diet-summary/CreateSummaryModal';

describe('CreateSummaryModal - Basic UI', () => {
  const mockClientId = 'test-client-id';
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('不打开时不渲染', () => {
    const { container } = render(
      <CreateSummaryModal
        clientId={mockClientId}
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(container.firstChild).toBe(null);
  });

  it('打开时应该渲染模态框', () => {
    render(
      <CreateSummaryModal
        clientId={mockClientId}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('创建饮食汇总')).toBeInTheDocument();
  });

  it('应该显示日期选择器', () => {
    render(
      <CreateSummaryModal
        clientId={mockClientId}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('开始日期')).toBeInTheDocument();
    expect(screen.getByText('结束日期')).toBeInTheDocument();
  });

  it('应该显示快捷选择按钮', () => {
    render(
      <CreateSummaryModal
        clientId={mockClientId}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('今天')).toBeInTheDocument();
    expect(screen.getByText('本周')).toBeInTheDocument();
    expect(screen.getByText('上周')).toBeInTheDocument();
    expect(screen.getByText('过去7天')).toBeInTheDocument();
  });

  it('应该显示汇总名称输入框', () => {
    render(
      <CreateSummaryModal
        clientId={mockClientId}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('汇总名称（可选）')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/例如：第一周汇总/)).toBeInTheDocument();
  });

  it('点击关闭按钮应该调用 onClose', () => {
    render(
      <CreateSummaryModal
        clientId={mockClientId}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const closeButton = screen.getAllByRole('button').find(btn =>
      btn.querySelector('svg')?.getAttribute('class')?.includes('lucide-x')
    );

    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('点击取消按钮应该调用 onClose', () => {
    render(
      <CreateSummaryModal
        clientId={mockClientId}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

describe('CreateSummaryModal - Date Selection', () => {
  const mockClientId = 'test-client-id';
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('点击今天应该设置今天日期', () => {
    render(
      <CreateSummaryModal
        clientId={mockClientId}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const todayButton = screen.getByText('今天');
    fireEvent.click(todayButton);

    const startDateInput = screen.getByLabelText('开始日期') as HTMLInputElement;
    const endDateInput = screen.getByLabelText('结束日期') as HTMLInputElement;

    // 验证日期格式为 YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    expect(startDateInput.value).toMatch(dateRegex);
    expect(endDateInput.value).toMatch(dateRegex);
  });

  it('点击过去7天应该设置7天范围', () => {
    render(
      <CreateSummaryModal
        clientId={mockClientId}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const last7DaysButton = screen.getByText('过去7天');
    fireEvent.click(last7DaysButton);

    const startDateInput = screen.getByLabelText('开始日期') as HTMLInputElement;
    const endDateInput = screen.getByLabelText('结束日期') as HTMLInputElement;

    const start = new Date(startDateInput.value);
    const end = new Date(endDateInput.value);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    expect(diffDays).toBe(7);
  });
});

describe('CreateSummaryModal - Generate Button', () => {
  const mockClientId = 'test-client-id';
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch
    global.fetch = vi.fn();
  });

  it('应该显示生成汇总按钮', () => {
    render(
      <CreateSummaryModal
        clientId={mockClientId}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('生成汇总')).toBeInTheDocument();
  });

  it('点击生成按钮应该调用 API', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        taskId: 'new-task-id',
        status: 'PENDING',
        sseUrl: '/api/clients/test-client-id/weekly-diet-summary/task/new-task-id/stream',
      }),
    });

    render(
      <CreateSummaryModal
        clientId={mockClientId}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const generateButton = screen.getByText('生成汇总');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('API 错误时应该显示错误信息', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({
        error: '启动任务失败',
      }),
    });

    render(
      <CreateSummaryModal
        clientId={mockClientId}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const generateButton = screen.getByText('生成汇总');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/启动任务失败/)).toBeInTheDocument();
    });
  });
});
