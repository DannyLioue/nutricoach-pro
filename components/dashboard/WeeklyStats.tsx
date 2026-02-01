'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';

interface DataPoint {
  date: string;
  fullDate: string;
  count: number;
}

interface WeeklyStatsData {
  clients: DataPoint[];
  photos: DataPoint[];
  recommendations: DataPoint[];
}

interface WeeklyStatsProps {
  className?: string;
}

export default function WeeklyStats({ className = '' }: WeeklyStatsProps) {
  const [stats, setStats] = useState<WeeklyStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard/weekly-stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('获取统计数据失败:', err);
      setError('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 ${className}`}>
        <div className="text-center py-8 text-red-600 dark:text-red-400">
          <p>{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 text-sm underline text-emerald-600 hover:text-emerald-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  // 合并所有数据到一个数组
  const chartData = stats?.clients.map((client) => ({
    date: client.date,
    新增客户: client.count,
    分析照片: stats.photos.find((p) => p.date === client.date)?.count || 0,
    生成建议: stats.recommendations.find((r) => r.date === client.date)?.count || 0,
  })) || [];

  // 计算总数
  const totalClients = stats?.clients.reduce((sum, item) => sum + item.count, 0) || 0;
  const totalPhotos = stats?.photos.reduce((sum, item) => sum + item.count, 0) || 0;
  const totalRecommendations = stats?.recommendations.reduce((sum, item) => sum + item.count, 0) || 0;

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          本周统计
        </h3>
        <button
          onClick={fetchStats}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          刷新
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          title="新增客户"
          value={totalClients}
          color="text-emerald-600"
          bgColor="bg-emerald-50 dark:bg-emerald-900/20"
        />
        <StatCard
          title="分析照片"
          value={totalPhotos}
          color="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          title="生成建议"
          value={totalRecommendations}
          color="text-purple-600"
          bgColor="bg-purple-50 dark:bg-purple-900/20"
        />
      </div>

      {/* 图表 */}
      {chartData.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
              <XAxis
                dataKey="date"
                className="text-zinc-600 dark:text-zinc-400 text-sm"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis className="text-zinc-600 dark:text-zinc-400 text-sm" tick={{ fill: 'currentColor' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '20px',
                  color: '#71717a',
                }}
              />
              <Line
                type="monotone"
                dataKey="新增客户"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="分析照片"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="生成建议"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>本周暂无数据</p>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, color, bgColor }: StatCardProps) {
  return (
    <div className={`rounded-lg ${bgColor} p-4 text-center`}>
      <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>
      <div className="text-sm text-zinc-600 dark:text-zinc-400">{title}</div>
    </div>
  );
}
