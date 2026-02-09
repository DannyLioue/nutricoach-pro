'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Plus, Trash2, Save, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface TaskConfig {
  taskType: string;
  taskName: string;
  description: string;
  currentModel: {
    modelId: string;
    displayName: string;
    provider: string;
    providerName: string;
  } | null;
  availableModels: Array<{
    modelId: string;
    displayName: string;
    provider: string;
    providerName: string;
  }>;
  isCustomConfigured: boolean;
}

interface UserKey {
  id: string;
  providerId: string;
  displayName: string;
  keyLast4: string;
  isValid: boolean;
  lastValidated?: string;
}

interface ConfigData {
  keys: UserKey[];
  providers: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
  preferences?: {
    defaultProvider?: string;
    useEnvFallback: boolean;
  };
}

export default function SettingsPage() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [tasks, setTasks] = useState<TaskConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // API key form state
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKey, setNewKey] = useState({ providerId: '', apiKey: '' });
  const [showKey, setShowKey] = useState(false);
  const [addingKey, setAddingKey] = useState(false);

  // Task config state
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchConfig();
    fetchTasks();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/ai/config');
      const data = await res.json();
      setConfig(data);
    } catch (err: any) {
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/ai/tasks');
      const data = await res.json();
      setTasks(data.tasks || []);

      // Initialize selected models
      const initial: Record<string, string> = {};
      data.tasks?.forEach((task: TaskConfig) => {
        if (task.currentModel) {
          initial[task.taskType] = task.currentModel.modelId;
        }
      });
      setSelectedModels(initial);
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
    }
  };

  const handleAddKey = async () => {
    if (!newKey.providerId || !newKey.apiKey) {
      setError('Please fill in all fields');
      return;
    }

    setAddingKey(true);
    setError('');
    try {
      const res = await fetch('/api/ai/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add key');
      }

      setSuccess('API key added successfully');
      setNewKey({ providerId: '', apiKey: '' });
      setShowAddKey(false);
      fetchConfig();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingKey(false);
    }
  };

  const handleRemoveKey = async (providerId: string) => {
    if (!confirm('Are you sure you want to remove this API key?')) return;

    setError('');
    try {
      const res = await fetch(`/api/ai/keys?providerId=${providerId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to remove key');
      }

      setSuccess('API key removed');
      fetchConfig();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/ai/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelConfigs: Object.entries(selectedModels).map(([taskType, modelId]) => ({
            taskType,
            modelId,
            enabled: true,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save configuration');
      }

      setSuccess('Configuration saved');
      fetchTasks();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen organic-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent-500)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen organic-bg">
      <DashboardNavbar />

      <main className="max-w-6xl mx-auto px-6 py-8 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-semibold mb-2" style={{ color: 'var(--color-primary-800)' }}>
              AI 模型配置
            </h1>
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              管理您的 AI 服务提供商和 API 密钥
            </p>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-white/50 transition-all"
            style={{ borderColor: 'var(--color-primary-200)' }}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>返回控制台</span>
          </Link>
        </div>

        {/* Messages */}
        {error && (
          <div className="glass rounded-xl p-4 mb-6 flex items-center gap-3 animate-slide-up" style={{ border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}>
            <XCircle className="w-5 h-5" style={{ color: '#ef4444' }} />
            <p className="text-sm" style={{ color: '#991b1b' }}>{error}</p>
          </div>
        )}

        {success && (
          <div className="glass rounded-xl p-4 mb-6 flex items-center gap-3 animate-slide-up" style={{ border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4' }}>
            <CheckCircle className="w-5 h-5" style={{ color: '#16a34a' }} />
            <p className="text-sm" style={{ color: '#15803d' }}>{success}</p>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px] glass rounded-xl p-1">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:shadow-md transition-all">
              模型概览
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="rounded-lg data-[state=active]:shadow-md transition-all">
              API 密钥
            </TabsTrigger>
            <TabsTrigger value="task-config" className="rounded-lg data-[state=active]:shadow-md transition-all">
              任务配置
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 animate-slide-up">
            <Card className="glass rounded-2xl hover:scale-[1.01] transition-all">
              <CardHeader>
                <CardTitle className="font-display text-xl" style={{ color: 'var(--color-primary-800)' }}>
                  当前 AI 模型使用情况
                </CardTitle>
                <CardDescription style={{ color: 'var(--color-text-muted)' }}>
                  查看各个功能模块使用的 AI 模型
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.taskType} className="flex items-center justify-between py-4" style={{ borderBottom: '1px solid var(--color-bg-300)' }}>
                      <div className="flex-1">
                        <div className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>{task.taskName}</div>
                        <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{task.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.currentModel ? (
                          <>
                            <Badge variant="outline" className="rounded-full px-3">{task.currentModel.provider}</Badge>
                            <Badge className="rounded-full px-3" style={{ backgroundColor: 'var(--color-primary-100)', color: 'var(--color-primary-800)' }}>
                              {task.currentModel.displayName}
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="outline" className="rounded-full px-3">未配置</Badge>
                        )}
                        {task.isCustomConfigured && (
                          <Badge variant="secondary" className="rounded-full text-xs">自定义</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass rounded-2xl hover:scale-[1.01] transition-all">
              <CardHeader>
                <CardTitle className="font-display text-xl" style={{ color: 'var(--color-primary-800)' }}>
                  环境变量回退
                </CardTitle>
                <CardDescription style={{ color: 'var(--color-text-muted)' }}>
                  当用户没有配置 API 密钥时，系统会使用环境变量中的密钥
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${config?.preferences?.useEnvFallback ?? true ? 'shadow-lg' : ''}`} style={{ backgroundColor: config?.preferences?.useEnvFallback ?? true ? 'var(--color-primary-500)' : 'var(--color-bg-500)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {config?.preferences?.useEnvFallback ?? true ? '已启用' : '已禁用'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-6 animate-slide-up">
            <Card className="glass rounded-2xl hover:scale-[1.01] transition-all">
              <CardHeader>
                <CardTitle className="font-display text-xl" style={{ color: 'var(--color-primary-800)' }}>
                  API 密钥管理
                </CardTitle>
                <CardDescription style={{ color: 'var(--color-text-muted)' }}>
                  为不同 AI 提供商配置 API 密钥。密钥将被加密存储。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {config?.keys?.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md" style={{ borderColor: 'var(--color-primary-200)', backgroundColor: 'var(--color-bg-50)' }}>
                      <div>
                        <div className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>{key.displayName}</div>
                        <div className="text-sm flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                          <span className="font-mono">••• {key.keyLast4}</span>
                          <span>•</span>
                          <span className={key.isValid ? '' : 'line-through'}>{key.isValid ? '有效' : '无效'}</span>
                          {key.lastValidated && (
                            <span>• 验证于 {new Date(key.lastValidated).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveKey(key.providerId)}
                        className="hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {showAddKey ? (
                    <div className="p-6 rounded-xl space-y-4 border-2" style={{ backgroundColor: 'var(--color-bg-100)', borderColor: 'var(--color-accent-300)' }}>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>提供商</label>
                        <select
                          className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                          style={{ borderColor: 'var(--color-primary-300)', backgroundColor: 'white' }}
                          value={newKey.providerId}
                          onChange={(e) => setNewKey({ ...newKey, providerId: e.target.value })}
                        >
                          <option value="">选择提供商...</option>
                          {config?.providers?.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>API 密钥</label>
                        <div className="relative">
                          <input
                            type={showKey ? 'text' : 'password'}
                            className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 pr-12"
                            style={{ borderColor: 'var(--color-primary-300)' }}
                            placeholder="输入 API 密钥..."
                            value={newKey.apiKey}
                            onChange={(e) => setNewKey({ ...newKey, apiKey: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleAddKey}
                          disabled={addingKey}
                          className="rounded-xl px-6 py-3"
                          style={{ background: 'linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-700) 100%)', color: 'white' }}
                        >
                          {addingKey ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              添加中...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              添加密钥
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddKey(false);
                            setNewKey({ providerId: '', apiKey: '' });
                          }}
                          className="rounded-xl px-6 py-3"
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowAddKey(true)}
                      className="rounded-xl px-6 py-3"
                      style={{ background: 'linear-gradient(135deg, var(--color-accent-400) 0%, var(--color-accent-600) 100%)', color: 'white' }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      添加 API 密钥
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Task Config Tab */}
          <TabsContent value="task-config" className="space-y-6 animate-slide-up">
            <Card className="glass rounded-2xl hover:scale-[1.01] transition-all">
              <CardHeader>
                <CardTitle className="font-display text-xl" style={{ color: 'var(--color-primary-800)' }}>
                  任务模型配置
                </CardTitle>
                <CardDescription style={{ color: 'var(--color-text-muted)' }}>
                  为每个任务类型选择使用的 AI 模型
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.taskType} className="p-4 rounded-xl border transition-all hover:shadow-md" style={{ borderColor: 'var(--color-primary-200)', backgroundColor: 'var(--color-bg-50)' }}>
                      <div className="mb-3">
                        <div className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>{task.taskName}</div>
                        <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{task.description}</div>
                      </div>
                      <select
                        className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 bg-white"
                        style={{ borderColor: 'var(--color-primary-300)' }}
                        value={selectedModels[task.taskType] || ''}
                        onChange={(e) => setSelectedModels({
                          ...selectedModels,
                          [task.taskType]: e.target.value,
                        })}
                      >
                        <option value="">使用默认模型</option>
                        {task.availableModels.map((model) => (
                          <option key={model.modelId} value={model.modelId}>
                            {model.provider} - {model.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}

                  <Button
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="rounded-xl px-6 py-3 w-full sm:w-auto"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-700) 100%)', color: 'white' }}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        保存配置
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
