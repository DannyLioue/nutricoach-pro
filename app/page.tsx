import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="text-center px-6 py-12">
        {/* Logo / Title */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
            NutriCoach Pro
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            营养师智能分析平台
          </p>
        </div>

        {/* Description */}
        <p className="max-w-2xl mx-auto text-lg text-zinc-700 dark:text-zinc-300 mb-12 leading-relaxed">
          上传客户体检报告，利用 AI 自动生成全面的饮食和运动建议。
          <br />
          专为专业营养师打造，让健康管理更智能、更高效。
        </p>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-lg mb-2">智能分析</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              AI 自动识别体检报告，检测异常指标与健康风险
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md">
            <div className="text-3xl mb-3">🥗</div>
            <h3 className="font-semibold text-lg mb-2">饮食建议</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              基于体检结果生成个性化膳食计划和营养补充方案
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md">
            <div className="text-3xl mb-3">🏃</div>
            <h3 className="font-semibold text-lg mb-2">运动处方</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              根据体能状况定制运动计划，包含强度和频率建议
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full transition-colors shadow-lg"
          >
            进入控制台
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold rounded-full transition-colors shadow-md border border-zinc-200 dark:border-zinc-700"
          >
            登录 / 注册
          </Link>
        </div>

        {/* Tech Stack */}
        <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Powered by <span className="font-semibold">Gemini 3.0 Pro</span> • Built with <span className="font-semibold">Next.js</span>
          </p>
        </div>
      </div>
    </div>
  );
}
