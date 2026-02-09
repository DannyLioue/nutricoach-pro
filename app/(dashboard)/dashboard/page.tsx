'use client';

import Link from 'next/link';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import TodoList from '@/components/dashboard/TodoList';
import WeeklyStats from '@/components/dashboard/WeeklyStats';
import { UserPlus, TrendingUp, Target, Zap } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen organic-bg">
      <DashboardNavbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="font-display text-4xl font-semibold mb-2" style={{ color: 'var(--color-primary-800)' }}>
            控制台
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            欢迎回来！这是您的工作概览
          </p>
        </div>

        {/* 待办事项 */}
        <div className="mb-8 delay-100">
          <TodoList />
        </div>

        {/* 本周统计 */}
        <div className="mb-8 delay-200">
          <WeeklyStats />
        </div>

        {/* 快速操作 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up delay-300">
          <QuickActionCard
            title="添加客户"
            description="创建新的客户档案"
            icon={<UserPlus className="w-6 h-6" />}
            href="/clients/new"
            color="primary"
          />
          <QuickActionCard
            title="查看分析"
            description="浏览数据统计和趋势"
            icon={<TrendingUp className="w-6 h-6" />}
            href="/clients"
            color="accent"
          />
        </div>
      </main>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: 'primary' | 'accent';
}

function QuickActionCard({ title, description, icon, href, color }: QuickActionCardProps) {
  const gradientStyle = color === 'primary'
    ? 'linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-700) 100%)'
    : 'linear-gradient(135deg, var(--color-accent-400) 0%, var(--color-accent-600) 100%)';

  return (
    <Link
      href={href}
      className="group card p-6 hover:scale-105 transition-all duration-300 flex items-start gap-4"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all" style={{ background: gradientStyle }}>
        <span className="text-white">{icon}</span>
      </div>
      <div className="flex-1">
        <h3 className="font-display text-lg font-semibold mb-1 group-hover:text-accent-600 transition-colors" style={{ color: 'var(--color-primary-800)' }}>
          {title}
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {description}
        </p>
      </div>
      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-200)' }}>
        <span className="text-xs" style={{ color: 'var(--color-accent-600)' }}>→</span>
      </div>
    </Link>
  );
}
