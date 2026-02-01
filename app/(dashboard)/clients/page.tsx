'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import { Search, Filter, ArrowUpDown, Plus } from 'lucide-react';

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

  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE' | 'OTHER'>('ALL');
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  // 计算年龄
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

  // 计算 BMI
  const calculateBMI = (height: number, weight: number) => {
    return (weight / ((height / 100) ** 2)).toFixed(1);
  };

  const getGenderLabel = (gender: string) => {
    const labels: Record<string, string> = {
      MALE: '男',
      FEMALE: '女',
      OTHER: '其他',
    };
    return labels[gender] || gender;
  };

  const getActivityLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      SEDENTARY: '久坐',
      LIGHT: '轻度',
      MODERATE: '中度',
      ACTIVE: '活跃',
      VERY_ACTIVE: '非常活跃',
    };
    return labels[level] || level;
  };

  const getActivityLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      SEDENTARY: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      LIGHT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      MODERATE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      VERY_ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    };
    return colors[level] || 'bg-zinc-100 text-zinc-700';
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: '偏瘦', color: 'text-blue-600' };
    if (bmi < 24) return { label: '正常', color: 'text-green-600' };
    if (bmi < 28) return { label: '超重', color: 'text-yellow-600' };
    return { label: '肥胖', color: 'text-red-600' };
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // 筛选和排序逻辑
  const filteredAndSortedClients = useMemo(() => {
    let filtered = [...clients];

    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone?.includes(query)
      );
    }

    // 性别筛选
    if (genderFilter !== 'ALL') {
      filtered = filtered.filter(client => client.gender === genderFilter);
    }

    // 活动水平筛选
    if (activityFilter !== 'ALL') {
      filtered = filtered.filter(client => client.activityLevel === activityFilter);
    }

    // 排序
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, 'zh-CN');
      } else if (sortBy === 'age') {
        comparison = calculateAge(a.birthDate) - calculateAge(b.birthDate);
      } else if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [clients, searchQuery, genderFilter, activityFilter, sortBy, sortOrder]);

  // 切换排序
  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // 清除筛选
  const clearFilters = () => {
    setSearchQuery('');
    setGenderFilter('ALL');
    setActivityFilter('ALL');
  };

  const stats = {
    total: clients.length,
    male: clients.filter(c => c.gender === 'MALE').length,
    female: clients.filter(c => c.gender === 'FEMALE').length,
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardNavbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              客户管理
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              管理客户档案，追踪健康数据
            </p>
          </div>
          <Link
            href="/clients/new"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Plus size={18} />
            添加客户
          </Link>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-8 text-center">
            <div className="text-zinc-500">加载中...</div>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-8 text-center">
            <div className="text-red-500">{error}</div>
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm overflow-hidden">
            <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
              <div className="text-4xl mb-4">👥</div>
              <p className="text-lg font-medium">暂无客户</p>
              <p className="text-sm mt-2">点击"添加客户"按钮创建第一个客户档案</p>
            </div>
          </div>
        ) : (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">总客户数</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                      {stats.total}
                    </p>
                  </div>
                  <div className="text-3xl">👥</div>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">男性客户</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {stats.male}
                    </p>
                  </div>
                  <div className="text-3xl">👨</div>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">女性客户</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      {stats.female}
                    </p>
                  </div>
                  <div className="text-3xl">👩</div>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">筛选结果</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                      {filteredAndSortedClients.length}
                    </p>
                  </div>
                  <div className="text-3xl">🔍</div>
                </div>
              </div>
            </div>

            {/* 搜索和筛选栏 */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-4 mb-6 border border-zinc-200 dark:border-zinc-800">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* 搜索框 */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                      type="text"
                      placeholder="搜索姓名、邮箱、手机号..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 性别筛选 */}
                <div>
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">全部性别</option>
                    <option value="MALE">男</option>
                    <option value="FEMALE">女</option>
                    <option value="OTHER">其他</option>
                  </select>
                </div>

                {/* 活动水平筛选 */}
                <div>
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">全部活动水平</option>
                    <option value="SEDENTARY">久坐</option>
                    <option value="LIGHT">轻度</option>
                    <option value="MODERATE">中度</option>
                    <option value="ACTIVE">活跃</option>
                    <option value="VERY_ACTIVE">非常活跃</option>
                  </select>
                </div>

                {/* 清除筛选 */}
                {(searchQuery || genderFilter !== 'ALL' || activityFilter !== 'ALL') && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 transition-colors"
                  >
                    清除筛选
                  </button>
                )}
              </div>
            </div>

            {/* 客户列表 */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        客户信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        基本信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        联系方式
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        创建时间
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {filteredAndSortedClients.map((client) => {
                      const age = calculateAge(client.birthDate);
                      const bmi = parseFloat(calculateBMI(client.height, client.weight));
                      const bmiCategory = getBMICategory(bmi);

                      return (
                        <tr key={client.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 dark:from-emerald-600 dark:to-emerald-800 rounded-full flex items-center justify-center mr-4 shadow-sm">
                                <span className="text-white font-bold text-sm">
                                  {getInitial(client.name)}
                                </span>
                              </div>
                              <Link
                                href={`/clients/${client.id}`}
                                className="hover:underline"
                              >
                                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                  {client.name}
                                </div>
                                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                  {getGenderLabel(client.gender)} · {age}岁
                                </div>
                              </Link>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3 text-sm text-zinc-900 dark:text-zinc-100">
                                <span>{client.height}cm</span>
                                <span>·</span>
                                <span>{client.weight}kg</span>
                                <span>·</span>
                                <span>BMI: {bmi}</span>
                                <span className={`text-xs font-medium ${bmiCategory.color}`}>
                                  ({bmiCategory.label})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${getActivityLevelColor(client.activityLevel)}`}
                                >
                                  {getActivityLevelLabel(client.activityLevel)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {client.email && (
                              <div className="text-sm text-zinc-900 dark:text-zinc-100 mb-1">
                                📧 {client.email}
                              </div>
                            )}
                            {client.phone && (
                              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                📱 {client.phone}
                              </div>
                            )}
                            {!client.email && !client.phone && (
                              <div className="text-sm text-zinc-400 dark:text-zinc-500">-</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-zinc-500 dark:text-zinc-400">
                              {new Date(client.createdAt).toLocaleDateString('zh-CN')}
                            </div>
                            <div className="text-xs text-zinc-400 dark:text-zinc-500">
                              {new Date(client.createdAt).toLocaleTimeString('zh-CN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/clients/${client.id}`}
                                className="px-3 py-1.5 text-sm bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                              >
                                详情
                              </Link>
                              <Link
                                href={`/clients/${client.id}/edit`}
                                className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                              >
                                编辑
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 无搜索结果 */}
              {filteredAndSortedClients.length === 0 && (
                <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-lg font-medium">未找到匹配的客户</p>
                  <p className="text-sm mt-2">请尝试调整搜索词或筛选条件</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 transition-colors"
                  >
                    清除所有筛选
                  </button>
                </div>
              )}
            </div>

            {/* 排序提示 */}
            {filteredAndSortedClients.length > 0 && (
              <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 text-center">
                💡 提示：点击列标题可以排序
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
