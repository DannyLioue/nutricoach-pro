'use client';

import { Apple, Smartphone } from 'lucide-react';
import { useState } from 'react';
import ExportButton from './ExportButton';
import TrafficLightGuide, { TrafficLightData } from '@/components/TrafficLightGuide';

interface FoodGuideTabProps {
  recommendationId: string;
  clientName?: string;
  content: any;
}

export default function FoodGuideTab({ recommendationId, clientName, content }: FoodGuideTabProps) {
  const [exportingMobile, setExportingMobile] = useState(false);

  const handleMobileExport = async () => {
    setExportingMobile(true);
    try {
      const response = await fetch(
        `/api/recommendations/${recommendationId}/export/pdf/mobile/food-guide`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const filename = clientName
        ? `红绿灯食物指南(移动版)-${clientName}.pdf`
        : `红绿灯食物指南(移动版).pdf`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('导出移动版PDF失败:', error);
      alert(`导出失败: ${error.message}`);
    } finally {
      setExportingMobile(false);
    }
  };
  // 转换 trafficLightFoods 数据格式
  const convertTrafficLightData = (data: any): TrafficLightData | null => {
    if (!data?.trafficLightFoods) return null;

    const convertFoodItem = (item: any, variant: 'green' | 'yellow' | 'red'): any => {
      if (item.name && (item.detail || item.reason || item.category || item.nutrients)) {
        return item;
      }

      const baseItem = {
        name: item.food || item.name || '',
        category: item.category || undefined,
        nutrients: item.nutrients || item.keyNutrients || undefined,
        frequency: item.frequency || item.servingFrequency || undefined,
      };

      if (variant === 'red') {
        return {
          ...baseItem,
          reason: item.reason || item.whyAvoid || '',
          alternatives: item.alternatives || item.substitutes || undefined,
        };
      }

      if (variant === 'yellow') {
        return {
          ...baseItem,
          detail: item.reason || item.detail || item.whyLimit || '',
          limit: item.limit || item.serving || item.dailyLimit || '',
        };
      }

      return {
        ...baseItem,
        detail: item.reason || item.detail || item.whyRecommended || '',
      };
    };

    const getRationale = (variant: 'green' | 'yellow' | 'red'): string => {
      const rationales = {
        green: '这些食物富含改善您当前异常指标所需的关键营养素，是211饮食法的核心组成部分。建议每餐保证50%蔬菜，25%高蛋白食物，25%全谷物。',
        yellow: '这些食物营养价值适中，但热量较高或含有可能影响您指标的成分。建议控制份量和食用频率，可作为偶尔调剂。',
        red: '这些食物会恶化您当前的异常指标，应严格避免。它们通常高盐、高糖、高饱和脂肪或含有对您当前健康状况不利的成分。',
      };
      return rationales[variant];
    };

    return {
      green: {
        title: '🟢 绿灯食物 (推荐食用)',
        description: '富含改善指标的关键营养素，建议作为每餐主要选择',
        rationale: getRationale('green'),
        items: (data.trafficLightFoods.green || []).map((item: any) => convertFoodItem(item, 'green')),
      },
      yellow: {
        title: '🟡 黄灯食物 (控制份量)',
        description: '可适量食用，需注意控制频率和份量',
        rationale: getRationale('yellow'),
        items: (data.trafficLightFoods.yellow || []).map((item: any) => convertFoodItem(item, 'yellow')),
      },
      red: {
        title: '🔴 红灯食物 (严格避免)',
        description: '会恶化当前指标，应从饮食中完全排除',
        rationale: getRationale('red'),
        items: (data.trafficLightFoods.red || []).map((item: any) => convertFoodItem(item, 'red')),
      },
    };
  };

  const trafficLightData = convertTrafficLightData(content);

  if (!trafficLightData) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-8 text-center">
        <div className="text-zinc-500">暂无食物指南数据</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 导出按钮 */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Apple className="w-6 h-6 text-emerald-600" />
          红绿灯食物指南
        </h3>
        <div className="flex gap-3">
          <ExportButton
            recommendationId={recommendationId}
            module="food-guide"
            clientName={clientName}
            label="标准版"
          />
          <button
            onClick={handleMobileExport}
            disabled={exportingMobile}
            className={`
              flex items-center gap-2 px-4 py-2
              bg-blue-600 hover:bg-blue-700
              disabled:bg-blue-400 disabled:cursor-not-allowed
              text-white text-sm font-medium rounded-lg
              transition-colors
            `}
          >
            <Smartphone className="w-4 h-4" />
            {exportingMobile ? '导出中...' : '移动版'}
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6">
        <TrafficLightGuide data={trafficLightData} />
      </div>
    </div>
  );
}
