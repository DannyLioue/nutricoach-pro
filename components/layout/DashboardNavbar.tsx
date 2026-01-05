'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function DashboardNavbar() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            NutriCoach Pro
          </h1>
          <nav className="flex gap-4">
            <Link href="/dashboard" className="text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400">
              控制台
            </Link>
            <Link href="/clients" className="text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400">
              客户管理
            </Link>
            <Link href="/analysis" className="text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400">
              报告分析
            </Link>
            <Link href="/recommendations" className="text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400">
              建议记录
            </Link>
            <Link href="/settings" className="text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400">
              设置
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {session?.user?.name || '用户'}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {session?.user?.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            登出
          </button>
        </div>
      </div>
    </header>
  );
}
