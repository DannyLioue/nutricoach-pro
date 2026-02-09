'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, FileText, UtensilsCrossed, ChevronRight, Loader2, CheckCircle } from 'lucide-react';

interface PendingPhoto {
  id: string;
  clientId: string;
  clientName: string;
  uploadedAt: string;
  mealType: string | null;
}

interface PendingRecommendation {
  id: string;
  name: string;
  hasReports: boolean;
  reportsCount: number;
}

interface PendingMealGroup {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  photoCount: number;
  createdAt: string;
}

interface DashboardTodos {
  pendingPhotos: PendingPhoto[];
  pendingRecommendations: PendingRecommendation[];
  pendingMealGroups: PendingMealGroup[];
}

interface TodoListProps {
  className?: string;
}

export default function TodoList({ className = '' }: TodoListProps) {
  const [todos, setTodos] = useState<DashboardTodos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard/todos');
      const data = await res.json();
      setTodos(data);
    } catch (err) {
      console.error('获取待办事项失败:', err);
      setError('获取待办事项失败');
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
            onClick={fetchTodos}
            className="mt-4 text-sm underline"
            style={{ color: 'var(--color-accent-600)' }}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  const photoCount = todos?.pendingPhotos?.length || 0;
  const recommendationCount = todos?.pendingRecommendations?.length || 0;
  const mealGroupCount = todos?.pendingMealGroups?.length || 0;
  const totalCount = photoCount + recommendationCount + mealGroupCount;

  if (totalCount === 0) {
    return (
      <div className={`glass rounded-2xl p-8 animate-slide-up ${className}`} style={{ background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-accent-50) 100%)' }}>
        <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary-400) 0%, var(--color-primary-600) 100%)' }}>
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--color-primary-800)' }}>
            太棒了！
          </h3>
          <p style={{ color: 'var(--color-primary-700)' }}>
            所有待办事项已完成
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass rounded-2xl p-6 animate-slide-up ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--color-primary-800)' }}>
          待办事项
        </h3>
        <button
          onClick={fetchTodos}
          className="text-sm transition-colors hover:scale-105"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent-600)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
        >
          刷新
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* 待分析照片 */}
        {photoCount > 0 && (
          <TodoCard
            title="待分析照片"
            count={photoCount}
            icon={<Camera className="w-5 h-5" />}
            color="blue"
          >
            {todos?.pendingPhotos?.slice(0, 3).map((photo) => (
              <TodoItem
                key={photo.id}
                title={`${photo.clientName} - ${photo.mealType || '未分类'}`}
                subtitle={new Date(photo.uploadedAt).toLocaleDateString()}
                href={`/clients/${photo.clientId}?tab=diet-records`}
              />
            ))}
            {photoCount > 3 && (
              <div className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                还有 {photoCount - 3} 项...
              </div>
            )}
          </TodoCard>
        )}

        {/* 待生成建议 */}
        {recommendationCount > 0 && (
          <TodoCard
            title="待生成建议"
            count={recommendationCount}
            icon={<FileText className="w-5 h-5" />}
            color="purple"
          >
            {todos?.pendingRecommendations?.slice(0, 3).map((client) => (
              <TodoItem
                key={client.id}
                title={client.name}
                subtitle={`有 ${client.reportsCount} 份体检报告`}
                href={`/recommendations/new?clientId=${client.id}`}
              />
            ))}
            {recommendationCount > 3 && (
              <div className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                还有 {recommendationCount - 3} 项...
              </div>
            )}
          </TodoCard>
        )}

        {/* 待分析食谱组 */}
        {mealGroupCount > 0 && (
          <TodoCard
            title="待分析食谱组"
            count={mealGroupCount}
            icon={<UtensilsCrossed className="w-5 h-5" />}
            color="orange"
          >
            {todos?.pendingMealGroups?.slice(0, 3).map((group) => (
              <TodoItem
                key={group.id}
                title={`${group.clientName} - ${group.name}`}
                subtitle={`${group.photoCount} 张照片`}
                href={`/clients/${group.clientId}?tab=diet-records&mealGroupId=${group.id}`}
              />
            ))}
            {mealGroupCount > 3 && (
              <div className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                还有 {mealGroupCount - 3} 项...
              </div>
            )}
          </TodoCard>
        )}
      </div>
    </div>
  );
}

interface TodoCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'orange';
  children: React.ReactNode;
}

function TodoCard({ title, count, icon, color, children }: TodoCardProps) {
  const colorConfig = {
    blue: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'var(--color-primary-200)',
      text: '#3b82f6',
      iconBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    },
    purple: {
      bg: 'rgba(139, 92, 246, 0.1)',
      border: 'var(--color-primary-200)',
      text: '#8b5cf6',
      iconBg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    },
    orange: {
      bg: 'rgba(249, 115, 22, 0.1)',
      border: 'var(--color-primary-200)',
      text: '#f97316',
      iconBg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    },
  };

  const config = colorConfig[color];

  return (
    <div className="rounded-xl p-4 transition-all hover:scale-[1.02]" style={{ backgroundColor: config.bg, border: `1px solid ${config.border}` }}>
      <div className="flex items-center gap-2 mb-3" style={{ color: config.text }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: config.iconBg }}>
          <span className="text-white">{icon}</span>
        </div>
        <span className="font-semibold">{title}</span>
        <span className="ml-auto px-2 py-0.5 rounded-full text-sm font-bold bg-white shadow-sm">
          {count}
        </span>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

interface TodoItemProps {
  title: string;
  subtitle: string;
  href: string;
}

function TodoItem({ title, subtitle, href }: TodoItemProps) {
  return (
    <Link
      href={href}
      className="block p-3 rounded-lg bg-white hover:bg-white/80 transition-all hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {subtitle}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 flex-shrink-0 ml-2" style={{ color: 'var(--color-text-muted)' }} />
      </div>
    </Link>
  );
}
