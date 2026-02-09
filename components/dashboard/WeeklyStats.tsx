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
      <div className={`glass rounded-2xl p-6 animate-scale-in ${className}`}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent-500)' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`glass rounded-2xl p-6 animate-scale-in ${className}`}>
        <div className="text-center py-8" style={{ color: '#ef4444' }}>
          <p>{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 text-sm underline"
            style={{ color: 'var(--color-accent-600)' }}
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
    <div className={`glass rounded-2xl p-6 animate-slide-up ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--color-primary-800)' }}>
          本周统计
        </h3>
        <button
          onClick={fetchStats}
          className="text-sm transition-colors hover:scale-105"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent-600)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
        >
          刷新
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          title="新增客户"
          value={totalClients}
          color="emerald"
        />
        <StatCard
          title="分析照片"
          value={totalPhotos}
          color="blue"
        />
        <StatCard
          title="生成建议"
          value={totalRecommendations}
          color="purple"
        />
      </div>

      {/* 图表 */}
      {chartData.length > 0 ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" style={{ stroke: 'var(--color-bg-400)' }} />
              <XAxis
                dataKey="date"
                style={{ fill: 'var(--color-text-muted)', fontSize: '12px' }}
                tick={{ fill: 'currentColor' }}
              />
              <YAxis style={{ fill: 'var(--color-text-muted)', fontSize: '12px' }} tick={{ fill: 'currentColor' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-primary-800)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '20px',
                  color: 'var(--color-text-secondary)',
                }}
              />
              <Line
                type="monotone"
                dataKey="新增客户"
                stroke="var(--color-primary-500)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-primary-500)', r: 4 }}
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
        <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-300)' }}>
            <TrendingUp className="w-8 h-8" style={{ color: 'var(--color-primary-400)' }} />
          </div>
          <p className="font-medium">本周暂无数据</p>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  color: 'emerald' | 'blue' | 'purple';
}

function StatCard({ title, value, color }: StatCardProps) {
  const colorConfig = {
    emerald: {
      bg: 'rgba(16, 185, 129, 0.1)',
      text: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
    blue: {
      bg: 'rgba(59, 130, 246, 0.1)',
      text: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    },
    purple: {
      bg: 'rgba(139, 92, 246, 0.1)',
      text: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    },
  };

  const config = colorConfig[color];

  return (
    <div
      className="rounded-xl p-4 text-center transition-all hover:scale-105"
      style={{ backgroundColor: config.bg }}
    >
      <div className="w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center" style={{ background: config.gradient }}>
        <span className="text-white font-display font-bold text-lg">{value}</span>
      </div>
      <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{title}</div>
    </div>
  );
}
