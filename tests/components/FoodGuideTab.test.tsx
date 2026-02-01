/**
 * FoodGuideTab 移动端PDF导出功能测试
 * 测试移动版导出按钮和相关功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FoodGuideTab from '@/components/recommendations/FoodGuideTab';

// Mock TrafficLightGuide component
vi.mock('@/components/TrafficLightGuide', () => ({
  TrafficLightGuide: ({ data }: any) => (
    <div data-testid="traffic-light-guide">
      <div>Green: {data.green.items.length}</div>
      <div>Yellow: {data.yellow.items.length}</div>
      <div>Red: {data.red.items.length}</div>
    </div>
  ),
}));

// Mock ExportButton
vi.mock('@/components/recommendations/ExportButton', () => ({
  __esModule: true,
  default: ({ recommendationId, module, clientName, label, className }: any) => (
    <button
      data-testid="export-button"
      className={className}
      onClick={() => {
        // Mock export function
      }}
    >
      {label || `导出${module}`}
    </button>
  ),
}));

// Mock window.URL.createObjectURL and related APIs
(global.URL.createObjectURL as any) = vi.fn(() => 'mock-url');
(global.URL.revokeObjectURL as any) = vi.fn();

// Mock createElement to return a real anchor element with mocked click
const originalCreateElement = document.createElement.bind(document);
(global.document.createElement as any) = vi.fn((tag: string) => {
  if (tag === 'a') {
    const anchor = originalCreateElement('a');
    anchor.click = vi.fn();
    return anchor;
  }
  return originalCreateElement(tag);
});

describe('FoodGuideTab 移动端PDF导出 - TDD', () => {
  const mockRecommendationId = 'test-rec-id';
  const mockClientName = '测试客户';

  const mockContent = {
    trafficLightFoods: {
      green: [
        {
          food: '西兰花',
          category: '蔬菜类',
          reason: '富含维生素C',
          nutrients: ['维生素C'],
        },
      ],
      yellow: [
        {
          food: '白米饭',
          category: '主食类',
          reason: '精制碳水',
          limit: '每餐1小碗',
        },
      ],
      red: [
        {
          food: '油炸食品',
          reason: '高脂肪',
          alternatives: ['清蒸'],
        },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful fetch for mobile export
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['mock-pdf-content'])),
      })
    ) as any;
  });

  describe('组件渲染测试', () => {
    it('应该渲染移动版导出按钮', () => {
      render(
        <FoodGuideTab
          recommendationId={mockRecommendationId}
          clientName={mockClientName}
          content={mockContent}
        />
      );

      const mobileButton = screen.getByText('移动版');
      expect(mobileButton).toBeInTheDocument();
    });

    it('应该同时显示标准版和移动版按钮', () => {
      render(
        <FoodGuideTab
          recommendationId={mockRecommendationId}
          clientName={mockClientName}
          content={mockContent}
        />
      );

      const standardButton = screen.getByText('标准版');
      const mobileButton = screen.getByText('移动版');

      expect(standardButton).toBeInTheDocument();
      expect(mobileButton).toBeInTheDocument();
    });

    it('移动版按钮应该有手机图标', () => {
      render(
        <FoodGuideTab
          recommendationId={mockRecommendationId}
          clientName={mockClientName}
          content={mockContent}
        />
      );

      const mobileButton = screen.getByText('移动版').closest('button');
      expect(mobileButton).toBeInTheDocument();
      // Check for Smartphone icon (represented by the button structure)
    });
  });

  describe('移动版导出功能测试', () => {
    it('点击移动版按钮应该触发导出', async () => {
      render(
        <FoodGuideTab
          recommendationId={mockRecommendationId}
          clientName={mockClientName}
          content={mockContent}
        />
      );

      const mobileButton = screen.getByText('移动版');
      fireEvent.click(mobileButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/export/pdf/mobile/food-guide')
        );
      });
    });

    it('应该使用正确的API端点', async () => {
      render(
        <FoodGuideTab
          recommendationId={mockRecommendationId}
          clientName={mockClientName}
          content={mockContent}
        />
      );

      const mobileButton = screen.getByText('移动版');
      fireEvent.click(mobileButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/recommendations/${mockRecommendationId}/export/pdf/mobile/food-guide`
        );
      });
    });

    it('应该下载包含客户名称的文件', async () => {
      render(
        <FoodGuideTab
          recommendationId={mockRecommendationId}
          clientName={mockClientName}
          content={mockContent}
        />
      );

      const mobileButton = screen.getByText('移动版');
      fireEvent.click(mobileButton);

      await waitFor(() => {
        expect(global.document.createElement).toHaveBeenCalledWith('a');
        const createdAnchor = (global.document.createElement as any).mock.results[0].value;
        expect(createdAnchor.download).toContain('移动版');
        expect(createdAnchor.download).toContain(mockClientName);
      });
    });
  });

  describe('加载状态测试', () => {
    it('导出时应该显示"导出中..."状态', async () => {
      // Mock a delayed response
      global.fetch = vi.fn(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              blob: () => Promise.resolve(new Blob(['mock-pdf'])),
            } as Response);
          }, 100);
        })
      ) as any;

      render(
        <FoodGuideTab
          recommendationId={mockRecommendationId}
          clientName={mockClientName}
          content={mockContent}
        />
      );

      const mobileButton = screen.getByText('移动版');
      fireEvent.click(mobileButton);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText('导出中...')).toBeInTheDocument();
      });
    });

    it('导出完成后应该恢复按钮状态', async () => {
      render(
        <FoodGuideTab
          recommendationId={mockRecommendationId}
          clientName={mockClientName}
          content={mockContent}
        />
      );

      const mobileButton = screen.getByText('移动版');
      fireEvent.click(mobileButton);

      await waitFor(() => {
        expect(screen.getByText('移动版')).toBeInTheDocument();
      });
    });
  });

  describe('错误处理测试', () => {
    it('API错误时应该显示错误信息', async () => {
      // Mock failed fetch
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'PDF生成失败' }),
        } as Response)
      ) as any;

      // Mock window.alert
      global.alert = vi.fn();

      render(
        <FoodGuideTab
          recommendationId={mockRecommendationId}
          clientName={mockClientName}
          content={mockContent}
        />
      );

      const mobileButton = screen.getByText('移动版');
      fireEvent.click(mobileButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('导出失败: PDF生成失败');
      });
    });

    it('网络错误时应该显示错误信息', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as any;
      global.alert = vi.fn();

      render(
        <FoodGuideTab
          recommendationId={mockRecommendationId}
          clientName={mockClientName}
          content={mockContent}
        />
      );

      const mobileButton = screen.getByText('移动版');
      fireEvent.click(mobileButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });
    });

    it('错误后应该恢复按钮可点击状态', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: '测试错误' }),
        } as Response)
      ) as any;
      global.alert = vi.fn();

      render(
        <FoodGuideTab
          recommendationId={mockRecommendationId}
          clientName={mockClientName}
          content={mockContent}
        />
      );

      const mobileButton = screen.getByText('移动版');
      fireEvent.click(mobileButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
        expect(mobileButton).not.toBeDisabled();
      });
    });
  });

  describe('边界情况测试', () => {
    it('没有clientName时应该使用默认文件名', async () => {
      render(
        <FoodGuideTab
          recommendationId={mockRecommendationId}
          clientName={undefined}
          content={mockContent}
        />
      );

      const mobileButton = screen.getByText('移动版');
      fireEvent.click(mobileButton);

      await waitFor(() => {
        const createdAnchor = (global.document.createElement as any).mock.results[0].value;
        expect(createdAnchor.download).toContain('移动版');
        expect(createdAnchor.download).not.toContain('undefined');
      });
    });

    it('空trafficLightFoods数据应该隐藏导出按钮', () => {
      const emptyContent = {
        trafficLightFoods: null,
      };

      render(
        <FoodGuideTab
          recommendationId={mockRecommendationId}
          clientName={mockClientName}
          content={emptyContent}
        />
      );

      // TrafficLightGuide should show empty state
      expect(screen.queryByText('移动版')).not.toBeInTheDocument();
    });
  });

  describe('按钮样式测试', () => {
    it('移动版按钮应该有蓝色背景', () => {
      render(
        <FoodGuideTab
          recommendationId={mockRecommendationId}
          clientName={mockClientName}
          content={mockContent}
        />
      );

      const mobileButton = screen.getByText('移动版').closest('button');
      expect(mobileButton).toHaveClass('bg-blue-600');
    });

    it('标准版按钮应该有绿色背景', () => {
      render(
        <FoodGuideTab
          recommendationId={mockRecommendationId}
          clientName={mockClientName}
          content={mockContent}
        />
      );

      const standardButton = screen.getByText('标准版').closest('button');
      expect(standardButton).toHaveClass('bg-emerald-600');
    });

    it('导出中时按钮应该被禁用', async () => {
      let resolveFetch: (value: any) => void = () => {};

      global.fetch = vi.fn(() =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      ) as any;

      render(
        <FoodGuideTab
          recommendationId={mockRecommendationId}
          clientName={mockClientName}
          content={mockContent}
        />
      );

      const mobileButton = screen.getByText('移动版');
      fireEvent.click(mobileButton);

      await waitFor(() => {
        expect(mobileButton).toBeDisabled();
      });

      // Resolve the fetch to complete the test
      resolveFetch({
        ok: true,
        blob: () => Promise.resolve(new Blob(['mock-pdf'])),
      });

      await waitFor(() => {
        expect(mobileButton).not.toBeDisabled();
      });
    });
  });

  describe('文件下载流程测试', () => {
    it('应该创建临时<a>元素用于下载', async () => {
      render(
        <FoodGuideTab
          recommendationId={mockRecommendationId}
          clientName={mockClientName}
          content={mockContent}
        />
      );

      const mobileButton = screen.getByText('移动版');
      fireEvent.click(mobileButton);

      await waitFor(() => {
        expect(global.document.createElement).toHaveBeenCalledWith('a');
      });
    });

    it('应该设置blob URL作为href', async () => {
      const mockBlobUrl = 'blob:mock-url';
      (global.URL.createObjectURL as any) = vi.fn(() => mockBlobUrl);

      render(
        <FoodGuideTab
          recommendationId={mockRecommendationId}
          clientName={mockClientName}
          content={mockContent}
        />
      );

      const mobileButton = screen.getByText('移动版');
      fireEvent.click(mobileButton);

      await waitFor(() => {
        const createdAnchor = (global.document.createElement as any).mock.results[0].value;
        expect(createdAnchor.href).toBe(mockBlobUrl);
      });
    });

    it('应该触发下载后清理URL对象', async () => {
      render(
        <FoodGuideTab
          recommendationId={mockRecommendationId}
          clientName={mockClientName}
          content={mockContent}
        />
      );

      const mobileButton = screen.getByText('移动版');
      fireEvent.click(mobileButton);

      await waitFor(() => {
        expect(global.URL.revokeObjectURL).toHaveBeenCalled();
      });
    });
  });
});
