'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import { Users, FileText, Apple } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalReports: 0,
    totalRecommendations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // 获取统计数据
      const [clientsRes, reportsRes, recommendationsRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/reports'),
        fetch('/api/recommendations'),
      ]);

      const clientsData = await clientsRes.json();
      const reportsData = await reportsRes.json();
      const recommendationsData = await recommendationsRes.json();

      setStats({
        totalClients: clientsData.total || clientsData.clients?.length || 0,
        totalReports: reportsData.total || reportsData.reports?.length || 0,
        totalRecommendations: recommendationsData.total || recommendationsData.recommendations?.length || 0,
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardNavbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            控制台
          </h2>
          <button
            onClick={fetchStats}
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            刷新数据
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-900 dark:to-emerald-800 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 opacity-80" />
              {loading ? (
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
            </div>
            <div className="text-4xl font-bold mb-1">{loading ? '...' : stats.totalClients}</div>
            <div className="text-emerald-100">总客户数</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-900 dark:to-blue-800 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 opacity-80" />
              {loading ? (
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
            </div>
            <div className="text-4xl font-bold mb-1">{loading ? '...' : stats.totalReports}</div>
            <div className="text-blue-100">已分析报告</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-900 dark:to-purple-800 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <Apple className="w-8 h-8 opacity-80" />
              {loading ? (
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
            </div>
            <div className="text-4xl font-bold mb-1">{loading ? '...' : stats.totalRecommendations}</div>
            <div className="text-purple-100">生成建议</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            快速操作
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/clients/new"
              className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-zinc-200 dark:border-zinc-800 group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">➕</div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                添加客户
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                创建新的客户档案，记录基本信息和健康史
              </p>
            </Link>

            <Link
              href="/analysis/new"
              className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-zinc-200 dark:border-zinc-800 group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📊</div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                分析体检报告
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                上传体检报告，AI 自动分析健康指标
              </p>
            </Link>

            <Link
              href="/clients"
              className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-zinc-200 dark:border-zinc-800 group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">👥</div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                客户列表
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                查看和管理所有客户信息
              </p>
            </Link>

            <Link
              href="/recommendations"
              className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-zinc-200 dark:border-zinc-800 group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🥗</div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                生成建议
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                基于体检结果生成饮食和运动建议
              </p>
            </Link>

            <Link
              href="/settings"
              className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-zinc-200 dark:border-zinc-800 group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⚙️</div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                设置
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                配置应用设置和偏好
              </p>
            </Link>
          </div>
        </div>

        {/* Welcome Message */}
        {stats.totalClients === 0 && !loading && (
          <div className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-8 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
              欢迎使用 NutriCoach Pro 🎉
            </h3>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              您还没有添加任何客户。开始您的第一步：
            </p>
            <Link
              href="/clients/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Users className="w-5 h-5" />
              添加第一个客户
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
