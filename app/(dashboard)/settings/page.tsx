import Link from 'next/link';
import DashboardNavbar from '@/components/layout/DashboardNavbar';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <DashboardNavbar />

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold text-zinc-900 mb-6">
          设置
        </h2>

        <div className="space-y-6">
          {/* 账户设置 */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-zinc-200">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">
              账户设置
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  邮箱
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  disabled
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-zinc-100 text-zinc-500 cursor-not-allowed"
                />
                <p className="text-sm text-zinc-500 mt-1">邮箱地址由身份验证提供商管理</p>
              </div>
            </div>
          </div>

          {/* API 设置 */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-zinc-200">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">
              API 配置
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value="•••••••••••••••••"
                  disabled
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-zinc-100 text-zinc-500"
                />
                <p className="text-sm text-zinc-500 mt-1">已在服务器环境变量中配置</p>
              </div>
            </div>
          </div>

          {/* 返回按钮 */}
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-2 bg-zinc-200 text-zinc-700 font-semibold rounded-lg hover:bg-zinc-300 transition-colors">
              返回控制台
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
