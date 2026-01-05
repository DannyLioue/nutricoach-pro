'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CircleCheck, AlertTriangle, XCircle, Info } from 'lucide-react';

// ==================== Type Definitions ====================

export interface FoodItem {
  name: string;
  detail?: string;    // For Green zone (e.g., "Rich in Folate")
  limit?: string;     // For Yellow zone (e.g., "< 15g/day")
  reason?: string;    // For Red zone (e.g., "High Cholesterol")
}

export interface TrafficSectionData {
  title: string;
  description: string;
  items: FoodItem[];
}

export interface TrafficLightData {
  green: TrafficSectionData;
  yellow: TrafficSectionData;
  red: TrafficSectionData;
}

// ==================== Props ====================

interface TrafficLightGuideProps {
  data: TrafficLightData;
}

// ==================== Sub-Components ====================

interface ZoneHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  isCollapsible?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const ZoneHeader: React.FC<ZoneHeaderProps> = ({
  icon,
  title,
  description,
  bgColor,
  borderColor,
  textColor,
  isCollapsible = false,
  isExpanded = true,
  onToggle,
}) => (
  <div
    className={`flex items-start gap-3 p-4 rounded-t-lg border-2 ${bgColor} ${borderColor} ${isCollapsible ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
    onClick={isCollapsible ? onToggle : undefined}
  >
    <div className={`flex-shrink-0 mt-0.5 ${textColor}`}>{icon}</div>
    <div className="flex-1">
      <h3 className={`font-bold text-lg ${textColor}`}>{title}</h3>
      <p className={`text-sm ${textColor.replace('text-', 'text-opacity-80 text-').replace('-600', '-500').replace('-700', '-600')} mt-0.5`}>
        {description}
      </p>
    </div>
    {isCollapsible && (
      <div className={`flex-shrink-0 ${textColor}`}>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
    )}
  </div>
);

interface FoodListItemProps {
  item: FoodItem;
  variant: 'green' | 'yellow' | 'red';
}

const FoodListItem: React.FC<FoodListItemProps> = ({ item, variant }) => {
  const styles = {
    green: {
      itemBg: 'bg-white/60',
      itemBorder: 'border-green-200',
      nameColor: 'text-green-900',
      detailColor: 'text-green-700',
      icon: <CircleCheck size={16} className="text-green-600 flex-shrink-0" />,
    },
    yellow: {
      itemBg: 'bg-white/60',
      itemBorder: 'border-yellow-200',
      nameColor: 'text-yellow-900',
      detailColor: 'text-yellow-700',
      icon: <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0" />,
    },
    red: {
      itemBg: 'bg-white/60',
      itemBorder: 'border-red-200',
      nameColor: 'text-red-900',
      detailColor: 'text-red-700',
      icon: <XCircle size={16} className="text-red-600 flex-shrink-0" />,
    },
  };

  const style = styles[variant];

  return (
    <div className={`p-3 rounded-lg border ${style.itemBg} ${style.itemBorder} flex items-start gap-2`}>
      {style.icon}
      <div className="flex-1 min-w-0">
        <span className={`font-medium ${style.nameColor}`}>{item.name}</span>
        {item.detail && (
          <p className={`text-xs mt-1 ${style.detailColor}`}>{item.detail}</p>
        )}
        {item.limit && (
          <span className="inline-block mt-1.5 px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded-full">
            限制: {item.limit}
          </span>
        )}
        {item.reason && (
          <div className="flex items-start gap-1 mt-1.5">
            <Info size={12} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className={`text-xs ${style.detailColor}`}>{item.reason}</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface ZoneSectionProps {
  title: string;
  description: string;
  items: FoodItem[];
  variant: 'green' | 'yellow' | 'red';
  defaultExpanded?: boolean;
}

const ZoneSection: React.FC<ZoneSectionProps> = ({
  title,
  description,
  items,
  variant,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const styles = {
    green: {
      containerBg: 'bg-green-50',
      containerBorder: 'border-green-200',
      headerBg: 'bg-green-100',
      headerBorder: 'border-green-300',
      headerText: 'text-green-800',
      titleColor: 'text-green-900',
    },
    yellow: {
      containerBg: 'bg-yellow-50',
      containerBorder: 'border-yellow-200',
      headerBg: 'bg-yellow-100',
      headerBorder: 'border-yellow-300',
      headerText: 'text-yellow-800',
      titleColor: 'text-yellow-900',
    },
    red: {
      containerBg: 'bg-red-50',
      containerBorder: 'border-red-200',
      headerBg: 'bg-red-100',
      headerBorder: 'border-red-300',
      headerText: 'text-red-800',
      titleColor: 'text-red-900',
    },
  };

  const style = styles[variant];

  const icons = {
    green: <CircleCheck size={24} />,
    yellow: <AlertTriangle size={24} />,
    red: <XCircle size={24} />,
  };

  const isCollapsible = variant === 'red';

  return (
    <div className={`rounded-xl border-2 overflow-hidden ${style.containerBg} ${style.containerBorder}`}>
      <ZoneHeader
        icon={icons[variant]}
        title={title}
        description={description}
        bgColor={style.headerBg}
        borderColor={style.headerBorder}
        textColor={style.headerText}
        isCollapsible={isCollapsible}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      />
      {isExpanded && (
        <div className="p-4 space-y-2">
          {items.map((item, index) => (
            <FoodListItem key={index} item={item} variant={variant} />
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== Main Component ====================

const TrafficLightGuide: React.FC<TrafficLightGuideProps> = ({ data }) => {
  return (
    <div className="w-full space-y-4">
      {/* Green Zone - Always Expanded */}
      <ZoneSection
        title={data.green.title}
        description={data.green.description}
        items={data.green.items}
        variant="green"
        defaultExpanded={true}
      />

      {/* Yellow Zone - Always Expanded */}
      <ZoneSection
        title={data.yellow.title}
        description={data.yellow.description}
        items={data.yellow.items}
        variant="yellow"
        defaultExpanded={true}
      />

      {/* Red Zone - Default Collapsed */}
      <ZoneSection
        title={data.red.title}
        description={data.red.description}
        items={data.red.items}
        variant="red"
        defaultExpanded={false}
      />
    </div>
  );
};

export default TrafficLightGuide;

// ==================== Default Data Example ====================

export const defaultTrafficLightData: TrafficLightData = {
  green: {
    title: '🟢 绿灯食物 (随意吃)',
    description: '富含营养素，有助于改善指标，建议日常食用',
    items: [
      { name: '燕麦', detail: '富含β-葡聚糖，可降低LDL胆固醇5-10%' },
      { name: '菠菜/羽衣甘蓝', detail: '富含叶酸(194μg/100g)，有助于降低同型半胱氨酸' },
      { name: '深海鱼(三文鱼、沙丁鱼)', detail: '富含Omega-3(EPA+DHA)，可降低甘油三酯20-30%' },
      { name: '鹰嘴豆/扁豆', detail: '植物蛋白+可溶性纤维，富含叶酸172μg/100g' },
      { name: '亚麻籽', detail: '富含ALA和可溶性纤维，每日15g磨粉食用' },
      { name: '核桃', detail: 'Omega-3来源，每日15g(约6颗)' },
      { name: '橄榄油', detail: '单不饱和脂肪，每日20ml替代其他油脂' },
      { name: '牛油果', detail: '单不饱和脂肪+钾，有助于心血管健康' },
    ],
  },
  yellow: {
    title: '🟡 黄灯食物 (控制量)',
    description: '可以食用，但需注意分量和食用时间',
    items: [
      { name: '坚果混合', limit: '≤15g/天', detail: '高热量，作为加餐10:00或15:00食用' },
      { name: '全脂乳制品', limit: '≤200ml/天', detail: '饱和脂肪，早餐时优先选择低脂' },
      { name: '瘦红肉', limit: '≤50g/天', detail: '饱和脂肪+胆固醇，优先选择鸡胸/鱼肉' },
      { name: '鸡蛋', limit: '≤2个/周', detail: '胆固醇较高，早餐配蔬菜食用' },
      { name: '根茎类蔬菜', limit: '≤150g/天', detail: '淀粉含量较高，替代部分主食' },
      { name: '热带水果', limit: '≤100g/天', detail: '糖分/GI较高，运动后食用' },
    ],
  },
  red: {
    title: '🔴 红灯食物 (避免)',
    description: '严格限制，对当前指标有负面影响',
    items: [
      { name: '动物内脏', reason: '高胆固醇+高嘌呤，显著升高LDL和尿酸' },
      { name: '黄油/奶油', reason: '饱和脂肪含量>60%，直接升高LDL胆固醇' },
      { name: '起酥面包/糕点', reason: '含反式脂肪酸+精制碳水，双重心血管风险' },
      { name: '油炸食品', reason: '氧化脂肪+高热量，促进炎症反应' },
      { name: '加工肉类', reason: '高钠+亚硝酸盐+饱和脂肪，增加高血压风险' },
      { name: '含糖饮料', reason: '精制糖迅速升高甘油三酯，引起胰岛素抵抗' },
      { name: '酒精', reason: '显著升高甘油三酯，干扰同型半胱氨酸代谢' },
    ],
  },
};
