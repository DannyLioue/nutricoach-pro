'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { usePathname } from 'next/navigation';

export default function DashboardNav() {
  const { logout } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: '控制台' },
    { href: '/clients', label: '客户管理' },
    { href: '/analysis', label: '报告分析' },
    { href: '/recommendations', label: '建议管理' },
    { href: '/settings', label: '设置' },
  ];

  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          NutriCoach Pro
        </Link>
        <nav className="flex items-center gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${
                pathname === item.href
                  ? 'text-emerald-600 font-medium'
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-emerald-600'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="px-4 py-1.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
          >
            登出
          </button>
        </nav>
      </div>
    </header>
  );
}
