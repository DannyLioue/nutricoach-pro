'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardNavbar from '@/components/layout/DashboardNavbar';

function AnalysisEditContent() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [useExisting, setUseExisting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const reportRes = await fetch(`/api/reports/${reportId}`);
      const reportData = await reportRes.json();

      if (!reportRes.ok) {
        throw new Error(reportData.error || '获取报告失败');
      }

      setReport(reportData.report);

      // 获取客户信息
      if (reportData.report?.clientId) {
        const clientRes = await fetch(`/api/clients/${reportData.report.clientId}`);
        const clientData = await clientRes.json();
        if (clientRes.ok) {
          setClient(clientData.client);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setUseExisting(false);
    }
  };

  const processFile = useCallback((droppedFile: File) => {
    // 验证文件类型
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(droppedFile.type) && !droppedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('不支持的文件格式，请上传 PNG, JPG 或 PDF 文件');
      return;
    }

    // 验证文件大小 (10MB)
    if (droppedFile.size > 10 * 1024 * 1024) {
      setError('文件大小超过 10MB');
      return;
    }

    setFile(droppedFile);
    setError('');
    setUseExisting(false);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleReanalyze = async () => {
    if (!useExisting && !file) {
      setError('请选择新的体检报告文件');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      let fileToAnalyze = file;
      let fileName = file?.name;
      let fileType = file?.type;

      // 如果使用现有报告
      if (useExisting) {
        const fileResponse = await fetch(`/api/reports/${reportId}/file`);
        if (!fileResponse.ok) {
          const fileError = await fileResponse.json();
          throw new Error(fileError.error || '读取原始报告失败');
        }
        const blob = await fileResponse.blob();
        fileType = blob.type || report.fileType;
        fileName = report.fileName;
        fileToAnalyze = new File([blob], report.fileName, { type: fileType });
      }

      if (!fileToAnalyze || !fileName || !fileType) {
        throw new Error('文件处理失败');
      }

      const formData = new FormData();
      formData.append('file', fileToAnalyze);
      formData.append('clientId', report.clientId);
      formData.append('fileName', fileName);
      formData.append('fileType', fileType);

      const res = await fetch('/api/reports/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '重新分析失败');
      }

      // 更新当前报告的分析结果（而不是创建新报告）
      if (useExisting && data.analysis) {
        // 删除新创建的报告，只更新当前报告
        await fetch(`/api/reports/${data.report.id}`, { method: 'DELETE' });

        // 更新当前报告
        await fetch(`/api/reports/${reportId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysis: data.analysis }),
        });

        // 刷新页面
        fetchReport();
      } else if (data.report?.id) {
        // 上传新文件，跳转到新报告
        router.push(`/analysis/${data.report.id}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <DashboardNavbar />
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-8 text-center">
            <div className="text-zinc-500">加载中...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <DashboardNavbar />
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-8 text-center">
            <p className="text-red-500">报告不存在</p>
            <Link
              href="/analysis"
              className="text-emerald-600 hover:underline mt-4 inline-block"
            >
              返回列表
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const hasAnalysisError = report.analysis?.error || !report.analysis?.indicators || report.analysis.indicators.length === 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardNavbar />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              重新分析体检报告
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              {client?.name} - {report.fileName}
            </p>
          </div>
          <Link
            href={`/analysis/${reportId}`}
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            返回详情
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800">
          {/* 当前报告信息 */}
          <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              当前报告
            </h3>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <p>文件名: {report.fileName}</p>
              <p>上传时间: {new Date(report.uploadedAt).toLocaleString('zh-CN')}</p>
              {hasAnalysisError && (
                <p className="text-amber-600 dark:text-amber-400">
                  ⚠️ 上次分析失败或结果不完整
                </p>
              )}
            </div>
          </div>

          {/* 选项选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              选择分析方式
            </label>
            <div className="space-y-3">
              <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${useExisting ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400'}`}>
                <input
                  type="radio"
                  name="analyzeOption"
                  checked={useExisting}
                  onChange={() => {
                    setUseExisting(true);
                    setFile(null);
                    setError('');
                  }}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    使用当前报告重新分析
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    重新分析已上传的报告文件，更新分析结果。适用于 AI 分析失败或需要重新分析的情况。
                  </div>
                </div>
              </label>

              <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${!useExisting ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400'}`}>
                <input
                  type="radio"
                  name="analyzeOption"
                  checked={!useExisting}
                  onChange={() => {
                    setUseExisting(false);
                    setError('');
                  }}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    上传新的体检报告
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    上传新的报告文件，创建新的分析记录。原报告将保留在历史记录中。
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 上传新文件选项 */}
          {!useExisting && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                上传新的体检报告 *
              </label>
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500'
                }`}
              >
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
          )}

          {/* 说明 */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              {useExisting ? '重新分析说明' : '上传新文件说明'}
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              {useExisting ? (
                <>
                  <li>使用当前已上传的报告文件重新进行 AI 分析</li>
                  <li>更新当前报告的分析结果，不创建新记录</li>
                  <li>适用于之前的分析失败或结果不理想的情况</li>
                </>
              ) : (
                <>
                  <li>上传新的体检报告将创建新的分析记录</li>
                  <li>原报告记录不会被删除，可在历史记录中查看</li>
                  <li>可以对比不同时期的健康变化</li>
                </>
              )}
            </ul>
          </div>

          {/* 按钮 */}
          <div className="flex gap-4">
            <button
              onClick={handleReanalyze}
              disabled={analyzing || (!useExisting && !file)}
              className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-400 text-white font-semibold rounded-lg transition-colors"
            >
              {analyzing ? '分析中...' : '开始分析'}
            </button>
            <Link
              href={`/analysis/${reportId}`}
              className="flex-1 px-6 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-lg hover:bg-zinc-300 transition-colors text-center"
            >
              取消
            </Link>
          </div>
        </div>

        {/* 历史记录 */}
        <div className="mt-6">
          <Link
            href={`/analysis?clientId=${client?.id}`}
            className="text-sm text-emerald-600 hover:text-emerald-700"
          >
            查看该客户的所有分析报告 →
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function AnalysisEditPage() {
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
      <AnalysisEditContent />
    </Suspense>
  );
}
