'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import { Search, Plus, Users, Activity, Heart } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  birthDate: string;
  height: number;
  weight: number;
  activityLevel: string;
  email?: string;
  phone?: string;
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '获取客户列表失败');
      }

      setClients(data.clients || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculateBMI = (height: number, weight: number) => {
    return (weight / ((height / 100) ** 2)).toFixed(1);
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(client =>
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.includes(query)
    );
  }, [clients, searchQuery]);

  const stats = {
    total: clients.length,
    male: clients.filter(c => c.gender === 'MALE').length,
    female: clients.filter(c => c.gender === 'FEMALE').length,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-100)' }}>
      <DashboardNavbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-4xl font-semibold mb-2" style={{ color: 'var(--color-primary-800)' }}>
                客户管理
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                管理客户档案，追踪健康数据
              </p>
            </div>
            <Link
              href="/clients/new"
              className="group flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-700) 100%)' }}
            >
              <Plus className="w-5 h-5" />
              添加客户
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="glass rounded-2xl p-12 text-center animate-scale-in">
            <div className="inline-flex items-center gap-3" style={{ color: 'var(--color-text-muted)' }}>
              <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-accent-500)', borderTopColor: 'transparent' }} />
              <span>加载中...</span>
            </div>
          </div>
        ) : error ? (
          <div className="glass rounded-2xl p-12 text-center animate-scale-in">
            <div className="text-red-500 font-medium">{error}</div>
          </div>
        ) : clients.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center animate-scale-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-100)' }}>
              <Users className="w-10 h-10" style={{ color: 'var(--color-primary-400)' }} />
            </div>
            <h3 className="font-display text-2xl font-semibold mb-2" style={{ color: 'var(--color-primary-700)' }}>
              暂无客户
            </h3>
            <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>点击"添加客户"按钮创建第一个客户档案</p>
            <Link
              href="/clients/new"
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, var(--color-accent-400) 0%, var(--color-accent-600) 100%)' }}
            >
              <Plus className="w-5 h-5" />
              创建第一个客户
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-slide-up delay-100">
              <StatCard
                title="总客户数"
                value={stats.total}
                icon={<Users className="w-6 h-6" />}
                color="primary"
              />
              <StatCard
                title="男性客户"
                value={stats.male}
                icon={<Activity className="w-6 h-6" />}
                color="accent"
              />
              <StatCard
                title="女性客户"
                value={stats.female}
                icon={<Heart className="w-6 h-6" />}
                color="primary"
              />
            </div>

            {/* Search Bar */}
            <div className="glass rounded-2xl p-4 mb-8 animate-slide-up delay-200">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  placeholder="搜索客户姓名、邮箱或手机号..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/70 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: 'var(--color-primary-200)', color: 'var(--color-text-primary)', '--tw-ring-color': 'var(--color-accent-500)' } as React.CSSProperties}
                />
              </div>
            </div>

            {/* Client Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up delay-300">
              {filteredClients.map((client, index) => {
                const age = calculateAge(client.birthDate);
                const bmi = parseFloat(calculateBMI(client.height, client.weight));

                return (
                  <ClientCard
                    key={client.id}
                    client={client}
                    age={age}
                    bmi={bmi}
                    index={index}
                  />
                );
              })}
            </div>

            {/* No Results */}
            {filteredClients.length === 0 && searchQuery && (
              <div className="glass rounded-2xl p-12 text-center animate-scale-in">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-100)' }}>
                  <Search className="w-8 h-8" style={{ color: 'var(--color-primary-400)' }} />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--color-primary-700)' }}>
                  未找到匹配的客户
                </h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>请尝试调整搜索词</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'primary' | 'accent';
}) {
  const gradientStyle = color === 'primary'
    ? 'linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-700) 100%)'
    : 'linear-gradient(135deg, var(--color-accent-400) 0%, var(--color-accent-600) 100%)';

  return (
    <div className="card p-6 hover:scale-105 transition-transform duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: gradientStyle }}>
          <span className="text-white">{icon}</span>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl font-bold" style={{ color: 'var(--color-primary-800)' }}>
            {value}
          </div>
        </div>
      </div>
      <div className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
        {title}
      </div>
    </div>
  );
}

// Client Card Component
function ClientCard({
  client,
  age,
  bmi,
  index,
}: {
  client: Client;
  age: number;
  bmi: number;
  index: number;
}) {
  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: '偏瘦', color: 'bg-blue-100 text-blue-700' };
    if (bmi < 24) return { label: '正常', color: 'bg-green-100 text-green-700' };
    if (bmi < 28) return { label: '超重', color: 'bg-yellow-100 text-yellow-700' };
    return { label: '肥胖', color: 'bg-red-100 text-red-700' };
  };

  const bmiCategory = getBMICategory(bmi);

  return (
    <Link
      href={`/clients/${client.id}`}
      className="group card p-6 hover:scale-105 transition-all duration-300 animate-slide-up block"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow" style={{ background: 'linear-gradient(135deg, var(--color-accent-400) 0%, var(--color-accent-600) 100%)' }}>
            <span className="text-white font-display font-bold text-xl">
              {getInitial(client.name)}
            </span>
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold group-hover:text-accent-600 transition-colors" style={{ color: 'var(--color-primary-800)' }}>
              {client.name}
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {client.gender === 'MALE' ? '男' : client.gender === 'FEMALE' ? '女' : '其他'} · {age} 岁
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>身高</span>
          <span className="font-mono font-semibold" style={{ color: 'var(--color-primary-700)' }}>{client.height} cm</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>体重</span>
          <span className="font-mono font-semibold" style={{ color: 'var(--color-primary-700)' }}>{client.weight} kg</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>BMI</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold" style={{ color: 'var(--color-primary-700)' }}>{bmi}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${bmiCategory.color}`}>
              {bmiCategory.label}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--color-primary-100)' }}>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {new Date(client.createdAt).toLocaleDateString('zh-CN')}
        </span>
        <span className="text-sm font-medium group-hover:text-accent-700 transition-colors" style={{ color: 'var(--color-accent-600)' }}>
          查看详情 →
        </span>
      </div>
    </Link>
  );
}
