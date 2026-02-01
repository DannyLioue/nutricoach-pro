/**
 * OCRDataDisplay 组件测试
 * TDD Step 2: RED - 编写失败的测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OCRDataDisplay from '@/components/analysis/OCRDataDisplay';

describe('OCRDataDisplay', () => {
  const mockExtractedData = {
    indicators: [
      { name: '血红蛋白', value: '145', unit: 'g/L', normalRange: '120-160' },
      { name: '空腹血糖', value: '6.8', unit: 'mmol/L', normalRange: '3.9-6.1' },
    ],
    text: '体检报告OCR识别结果',
  };

  const mockComplexData = {
    patient: { name: '张三', age: 35 },
    indicators: [
      { name: 'BMI', value: '26.5', unit: 'kg/m²', status: '偏高' },
      { name: '血压', value: '140/90', unit: 'mmHg', status: '偏高' },
    ],
    recommendations: ['控制饮食', '增加运动'],
  };

  describe('渲染测试', () => {
    it('应该渲染组件', () => {
      render(<OCRDataDisplay extractedData={mockExtractedData} />);
      expect(screen.getByText(/OCR.*原始数据/i)).toBeInTheDocument();
    });

    it('应该显示说明文字', () => {
      render(<OCRDataDisplay extractedData={mockExtractedData} />);
      expect(screen.getByText(/技术参考/i)).toBeInTheDocument();
    });

    it('应该默认收起OCR数据', () => {
      render(<OCRDataDisplay extractedData={mockExtractedData} />);
      // 初始状态是收起的，按钮文本应该是"展开"
      const toggleButton = screen.getByRole('button', { name: /展开/ });
      expect(toggleButton).toBeInTheDocument();
    });

    it('应该显示文件名（如果提供）', () => {
      render(
        <OCRDataDisplay
          extractedData={mockExtractedData}
          fileName="体检报告.pdf"
        />
      );
      expect(screen.getByText('体检报告.pdf')).toBeInTheDocument();
    });
  });

  describe('交互测试', () => {
    it('点击展开/收起按钮应该切换显示状态', () => {
      render(<OCRDataDisplay extractedData={mockExtractedData} />);

      const toggleButton = screen.getByRole('button', { name: /展开|收起/ });
      expect(toggleButton).toBeInTheDocument();

      // 初始按钮文本
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

      // 点击展开
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

      // 再次点击收起
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('展开时应该显示JSON格式化的数据', () => {
      render(<OCRDataDisplay extractedData={mockExtractedData} />);

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      // 检查JSON数据是否显示
      expect(screen.getByText(/血红蛋白/)).toBeInTheDocument();
      expect(screen.getByText(/145/)).toBeInTheDocument();
    });
  });

  describe('数据处理测试', () => {
    it('应该正确格式化JSON显示', () => {
      const { container } = render(
        <OCRDataDisplay extractedData={mockComplexData} />
      );

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      expect(container.textContent).toContain('张三');
      expect(container.textContent).toContain('26.5');
    });

    it('应该处理空对象', () => {
      render(<OCRDataDisplay extractedData={{}} />);
      expect(screen.getByText(/暂无OCR数据/i)).toBeInTheDocument();
    });

    it('应该处理null值', () => {
      render(<OCRDataDisplay extractedData={null} />);
      expect(screen.getByText(/暂无OCR数据/i)).toBeInTheDocument();
    });

    it('应该处理undefined', () => {
      render(<OCRDataDisplay extractedData={undefined} />);
      expect(screen.getByText(/暂无OCR数据/i)).toBeInTheDocument();
    });
  });

  describe('样式和可访问性测试', () => {
    it('应该有正确的aria-expanded属性', () => {
      render(<OCRDataDisplay extractedData={mockExtractedData} />);

      const toggleButton = screen.getByRole('button');
      // 初始状态应该是收起的
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('应该有合适的样式类名', () => {
      const { container } = render(
        <OCRDataDisplay extractedData={mockExtractedData} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('边界情况测试', () => {
    it('应该处理超大JSON数据', () => {
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `项目${i}`,
          value: Math.random(),
        })),
      };

      render(<OCRDataDisplay extractedData={largeData} />);

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      expect(screen.getByText(/items/)).toBeInTheDocument();
    });

    it('应该处理嵌套对象', () => {
      const nestedData = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };

      render(<OCRDataDisplay extractedData={nestedData} />);

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      expect(screen.getByText(/deep/)).toBeInTheDocument();
    });

    it('应该处理特殊字符', () => {
      const specialData = {
        message: '测试特殊字符 <script>alert("test")</script>',
        emoji: '😀🎉',
      };

      render(<OCRDataDisplay extractedData={specialData} />);

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      // 应该转义HTML，不执行脚本
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
