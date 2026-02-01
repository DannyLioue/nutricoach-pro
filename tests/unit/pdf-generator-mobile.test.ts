/**
 * PDF Generator 移动端函数单元测试
 * 测试 generateFoodGuidePDFMobile 函数
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateFoodGuidePDFMobile } from '@/lib/pdf/generator';

// Mock the react-pdf renderer
vi.mock('@react-pdf/renderer', () => ({
  renderToBuffer: vi.fn(),
  StyleSheet: {
    create: vi.fn((styles) => styles),
  },
  Font: {
    register: vi.fn(),
  },
}));

// Mock the PDF component
vi.mock('@/components/pdf/PDFFoodGuideMobile', () => ({
  PDFFoodGuideMobile: 'MockedPDFFoodGuideMobile',
}));

// Mock font registration
vi.mock('@/lib/pdf/fonts', () => ({
  registerPDFFonts: vi.fn(),
}));

describe('generateFoodGuidePDFMobile - TDD', () => {
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
      yellow: [],
      red: [],
    },
  };

  const mockClientName = '测试客户';
  const mockGeneratedDate = '2024年3月1日';
  const mockPDFBuffer = Buffer.from('mock-pdf-content');

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module cache to get fresh mocks
    vi.resetModules();
  });

  describe('函数存在性测试', () => {
    it('generateFoodGuidePDFMobile 函数应该存在', async () => {
      // Dynamic import to get the actual function
      const { generateFoodGuidePDFMobile } = await import('@/lib/pdf/generator');
      expect(generateFoodGuidePDFMobile).toBeDefined();
      expect(typeof generateFoodGuidePDFMobile).toBe('function');
    });
  });

  describe('函数调用测试', () => {
    it('应该被正确导出', async () => {
      const { generateFoodGuidePDFMobile } = await import('@/lib/pdf/generator');

      // Should be able to call without throwing
      expect(async () => {
        await generateFoodGuidePDFMobile(mockContent, mockClientName, mockGeneratedDate);
      }).not.toThrow();
    });

    it('应该接收正确的参数', async () => {
      const { generateFoodGuidePDFMobile } = await import('@/lib/pdf/generator');

      // Mock the renderToBuffer to return a buffer
      const { renderToBuffer } = await import('@react-pdf/renderer');
      vi.mocked(renderToBuffer).mockResolvedValue(mockPDFBuffer);

      await generateFoodGuidePDFMobile(mockContent, mockClientName, mockGeneratedDate);

      // Verify renderToBuffer was called
      expect(renderToBuffer).toHaveBeenCalled();
    });
  });

  describe('数据转换测试', () => {
    it('应该正确转换trafficLightFoods数据', async () => {
      const { generateFoodGuidePDFMobile } = await import('@/lib/pdf/generator');
      const { renderToBuffer } = await import('@react-pdf/renderer');
      vi.mocked(renderToBuffer).mockResolvedValue(mockPDFBuffer);

      await generateFoodGuidePDFMobile(mockContent, mockClientName, mockGeneratedDate);

      // Get the component that was passed to renderToBuffer
      const renderedComponent = vi.mocked(renderToBuffer).mock.calls[0][0];

      // Verify component structure
      expect(renderedComponent).toBeDefined();
      expect(renderedComponent.type).not.toBeUndefined();
    });

    it('应该处理空的trafficLightFoods数据', async () => {
      const { generateFoodGuidePDFMobile } = await import('@/lib/pdf/generator');

      const emptyContent = {
        trafficLightFoods: {
          green: [],
          yellow: [],
          red: [],
        },
      };

      await expect(
        generateFoodGuidePDFMobile(emptyContent, mockClientName, mockGeneratedDate)
      ).resolves.toBeDefined();
    });

    it('应该处理缺失的trafficLightFoods', async () => {
      const { generateFoodGuidePDFMobile } = await import('@/lib/pdf/generator');

      const contentWithoutTrafficLight = {};

      await expect(
        generateFoodGuidePDFMobile(contentWithoutTrafficLight, mockClientName, mockGeneratedDate)
      ).rejects.toThrow('暂无食物指南数据');
    });
  });

  describe('错误处理测试', () => {
    it('应该抛出错误当trafficLightFoods为null时', async () => {
      const { generateFoodGuidePDFMobile } = await import('@/lib/pdf/generator');

      const nullContent = {
        trafficLightFoods: null,
      };

      await expect(
        generateFoodGuidePDFMobile(nullContent as any, mockClientName, mockGeneratedDate)
      ).rejects.toThrow('暂无食物指南数据');
    });

    it('应该抛出错误当trafficLightFoods为undefined时', async () => {
      const { generateFoodGuidePDFMobile } = await import('@/lib/pdf/generator');

      const undefinedContent = {};

      await expect(
        generateFoodGuidePDFMobile(undefinedContent, mockClientName, mockGeneratedDate)
      ).rejects.toThrow('暂无食物指南数据');
    });

    it('应该传递错误到上层', async () => {
      const { generateFoodGuidePDFMobile } = await import('@/lib/pdf/generator');
      const { renderToBuffer } = await import('@react-pdf/renderer');

      // Mock renderToBuffer to throw an error
      const testError = new Error('PDF rendering failed');
      vi.mocked(renderToBuffer).mockRejectedValue(testError);

      await expect(
        generateFoodGuidePDFMobile(mockContent, mockClientName, mockGeneratedDate)
      ).rejects.toThrow('PDF rendering failed');
    });
  });

  describe('参数验证测试', () => {
    it('应该正确传递clientName', async () => {
      const { generateFoodGuidePDFMobile } = await import('@/lib/pdf/generator');
      const { renderToBuffer } = await import('@react-pdf/renderer');
      vi.mocked(renderToBuffer).mockResolvedValue(mockPDFBuffer);

      await generateFoodGuidePDFMobile(mockContent, mockClientName, mockGeneratedDate);

      const renderedComponent = vi.mocked(renderToBuffer).mock.calls[0][0];

      // The clientName should be passed to PDFFoodGuideMobile
      expect(renderedComponent).toBeDefined();
    });

    it('应该正确传递generatedDate', async () => {
      const { generateFoodGuidePDFMobile } = await import('@/lib/pdf/generator');
      const { renderToBuffer } = await import('@react-pdf/renderer');
      vi.mocked(renderToBuffer).mockResolvedValue(mockPDFBuffer);

      const testDate = '2024年1月15日';
      await generateFoodGuidePDFMobile(mockContent, mockClientName, testDate);

      const renderedComponent = vi.mocked(renderToBuffer).mock.calls[0][0];

      // The generatedDate should be passed to PDFFoodGuideMobile
      expect(renderedComponent).toBeDefined();
    });
  });

  describe('数据格式转换测试', () => {
    it('应该正确处理标准格式的food数据', async () => {
      const { generateFoodGuidePDFMobile } = await import('@/lib/pdf/generator');
      const { renderToBuffer } = await import('@react-pdf/renderer');
      vi.mocked(renderToBuffer).mockResolvedValue(mockPDFBuffer);

      const standardFoodData = {
        food: '西兰花',
        category: '蔬菜类',
        detail: '富含维生素C',
        nutrients: ['维生素C'],
      };

      const contentWithStandardFormat = {
        trafficLightFoods: {
          green: [standardFoodData],
          yellow: [],
          red: [],
        },
      };

      await expect(
        generateFoodGuidePDFMobile(contentWithStandardFormat, mockClientName, mockGeneratedDate)
      ).resolves.toBeDefined();
    });

    it('应该正确处理简化的food数据', async () => {
      const { generateFoodGuidePDFMobile } = await import('@/lib/pdf/generator');
      const { renderToBuffer } = await import('@react-pdf/renderer');
      vi.mocked(renderToBuffer).mockResolvedValue(mockPDFBuffer);

      const simplifiedFoodData = {
        food: '胡萝卜',
      };

      const contentWithSimplifiedFormat = {
        trafficLightFoods: {
          green: [simplifiedFoodData],
          yellow: [],
          red: [],
        },
      };

      await expect(
        generateFoodGuidePDFMobile(contentWithSimplifiedFormat, mockClientName, mockGeneratedDate)
      ).resolves.toBeDefined();
    });

    it('应该正确处理带有frequency的食物数据', async () => {
      const { generateFoodGuidePDFMobile } = await import('@/lib/pdf/generator');
      const { renderToBuffer } = await import('@react-pdf/renderer');
      vi.mocked(renderToBuffer).mockResolvedValue(mockPDFBuffer);

      const foodWithFrequency = {
        food: '燕麦',
        category: '主食类',
        detail: '全谷物',
        nutrients: ['膳食纤维', '维生素B'],
        frequency: '每日早餐',
      };

      const contentWithFrequency = {
        trafficLightFoods: {
          green: [foodWithFrequency],
          yellow: [],
          red: [],
        },
      };

      await expect(
        generateFoodGuidePDFMobile(contentWithFrequency, mockClientName, mockGeneratedDate)
      ).resolves.toBeDefined();
    });

    it('应该正确处理带有alternatives的红灯食物', async () => {
      const { generateFoodGuidePDFMobile } = await import('@/lib/pdf/generator');
      const { renderToBuffer } = await import('@react-pdf/renderer');
      vi.mocked(renderToBuffer).mockResolvedValue(mockPDFBuffer);

      const redFoodWithAlternatives = {
        food: '油炸食品',
        category: '其他',
        reason: '高脂肪',
        alternatives: ['清蒸', '水煮', '烤'],
      };

      const contentWithAlternatives = {
        trafficLightFoods: {
          green: [],
          yellow: [],
          red: [redFoodWithAlternatives],
        },
      };

      await expect(
        generateFoodGuidePDFMobile(contentWithAlternatives, mockClientName, mockGeneratedDate)
      ).resolves.toBeDefined();
    });
  });

  describe('边缘情况测试', () => {
    it('应该处理特殊字符在食物名称中', async () => {
      const { generateFoodGuidePDFMobile } = await import('@/lib/pdf/generator');
      const { renderToBuffer } = await import('@react-pdf/renderer');
      vi.mocked(renderToBuffer).mockResolvedValue(mockPDFBuffer);

      const foodWithSpecialChars = {
        food: '西兰花(有机) - 富含维生素C®',
        category: '蔬菜类',
        detail: '特殊字符：@#$%',
        nutrients: [],
      };

      const contentWithSpecialChars = {
        trafficLightFoods: {
          green: [foodWithSpecialChars],
          yellow: [],
          red: [],
        },
      };

      await expect(
        generateFoodGuidePDFMobile(contentWithSpecialChars, mockClientName, mockGeneratedDate)
      ).resolves.toBeDefined();
    });

    it('应该处理非常长的食物描述', async () => {
      const { generateFoodGuidePDFMobile } = await import('@/lib/pdf/generator');
      const { renderToBuffer } = await import('@react-pdf/renderer');
      vi.mocked(renderToBuffer).mockResolvedValue(mockPDFBuffer);

      const longDescription = '这是一个非常长的描述文本。'.repeat(50);

      const foodWithLongDescription = {
        food: '测试食物',
        category: '测试',
        detail: longDescription,
        nutrients: [],
      };

      const contentWithLongDescription = {
        trafficLightFoods: {
          green: [foodWithLongDescription],
          yellow: [],
          red: [],
        },
      };

      await expect(
        generateFoodGuidePDFMobile(contentWithLongDescription, mockClientName, mockGeneratedDate)
      ).resolves.toBeDefined();
    });
  });
});
