'use client';

import { useSession, signOut } from 'next-auth/react';

export default function DebugAuthPage() {
  const { data: session, status } = useSession();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen p-8 bg-zinc-50 dark:bg-zinc-950">
      <h1 className="text-2xl font-bold mb-4">认证状态调试</h1>

      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <p><strong>登录状态：</strong> {status === 'authenticated' ? '✅ 已登录' : '❌ 未登录'}</p>
          <p><strong>状态：</strong> {status}</p>
        </div>

        {session && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <p className="font-semibold mb-2">用户信息：</p>
            <pre className="text-sm">{JSON.stringify(session.user, null, 2)}</pre>
          </div>
        )}

        <div className="flex gap-4">
          {session && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              登出
            </button>
          )}

          <a
            href="/"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            返回首页
          </a>

          <a
            href={session ? '/dashboard' : '/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {session ? '进入控制台' : '去登录'}
          </a>
        </div>
      </div>
    </div>
  );
}
