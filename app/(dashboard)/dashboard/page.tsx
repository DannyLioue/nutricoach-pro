'use client';

import Link from 'next/link';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import TodoList from '@/components/dashboard/TodoList';
import WeeklyStats from '@/components/dashboard/WeeklyStats';
import { UserPlus } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardNavbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-8">
          控制台
        </h2>

        {/* 待办事项 */}
        <div className="mb-8">
          <TodoList />
        </div>

        {/* 本周统计 */}
        <div className="mb-8">
          <WeeklyStats />
        </div>

        {/* 快速操作 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            快速操作
          </h3>
          <Link
            href="/clients/new"
            className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                添加客户
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                创建新的客户档案
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
