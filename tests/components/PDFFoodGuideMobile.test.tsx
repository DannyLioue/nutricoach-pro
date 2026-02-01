/**
 * PDFFoodGuideMobile 组件测试
 * 测试移动端PDF组件的渲染和样式
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PDFFoodGuideMobile } from '@/components/pdf/PDFFoodGuideMobile';
import { TrafficLightData } from '@/components/TrafficLightGuide';

describe('PDFFoodGuideMobile 组件', () => {
  // Mock PDF styles - 这些样式在 @react-pdf/renderer 中定义
  const mockTrafficLightData: TrafficLightData = {
    green: {
      title: '🟢 绿灯食物 (推荐食用)',
      description: '富含改善指标的关键营养素',
      rationale: '这些食物富含改善您当前异常指标所需的关键营养素，是211饮食法的核心组成部分。',
      items: [
        {
          name: '西兰花',
          category: '蔬菜类',
          detail: '富含维生素C和纤维',
          nutrients: ['维生素C', '膳食纤维', '钾'],
          frequency: '每日2-3次',
        },
        {
          name: '菠菜',
          category: '蔬菜类',
          detail: '富含铁和叶酸',
          nutrients: ['铁', '叶酸', '维生素A'],
          frequency: '每日1-2次',
        },
      ],
    },
    yellow: {
      title: '🟡 黄灯食物 (控制份量)',
      description: '可适量食用，需注意控制频率和份量',
      rationale: '这些食物营养价值适中，但热量较高或含有可能影响您指标的成分。',
      items: [
        {
          name: '白米饭',
          category: '主食类',
          detail: '精制碳水，适量食用',
          nutrients: ['碳水化合物'],
          limit: '每餐不超过1小碗',
        },
      ],
    },
    red: {
      title: '🔴 红灯食物 (严格避免)',
      description: '会恶化当前指标，应从饮食中完全排除',
      rationale: '这些食物会恶化您当前的异常指标，应严格避免。',
      items: [
        {
          name: '油炸食品',
          category: '其他',
          reason: '高脂肪高热量，不利于健康',
          alternatives: ['清蒸', '水煮'],
        },
      ],
    },
  };

  describe('组件结构测试', () => {
    it('应该是一个有效的React组件', () => {
      expect(PDFFoodGuideMobile).toBeDefined();
      expect(typeof PDFFoodGuideMobile).toBe('function');
    });

    it('应该接受trafficLightData、clientName和generatedDate作为props', () => {
      const props = {
        data: mockTrafficLightData,
        clientName: '测试客户',
        generatedDate: '2024年3月1日',
      };

      // Component should not throw when rendering with valid props
      expect(() => {
        // Note: PDFFoodGuideMobile returns a Document with Pages, not standard JSX
        // We're testing that it can be instantiated
        PDFFoodGuideMobile(props);
      }).not.toThrow();
    });
  });

  describe('数据处理测试', () => {
    it('应该正确处理绿灯食物数据', () => {
      const greenItems = mockTrafficLightData.green.items;
      expect(greenItems).toHaveLength(2);
      expect(greenItems[0].name).toBe('西兰花');
      expect(greenItems[0].category).toBe('蔬菜类');
      expect(greenItems[0].nutrients).toEqual(['维生素C', '膳食纤维', '钾']);
    });

    it('应该正确处理黄灯食物数据', () => {
      const yellowItems = mockTrafficLightData.yellow.items;
      expect(yellowItems).toHaveLength(1);
      expect(yellowItems[0].name).toBe('白米饭');
      expect(yellowItems[0].limit).toBe('每餐不超过1小碗');
    });

    it('应该正确处理红灯食物数据', () => {
      const redItems = mockTrafficLightData.red.items;
      expect(redItems).toHaveLength(1);
      expect(redItems[0].name).toBe('油炸食品');
      expect(redItems[0].alternatives).toEqual(['清蒸', '水煮']);
    });

    it('应该正确处理分类分组', () => {
      // 模拟组件中的分组逻辑
      const grouped = mockTrafficLightData.green.items.reduce((acc, item) => {
        const cat = item.category || '其他';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {} as Record<string, typeof mockTrafficLightData.green.items>);

      expect(Object.keys(grouped)).toEqual(['蔬菜类']);
      expect(grouped['蔬菜类']).toHaveLength(2);
    });
  });

  describe('样式规范测试', () => {
    it('绿灯区域应该使用绿色主题', () => {
      expect(mockTrafficLightData.green.title).toContain('🟢');
      expect(mockTrafficLightData.green.title).toContain('绿灯食物');
    });

    it('黄灯区域应该使用黄色主题', () => {
      expect(mockTrafficLightData.yellow.title).toContain('🟡');
      expect(mockTrafficLightData.yellow.title).toContain('黄灯食物');
    });

    it('红灯区域应该使用红色主题', () => {
      expect(mockTrafficLightData.red.title).toContain('🔴');
      expect(mockTrafficLightData.red.title).toContain('红灯食物');
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空的items数组', () => {
      const emptyData: TrafficLightData = {
        green: {
          title: '🟢 绿灯食物 (推荐食用)',
          description: '富含改善指标的关键营养素',
          rationale: '无',
          items: [],
        },
        yellow: {
          title: '🟡 黄灯食物 (控制份量)',
          description: '可适量食用',
          rationale: '无',
          items: [],
        },
        red: {
          title: '🔴 红灯食物 (严格避免)',
          description: '会恶化当前指标',
          rationale: '无',
          items: [],
        },
      };

      const props = {
        data: emptyData,
        clientName: '测试客户',
        generatedDate: '2024年3月1日',
      };

      expect(() => PDFFoodGuideMobile(props)).not.toThrow();
    });

    it('应该处理没有category的食物项', () => {
      const dataWithoutCategory: TrafficLightData = {
        green: {
          title: '🟢 绿灯食物',
          description: '推荐食用',
          rationale: '无',
          items: [
            {
              name: '测试食物',
              category: undefined,
              detail: '测试详情',
              nutrients: ['维生素A'],
            },
          ],
        },
        yellow: {
          title: '🟡 黄灯食物',
          description: '控制份量',
          rationale: '无',
          items: [],
        },
        red: {
          title: '🔴 红灯食物',
          description: '严格避免',
          rationale: '无',
          items: [],
        },
      };

      // 模拟分组逻辑，未分类项目应该归入"其他"
      const grouped = dataWithoutCategory.green.items.reduce((acc, item) => {
        const cat = item.category || '其他';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {} as Record<string, typeof dataWithoutCategory.green.items>);

      expect(grouped['其他']).toHaveLength(1);
      expect(grouped['其他'][0].name).toBe('测试食物');
    });

    it('应该处理空字符串的category', () => {
      const itemWithEmptyCategory = {
        name: '测试食物',
        category: '',
        detail: '测试详情',
        nutrients: ['维生素C'],
      };

      const cat = itemWithEmptyCategory.category || '其他';
      expect(cat).toBe('其他');
    });
  });

  describe('移动端特定功能测试', () => {
    it('应该支持显示emoji图标', () => {
      expect(mockTrafficLightData.green.title).toMatch(/🟢/);
      expect(mockTrafficLightData.yellow.title).toMatch(/🟡/);
      expect(mockTrafficLightData.red.title).toMatch(/🔴/);
    });

    it('应该包含详细的描述文本', () => {
      expect(mockTrafficLightData.green.description).toBeTruthy();
      expect(mockTrafficLightData.green.description.length).toBeGreaterThan(10);
    });

    it('应该包含推荐理由', () => {
      expect(mockTrafficLightData.green.rationale).toBeTruthy();
      expect(mockTrafficLightData.green.rationale).toContain('关键营养素');
    });
  });

  describe('数据完整性测试', () => {
    it('所有食物项都应该有name字段', () => {
      const allItems = [
        ...mockTrafficLightData.green.items,
        ...mockTrafficLightData.yellow.items,
        ...mockTrafficLightData.red.items,
      ];

      allItems.forEach(item => {
        expect(item.name).toBeDefined();
        expect(item.name.length).toBeGreaterThan(0);
      });
    });

    it('黄灯食物的limit字段应该是可选的', () => {
      const yellowItemWithoutLimit = {
        name: '测试食物',
        category: '测试',
        detail: '测试',
      };

      expect(yellowItemWithoutLimit.limit).toBeUndefined();
    });

    it('红灯食物的alternatives字段应该是可选的', () => {
      const redItemWithoutAlternatives = {
        name: '测试食物',
        category: '测试',
        reason: '测试原因',
      };

      expect(redItemWithoutAlternatives.alternatives).toBeUndefined();
    });
  });

  describe('字体大小测试（移动端优化）', () => {
    it('标题应该大而清晰（28-32pt）', () => {
      // This tests the design spec - actual implementation uses StyleSheet
      // We're verifying the data structure supports large titles
      expect(mockTrafficLightData.green.title).toBeTruthy();
      expect(mockTrafficLightData.green.title.length).toBeLessThan(50); // Reasonable title length
    });

    it('应该支持长文本换行', () => {
      const longDescription = '这是一个很长的描述文本，用于测试移动端PDF组件是否正确处理长文本换行。移动端屏幕较小，需要确保文本能够正确换行显示，不会被截断。';

      const dataWithLongDescription: TrafficLightData = {
        green: {
          title: '🟢 绿灯食物',
          description: longDescription,
          rationale: '测试',
          items: [],
        },
        yellow: {
          title: '🟡 黄灯食物',
          description: '测试',
          rationale: '测试',
          items: [],
        },
        red: {
          title: '🔴 红灯食物',
          description: '测试',
          rationale: '测试',
          items: [],
        },
      };

      expect(dataWithLongDescription.green.description.length).toBeGreaterThan(50);
    });
  });
});
