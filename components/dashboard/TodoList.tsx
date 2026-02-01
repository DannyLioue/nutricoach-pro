'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, FileText, UtensilsCrossed, ChevronRight, Loader2 } from 'lucide-react';

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
            onClick={fetchTodos}
            className="mt-4 text-sm underline text-emerald-600 hover:text-emerald-700"
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
      <div className={`bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
            太棒了！
          </h3>
          <p className="text-emerald-700 dark:text-emerald-300">
            所有待办事项已完成
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          待办事项
        </h3>
        <button
          onClick={fetchTodos}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
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
            iconColor="text-blue-600"
            bgColor="bg-blue-50 dark:bg-blue-900/20"
            borderColor="border-blue-200 dark:border-blue-800"
          >
            {todos?.pendingPhotos?.slice(0, 3).map((photo) => (
              <TodoItem
                key={photo.id}
                title={`${photo.clientName} - ${photo.mealType || '未分类'}`}
                subtitle={new Date(photo.uploadedAt).toLocaleDateString()}
                href={`/clients/${photo.clientId}`}
              />
            ))}
            {photoCount > 3 && (
              <div className="text-xs text-zinc-500 mt-2">
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
            iconColor="text-purple-600"
            bgColor="bg-purple-50 dark:bg-purple-900/20"
            borderColor="border-purple-200 dark:border-purple-800"
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
              <div className="text-xs text-zinc-500 mt-2">
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
            iconColor="text-orange-600"
            bgColor="bg-orange-50 dark:bg-orange-900/20"
            borderColor="border-orange-200 dark:border-orange-800"
          >
            {todos?.pendingMealGroups?.slice(0, 3).map((group) => (
              <TodoItem
                key={group.id}
                title={`${group.clientName} - ${group.name}`}
                subtitle={`${group.photoCount} 张照片`}
                href={`/clients/${group.clientId}`}
              />
            ))}
            {mealGroupCount > 3 && (
              <div className="text-xs text-zinc-500 mt-2">
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
  iconColor: string;
  bgColor: string;
  borderColor: string;
  children: React.ReactNode;
}

function TodoCard({ title, count, icon, iconColor, bgColor, borderColor, children }: TodoCardProps) {
  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-4`}>
      <div className={`flex items-center gap-2 mb-3 ${iconColor}`}>
        {icon}
        <span className="font-semibold">{title}</span>
        <span className="ml-auto bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-full text-sm font-bold">
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
      className="block p-2 rounded-md bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {title}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0 ml-2" />
      </div>
    </Link>
  );
}
