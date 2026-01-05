'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardNavbar from '@/components/layout/DashboardNavbar';

function AnalysisNewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = searchParams.get('clientId');

  const [selectedClientId, setSelectedClientId] = useState(clientId || '');
  const [clients, setClients] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClients();
    if (clientId) {
      setSelectedClientId(clientId);
    }
  }, [clientId]);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (res.ok) {
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error('获取客户列表失败:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedClientId) {
      setError('请选择客户');
      return;
    }
    if (!file) {
      setError('请上传体检报告文件');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // 创建 FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', selectedClientId);
      formData.append('fileName', file.name);
      formData.append('fileType', file.type);

      // 上传并分析
      const res = await fetch('/api/reports/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '上传分析失败');
      }

      setResult({
        success: true,
        report: data.report,
        analysis: data.analysis,
      });

      // 成功后跳转到分析详情页面
      if (data.report?.id) {
        setTimeout(() => {
          router.push(`/analysis/${data.report.id}`);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message);
      setResult(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardNavbar />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              上传体检报告
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              上传体检报告，AI 将自动分析健康指标并生成建议
            </p>
          </div>
          <Link
            href="/analysis"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            返回列表
          </Link>
        </div>

        {result && result.success && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <p className="text-emerald-700 dark:text-emerald-300 font-medium">
              ✓ 上传成功！正在跳转到分析结果...
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800">
          {/* 选择客户 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              选择客户 *
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
              disabled={!!clientId}
            >
              <option value="">请选择客户</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {clientId && (
              <p className="text-sm text-zinc-500 mt-1">
                从客户列表跳转，已自动选中客户
              </p>
            )}
          </div>

          {/* 上传文件 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              上传体检报告 *
            </label>
            <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-zinc-300 dark:border-zinc-700 border-dashed rounded-lg hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors">
              <div className="space-y-2 text-center">
                <div className="text-4xl">📄</div>
                <div className="flex text-sm text-zinc-600 dark:text-zinc-400">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white dark:bg-zinc-800 rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none"
                  >
                    <span>选择文件</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">或拖拽文件到此处</p>
                </div>
                <p className="text-xs text-zinc-500">
                  支持 PNG, JPG, PDF 格式，最大 10MB
                </p>
                {file && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    已选择: {file.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 提示信息 */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              AI 分析功能说明
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>自动识别和提取体检报告中的关键健康指标</li>
              <li>分析异常指标并提供健康风险评估</li>
              <li>基于客户信息生成个性化的饮食和运动建议</li>
              <li>生成专业的分析报告，可导出 PDF</li>
            </ul>
          </div>

          {/* 按钮 */}
          <div className="flex gap-4">
            <button
              onClick={handleAnalyze}
              disabled={uploading || !selectedClientId || !file}
              className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-400 text-white font-semibold rounded-lg transition-colors"
            >
              {uploading ? '上传分析中...' : '开始分析'}
            </button>
            <Link
              href="/analysis"
              className="flex-1 px-6 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-lg hover:bg-zinc-300 transition-colors text-center"
            >
              取消
            </Link>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-6 bg-zinc-100 dark:bg-zinc-800 p-6 rounded-xl">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            📋 上传说明
          </h3>
          <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-2">
            <li>• 支持常规体检报告、血液检查报告、身体成分分析等</li>
            <li>• 请确保报告图片或 PDF 清晰可见，信息完整</li>
            <li>• AI 将自动识别姓名、性别、年龄、各项指标等关键信息</li>
            <li>• 分析过程通常需要 10-30 秒，请耐心等待</li>
            <li>• 分析完成后可查看详细结果并导出 PDF 报告</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default function AnalysisNewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <DashboardNavbar />
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-8 text-center">
            <div className="text-zinc-500">加载中...</div>
          </div>
        </main>
      </div>
    }>
      <AnalysisNewContent />
    </Suspense>
  );
}
