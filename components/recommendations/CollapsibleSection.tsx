'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  priority?: 'high' | 'medium' | 'low';
  children: React.ReactNode;
  badge?: React.ReactNode;
}

export default function CollapsibleSection({
  id,
  title,
  icon,
  defaultOpen = false,
  priority,
  children,
  badge,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10';
      case 'medium':
        return 'border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-50/50 to-transparent dark:from-yellow-900/10';
      default:
        return '';
    }
  };

  return (
    <div
      data-section-id={id}
      className={`bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden ${getPriorityStyles()}`}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2 rounded-lg ${priority === 'high' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
            {icon}
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
          {badge && <div className="ml-2">{badge}</div>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {isOpen ? '点击收起' : '点击展开'}
          </span>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-zinc-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-500" />
          )}
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-zinc-200 dark:border-zinc-700">
          {children}
        </div>
      )}
    </div>
  );
}
