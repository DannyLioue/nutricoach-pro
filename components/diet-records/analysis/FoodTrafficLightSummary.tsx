'use client';

import { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface FoodTrafficLightSummaryProps {
  summary: {
    greenFoods: string[];
    yellowFoods: string[];
    redFoods: string[];
    totalCount: number;
  };
}

const MAX_VISIBLE = 10;

/**
 * 食物红绿灯分类摘要组件
 * 显示绿灯（推荐）、黄灯（适量）、红灯（避免）食物
 */
export default function FoodTrafficLightSummary({
  summary,
}: FoodTrafficLightSummaryProps) {
  const [showAllGreen, setShowAllGreen] = useState(false);
  const [showAllYellow, setShowAllYellow] = useState(false);
  const [showAllRed, setShowAllRed] = useState(false);

  const greenFoods = summary.greenFoods || [];
  const yellowFoods = summary.yellowFoods || [];
  const redFoods = summary.redFoods || [];

  const displayGreen = showAllGreen ? greenFoods : greenFoods.slice(0, MAX_VISIBLE);
  const displayYellow = showAllYellow ? yellowFoods : yellowFoods.slice(0, MAX_VISIBLE);
  const displayRed = showAllRed ? redFoods : redFoods.slice(0, MAX_VISIBLE);

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* 绿灯食物 */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <h5 className="font-semibold text-green-900 dark:text-green-100">绿灯食物</h5>
          <span className="ml-auto text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
            {greenFoods.length} 项
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {displayGreen.map((food, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 bg-white dark:bg-green-950 text-green-800 dark:text-green-200 px-2 py-1 rounded-md text-xs"
            >
              <CheckCircle2 className="w-3 h-3" />
              {food}
            </span>
          ))}
          {greenFoods.length > MAX_VISIBLE && !showAllGreen && (
            <button
              onClick={() => setShowAllGreen(true)}
              className="text-xs text-green-600 hover:text-green-800 underline"
            >
              +{greenFoods.length - MAX_VISIBLE} 项
            </button>
          )}
        </div>
      </div>

      {/* 黄灯食物 */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <h5 className="font-semibold text-yellow-900 dark:text-yellow-100">黄灯食物</h5>
          <span className="ml-auto text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
            {yellowFoods.length} 项
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {displayYellow.map((food, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 bg-white dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-md text-xs"
            >
              <AlertTriangle className="w-3 h-3" />
              {food}
            </span>
          ))}
          {yellowFoods.length > MAX_VISIBLE && !showAllYellow && (
            <button
              onClick={() => setShowAllYellow(true)}
              className="text-xs text-yellow-600 hover:text-yellow-800 underline"
            >
              +{yellowFoods.length - MAX_VISIBLE} 项
            </button>
          )}
        </div>
      </div>

      {/* 红灯食物 */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 mb-2">
          <XCircle className="w-4 h-4 text-red-600" />
          <h5 className="font-semibold text-red-900 dark:text-red-100">红灯食物</h5>
          <span className="ml-auto text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
            {redFoods.length} 项
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {displayRed.map((food, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 bg-white dark:bg-red-950 text-red-800 dark:text-red-200 px-2 py-1 rounded-md text-xs"
            >
              <XCircle className="w-3 h-3" />
              {food}
            </span>
          ))}
          {redFoods.length > MAX_VISIBLE && !showAllRed && (
            <button
              onClick={() => setShowAllRed(true)}
              className="text-xs text-red-600 hover:text-red-800 underline"
            >
              +{redFoods.length - MAX_VISIBLE} 项
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
