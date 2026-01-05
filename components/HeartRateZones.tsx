'use client';

import React, { useState } from 'react';
import { Heart, Activity, Target, Info, Zap } from 'lucide-react';

// ==================== Type Definitions ====================

export interface HeartRateZone {
  name: string;
  minBpm: number;
  maxBpm: number;
  color: string; // Tailwind class for background
  textColor: string; // Tailwind class for text
  description: string;
  icon?: React.ReactNode;
}

export interface HeartRateData {
  restingHr: number;
  maxHr: number;
  age: number;
  recommendedZone: HeartRateZone;
  allZones?: HeartRateZone[];
}

// ==================== Props ====================

interface HeartRateZonesProps {
  data: HeartRateData;
  showDetails?: boolean;
  className?: string;
}

// ==================== Sub-Components ====================

interface ZoneLabelProps {
  zone: HeartRateZone;
  isActive: boolean;
  onClick?: () => void;
}

const ZoneLabel: React.FC<ZoneLabelProps> = ({ zone, isActive, onClick }) => (
  <div
    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
      isActive
        ? `${zone.color} ${zone.textColor} border-current shadow-md`
        : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
    }`}
    onClick={onClick}
  >
    <div className="flex items-center gap-2 mb-2">
      {zone.icon || <Activity size={18} />}
      <span className="font-semibold">{zone.name}</span>
    </div>
    <div className={`text-2xl font-bold ${isActive ? zone.textColor : 'text-zinc-900 dark:text-zinc-100'}`}>
      {zone.minBpm}-{zone.maxBpm}
      <span className="text-sm font-normal ml-1">bpm</span>
    </div>
    <p className="text-xs mt-1 opacity-80">{zone.description}</p>
  </div>
);

// ==================== Main Component ====================

const HeartRateZones: React.FC<HeartRateZonesProps> = ({
  data,
  showDetails = true,
  className = '',
}) => {
  const [selectedZone, setSelectedZone] = useState<HeartRateZone | null>(data.recommendedZone);

  const { restingHr, maxHr, age, recommendedZone, allZones } = data;

  // Calculate percentages for the gauge
  const totalRange = maxHr - restingHr;
  const getPercentage = (bpm: number) => ((bpm - restingHr) / totalRange) * 100;

  // Default zones if not provided (based on Karvonen formula)
  const defaultZones: HeartRateZone[] = [
    {
      name: 'Zone 1 - 热身/恢复',
      minBpm: restingHr,
      maxBpm: Math.round((maxHr - restingHr) * 0.5 + restingHr),
      color: 'bg-emerald-100 dark:bg-emerald-900/30',
      textColor: 'text-emerald-800 dark:text-emerald-200',
      description: '低强度，适合热身和运动后恢复',
      icon: <Activity size={18} />,
    },
    {
      name: 'Zone 2 - 燃脂区间',
      minBpm: Math.round((maxHr - restingHr) * 0.5 + restingHr),
      maxBpm: Math.round((maxHr - restingHr) * 0.7 + restingHr),
      color: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-800 dark:text-blue-200',
      description: '最佳减脂强度，能够完整对话',
      icon: <Zap size={18} />,
    },
    {
      name: 'Zone 3 - 有氧强化',
      minBpm: Math.round((maxHr - restingHr) * 0.7 + restingHr),
      maxBpm: Math.round((maxHr - restingHr) * 0.8 + restingHr),
      color: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-800 dark:text-orange-200',
      description: '提升心肺功能，说话略感吃力',
      icon: <Activity size={18} />,
    },
    {
      name: 'Zone 4 - 无氧阈值',
      minBpm: Math.round((maxHr - restingHr) * 0.8 + restingHr),
      maxBpm: Math.round((maxHr - restingHr) * 0.9 + restingHr),
      color: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-800 dark:text-red-200',
      description: '高强度训练，无法持续对话',
      icon: <Activity size={18} />,
    },
    {
      name: 'Zone 5 - 极限',
      minBpm: Math.round((maxHr - restingHr) * 0.9 + restingHr),
      maxBpm: maxHr,
      color: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-800 dark:text-purple-200',
      description: '最大强度，仅短时间冲刺',
      icon: <Zap size={18} />,
    },
  ];

  const zones = allZones || defaultZones;
  const displayZone = selectedZone || recommendedZone;

  // Build the gauge segments
  const gaugeSegments = zones.map((zone) => ({
    ...zone,
    startPercent: getPercentage(zone.minBpm),
    endPercent: getPercentage(zone.maxBpm),
    width: getPercentage(zone.maxBpm) - getPercentage(zone.minBpm),
    isRecommended:
      zone.minBpm === recommendedZone.minBpm && zone.maxBpm === recommendedZone.maxBpm,
  }));

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="text-red-500" size={24} />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            运动心率区间 (Karvonen 储备心率法)
          </h3>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          基于 MHR (最大心率) 和 RHR (静息心率) 计算个性化训练区间
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">年龄</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{age}岁</p>
        </div>
        <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">静息心率 (RHR)</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{restingHr} bpm</p>
        </div>
        <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">最大心率 (MHR)</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{maxHr} bpm</p>
        </div>
      </div>

      {/* Linear Gauge */}
      <div className="mb-6">
        <div className="relative">
          {/* Scale labels */}
          <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2 px-1">
            <span>{restingHr}</span>
            <span>{maxHr}</span>
          </div>

          {/* Gauge Bar */}
          <div className="relative h-12 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden shadow-inner">
            {/* Zone segments */}
            {gaugeSegments.map((segment, index) => (
              <div
                key={index}
                className={`absolute top-0 h-full ${segment.color} transition-all hover:opacity-80 cursor-pointer`}
                style={{
                  left: `${segment.startPercent}%`,
                  width: `${Math.max(segment.width, 2)}%`, // Minimum width for visibility
                }}
                title={`${segment.name}: ${segment.minBpm}-${segment.maxBpm} bpm`}
                onClick={() => setSelectedZone(segment)}
              >
                {/* Recommended indicator */}
                {segment.isRecommended && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white dark:bg-zinc-900 rounded-full px-2 py-1 shadow-md">
                      <Target size={16} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Target zone overlay */}
            {!gaugeSegments.some((s) => s.isRecommended) && (
              <div
                className="absolute top-0 h-full bg-emerald-500/30 border-2 border-emerald-500 rounded pointer-events-none"
                style={{
                  left: `${getPercentage(recommendedZone.minBpm)}%`,
                  width: `${getPercentage(recommendedZone.maxBpm) - getPercentage(recommendedZone.minBpm)}%`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Target size={20} className="text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            )}
          </div>

          {/* Zone markers below the gauge */}
          <div className="relative h-6 mt-2">
            {zones.map((zone, index) => (
              <div
                key={index}
                className="absolute text-xs text-zinc-600 dark:text-zinc-400 font-medium"
                style={{
                  left: `${(getPercentage(zone.minBpm) + getPercentage(zone.maxBpm)) / 2}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                {zone.minBpm}-{zone.maxBpm}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Target Recommendation Banner */}
      <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Target className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">
              目标训练区间
            </h4>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              {recommendedZone.minBpm} - {recommendedZone.maxBpm} bpm
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
              {recommendedZone.description}
            </p>
          </div>
        </div>
      </div>

      {/* Zone Details Grid */}
      {showDetails && (
        <div>
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
            <Info size={16} />
            区间详情 (点击查看)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {zones.map((zone, index) => (
              <ZoneLabel
                key={index}
                zone={zone}
                isActive={
                  selectedZone?.minBpm === zone.minBpm && selectedZone?.maxBpm === zone.maxBpm
                }
                onClick={() => setSelectedZone(zone)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Calculation Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
          <Info size={16} />
          Karvonen 储备心率公式
        </h4>
        <p className="text-xs text-blue-800 dark:text-blue-200 font-mono">
          目标心率 = [(最大心率 - 静息心率) × 运动强度%] + 静息心率
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
          最大心率 = 220 - {age} = {maxHr} bpm
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          储备心率 (HRR) = {maxHr} - {restingHr} = {maxHr - restingHr} bpm
        </p>
      </div>
    </div>
  );
};

export default HeartRateZones;

// ==================== Default Data Example ====================

export const defaultHeartRateData: HeartRateData = {
  age: 39,
  restingHr: 70,
  maxHr: 181, // 220 - 39
  recommendedZone: {
    name: 'Zone 2 - 燃脂区间',
    minBpm: 137,
    maxBpm: 148,
    color: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-800 dark:text-blue-200',
    description: '最佳减脂强度，能够完整对话但略微气喘',
    icon: <Zap size={18} />,
  },
};
