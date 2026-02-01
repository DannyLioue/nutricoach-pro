/**
 * HealthSummaryCard 组件测试
 * TDD Step 2: RED - 编写失败的测试
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HealthSummaryCard from '@/components/analysis/HealthSummaryCard';
import type { RawAnalysisData } from '@/types/health-analysis';

describe('HealthSummaryCard', () => {
  // 测试数据
  const mockAnalysisExcellent: RawAnalysisData = {
    summary: '整体健康状况良好，各项指标均在正常范围内',
    healthScore: 92,
    indicators: [
      { name: '血红蛋白', status: '正常' },
      { name: '空腹血糖', status: '正常' },
    ],
    riskFactors: [],
  };

  const mockAnalysisNeedsAttention: RawAnalysisData = {
    summary: '发现血脂偏高，建议调整饮食结构并增加运动',
    healthScore: 65,
    indicators: [
      { name: '甘油三酯', status: '偏高', priority: '高' },
      { name: '总胆固醇', status: '偏高', priority: '中' },
      { name: '血红蛋白', status: '正常' },
    ],
    riskFactors: [
      { factor: '高血脂', level: '高' },
      { factor: '心血管风险', level: '中' },
    ],
  };

  const mockAnalysisPoor: RawAnalysisData = {
    summary: '多项指标异常，需要立即就医并进行综合干预',
    healthScore: 45,
    indicators: [
      { name: '空腹血糖', status: '偏高', priority: '高' },
      { name: '糖化血红蛋白', status: '偏高', priority: '高' },
      { name: '血压', status: '偏高', priority: '高' },
      { name: 'BMI', status: '偏高', priority: '中' },
    ],
    riskFactors: [
      { factor: '糖尿病风险', level: '高' },
      { factor: '高血压风险', level: '高' },
      { factor: '心血管疾病', level: '高' },
    ],
  };

  describe('渲染测试', () => {
    it('应该渲染组件', () => {
      render(<HealthSummaryCard analysis={mockAnalysisExcellent} />);
      expect(screen.getByText(/健康状况总评/i)).toBeInTheDocument();
    });

    it('应该显示健康状态为"优秀"当分数>=90', () => {
      render(<HealthSummaryCard analysis={mockAnalysisExcellent} />);
      expect(screen.getByText(/优秀/i)).toBeInTheDocument();
      expect(screen.getByText(/各项指标良好/i)).toBeInTheDocument();
    });

    it('应该显示健康状态为"需关注"当分数<70', () => {
      render(<HealthSummaryCard analysis={mockAnalysisNeedsAttention} />);
      expect(screen.getByText(/需关注/i)).toBeInTheDocument();
    });

    it('应该显示健康状态为"需立即改善"当分数<50', () => {
      render(<HealthSummaryCard analysis={mockAnalysisPoor} />);
      expect(screen.getByText(/需立即改善/i)).toBeInTheDocument();
    });

    it('应该显示关键发现列表', () => {
      render(<HealthSummaryCard analysis={mockAnalysisNeedsAttention} />);
      // 应该显示异常指标名称（在关键发现区域）
      expect(screen.getByText(/甘油三酯.*偏高/i)).toBeInTheDocument();
      expect(screen.getByText(/总胆固醇.*偏高/i)).toBeInTheDocument();
    });

    it('应该显示优先建议', () => {
      render(<HealthSummaryCard analysis={mockAnalysisNeedsAttention} />);
      expect(screen.getByText(/优先建议/i)).toBeInTheDocument();
    });
  });

  describe('数据处理测试', () => {
    it('应该从原始摘要中提取关键信息', () => {
      const { container } = render(
        <HealthSummaryCard analysis={mockAnalysisNeedsAttention} />
      );
      // 组件会从摘要中提取关键词，显示在关键发现中
      expect(container.textContent).toContain('甘油三酯');
      expect(container.textContent).toContain('偏高');
    });

    it('应该根据异常指标生成关键发现', () => {
      const { container } = render(
        <HealthSummaryCard analysis={mockAnalysisNeedsAttention} />
      );
      expect(container.textContent).toContain('甘油三酯');
      expect(container.textContent).toContain('偏高');
    });

    it('应该根据风险因素生成优先建议', () => {
      const { container } = render(
        <HealthSummaryCard analysis={mockAnalysisNeedsAttention} />
      );
      expect(container.textContent).toContain('高血脂');
    });

    it('应该处理空数据', () => {
      const { container } = render(
        <HealthSummaryCard analysis={{}} />
      );
      expect(container.textContent).toContain('暂无分析数据');
    });
  });

  describe('样式和图标测试', () => {
    it('应该根据健康状态显示不同颜色', () => {
      const { container: excellentContainer } = render(
        <HealthSummaryCard analysis={mockAnalysisExcellent} />
      );
      const { container: poorContainer } = render(
        <HealthSummaryCard analysis={mockAnalysisPoor} />
      );

      // 优秀状态应该有绿色渐变背景
      expect(excellentContainer.querySelector('.from-green-600')).toBeInTheDocument();
      // 需改善状态应该有红色渐变背景
      expect(poorContainer.querySelector('.from-red-600')).toBeInTheDocument();
    });

    it('应该显示健康评分', () => {
      render(<HealthSummaryCard analysis={mockAnalysisExcellent} />);
      expect(screen.getByText('92')).toBeInTheDocument();
    });
  });

  describe('边界情况测试', () => {
    it('应该处理没有摘要的情况', () => {
      const { container } = render(
        <HealthSummaryCard analysis={{ healthScore: 80 }} />
      );
      // 组件仍然会生成优先建议
      expect(container.textContent).toContain('继续保持健康的生活方式');
    });

    it('应该处理没有指标的情况', () => {
      const { container } = render(
        <HealthSummaryCard analysis={{ summary: '测试摘要' } } />
      );
      // 应该从摘要中提取关键发现
      expect(container.textContent).toContain('测试摘要');
      expect(container.textContent).toContain('请查看下方详细指标');
    });

    it('应该处理没有风险因素的情况', () => {
      const { container } = render(
        <HealthSummaryCard analysis={{ ...mockAnalysisExcellent, riskFactors: undefined } } />
      );
      // 应该显示优先建议（当没有风险因素时）
      expect(container.textContent).toContain('继续保持健康的生活方式');
    });
  });
});
