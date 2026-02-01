'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CircleCheck, AlertTriangle, XCircle, Info, Sparkles, Utensils, Zap } from 'lucide-react';

// ==================== Type Definitions ====================

export interface FoodItem {
  name: string;
  detail?: string;    // For Green zone (e.g., "Rich in Folate")
  limit?: string;     // For Yellow zone (e.g., "< 15g/day")
  reason?: string;    // For Red zone (e.g., "High Cholesterol")
  category?: string;  // Food category (e.g., "蔬菜", "蛋白质", "主食")
  nutrients?: string[];  // Key nutrients (e.g., ["叶酸", "钾", "镁"])
  frequency?: string;    // Suggested frequency (e.g., "每日2-3次")
  alternatives?: string[];  // Alternative foods for red zone
}

export interface TrafficSectionData {
  title: string;
  description: string;
  rationale?: string;  // Why this category exists
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
  rationale?: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  isCollapsible?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  itemCount?: number;
}

const ZoneHeader: React.FC<ZoneHeaderProps> = ({
  icon,
  title,
  description,
  rationale,
  bgColor,
  borderColor,
  textColor,
  isCollapsible = false,
  isExpanded = true,
  onToggle,
  itemCount = 0,
}) => (
  <div
    className={`flex items-start gap-3 p-4 ${isCollapsible ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
    onClick={isCollapsible ? onToggle : undefined}
  >
    <div className={`flex-shrink-0 mt-0.5 ${textColor}`}>{icon}</div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <h3 className={`font-bold text-lg ${textColor}`}>{title}</h3>
        {itemCount > 0 && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${textColor.replace('text-', 'bg-').replace('-800', '-100').replace('-700', '-100')} ${textColor}`}>
            {itemCount}项
          </span>
        )}
      </div>
      <p className={`text-sm mt-0.5 ${textColor.replace('text-', 'text-opacity-80 text-').replace('-600', '-500').replace('-700', '-600').replace('-800', '-600')}`}>
        {description}
      </p>
      {rationale && (
        <div className={`mt-2 p-2 rounded-lg ${textColor.replace('text-', 'bg-').replace('-800', '-50').replace('-700', '-50').replace('-600', '-50')}`}>
          <p className={`text-xs font-medium ${textColor}`}>💡 {rationale}</p>
        </div>
      )}
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
      itemBg: 'bg-white/80',
      itemBorder: 'border-green-200',
      nameColor: 'text-green-900',
      detailColor: 'text-green-700',
      icon: <CircleCheck size={18} className="text-green-600 flex-shrink-0" />,
      categoryBg: 'bg-green-100',
      categoryText: 'text-green-800',
    },
    yellow: {
      itemBg: 'bg-white/80',
      itemBorder: 'border-yellow-200',
      nameColor: 'text-yellow-900',
      detailColor: 'text-yellow-700',
      icon: <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0" />,
      categoryBg: 'bg-yellow-100',
      categoryText: 'text-yellow-800',
    },
    red: {
      itemBg: 'bg-white/80',
      itemBorder: 'border-red-200',
      nameColor: 'text-red-900',
      detailColor: 'text-red-700',
      icon: <XCircle size={18} className="text-red-600 flex-shrink-0" />,
      categoryBg: 'bg-red-100',
      categoryText: 'text-red-800',
    },
  };

  const style = styles[variant];

  return (
    <div className={`p-4 rounded-xl border ${style.itemBg} ${style.itemBorder} flex items-start gap-3 hover:shadow-md transition-shadow`}>
      {style.icon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-semibold text-base ${style.nameColor}`}>{item.name}</span>
          {item.category && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.categoryBg} ${style.categoryText}`}>
              {item.category}
            </span>
          )}
          {item.frequency && variant === 'green' && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <Utensils size={12} />
              {item.frequency}
            </span>
          )}
        </div>

        {item.detail && (
          <p className={`text-sm mt-2 ${style.detailColor}`}>{item.detail}</p>
        )}

        {item.nutrients && item.nutrients.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.nutrients.map((nutrient, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded text-xs font-medium ${style.categoryBg} ${style.categoryText}`}
              >
                {nutrient}
              </span>
            ))}
          </div>
        )}

        {item.limit && (
          <div className="mt-2 flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-semibold rounded-full flex items-center gap-1">
              <AlertTriangle size={14} />
              限制: {item.limit}
            </span>
          </div>
        )}

        {item.reason && (
          <div className={`mt-2 p-2 rounded-lg ${style.itemBorder} bg-opacity-50`}>
            <div className="flex items-start gap-2">
              <Info size={14} className={`flex-shrink-0 mt-0.5 ${variant === 'red' ? 'text-red-500' : style.detailColor}`} />
              <p className={`text-sm ${style.detailColor}`}>{item.reason}</p>
            </div>
          </div>
        )}

        {item.alternatives && item.alternatives.length > 0 && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">✅ 推荐替代:</p>
            <div className="flex flex-wrap gap-1">
              {item.alternatives.map((alt, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                  {alt}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ZoneSectionProps {
  title: string;
  description: string;
  rationale?: string;
  items: FoodItem[];
  variant: 'green' | 'yellow' | 'red';
  defaultExpanded?: boolean;
}

const ZoneSection: React.FC<ZoneSectionProps> = ({
  title,
  description,
  rationale,
  items,
  variant,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const styles = {
    green: {
      containerBg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      containerBorder: 'border-green-300',
      headerBg: 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40',
      headerBorder: 'border-b border-green-300',
      headerText: 'text-green-900 dark:text-green-100',
    },
    yellow: {
      containerBg: 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
      containerBorder: 'border-yellow-300',
      headerBg: 'bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40',
      headerBorder: 'border-b border-yellow-300',
      headerText: 'text-yellow-900 dark:text-yellow-100',
    },
    red: {
      containerBg: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
      containerBorder: 'border-red-300',
      headerBg: 'bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40',
      headerBorder: 'border-b border-red-300',
      headerText: 'text-red-900 dark:text-red-100',
    },
  };

  const style = styles[variant];

  const icons = {
    green: <CircleCheck size={28} className={style.headerText} />,
    yellow: <AlertTriangle size={28} className={style.headerText} />,
    red: <XCircle size={28} className={style.headerText} />,
  };

  const isCollapsible = variant === 'red';

  // Group items by category
  const groupedItems = items.reduce((acc, item, index) => {
    const category = item.category || '其他';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ item, index });
    return acc;
  }, {} as Record<string, Array<{ item: FoodItem; index: number }>>);

  return (
    <div className={`rounded-2xl border-2 overflow-hidden shadow-sm ${style.containerBg} ${style.containerBorder}`}>
      <div className={`${style.headerBg} ${style.headerBorder}`}>
        <ZoneHeader
          icon={icons[variant]}
          title={title}
          description={description}
          rationale={rationale}
          bgColor=""
          borderColor=""
          textColor={style.headerText}
          isCollapsible={isCollapsible}
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
          itemCount={items.length}
        />
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3">
          {Object.keys(groupedItems).length > 1 ? (
            // Display grouped by category
            Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                <h4 className={`text-sm font-bold mb-2 flex items-center gap-2 ${
                  variant === 'green' ? 'text-green-800' :
                  variant === 'yellow' ? 'text-yellow-800' :
                  'text-red-800'
                }`}>
                  <Sparkles size={16} />
                  {category}
                </h4>
                <div className="space-y-2">
                  {items.map(({ item, index }) => (
                    <FoodListItem key={index} item={item} variant={variant} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Display flat if no categories
            items.map((item, index) => (
              <FoodListItem key={index} item={item} variant={variant} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ==================== Main Component ====================

const TrafficLightGuide: React.FC<TrafficLightGuideProps> = ({ data }) => {
  return (
    <div className="w-full space-y-5">
      {/* 211原则说明卡片 */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
            211
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">基于211饮食原则的红绿灯食物指南</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
              红绿灯食物分类与您的健康指标直接相关。绿灯食物富含改善您当前异常指标的营养素，
              建议作为每餐的主要选择；黄灯食物可适量食用，需注意控制份量；红灯食物会恶化您的指标，应严格避免。
            </p>
          </div>
        </div>
      </div>

      {/* Green Zone - Always Expanded */}
      <ZoneSection
        title={data.green.title}
        description={data.green.description}
        rationale={data.green.rationale}
        items={data.green.items}
        variant="green"
        defaultExpanded={true}
      />

      {/* Yellow Zone - Always Expanded */}
      <ZoneSection
        title={data.yellow.title}
        description={data.yellow.description}
        rationale={data.yellow.rationale}
        items={data.yellow.items}
        variant="yellow"
        defaultExpanded={true}
      />

      {/* Red Zone - Default Expanded */}
      <ZoneSection
        title={data.red.title}
        description={data.red.description}
        rationale={data.red.rationale}
        items={data.red.items}
        variant="red"
        defaultExpanded={true}
      />
    </div>
  );
};

export default TrafficLightGuide;
