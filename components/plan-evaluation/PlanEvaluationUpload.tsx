'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, X, Loader2, Apple, Dumbbell } from 'lucide-react';

interface PlanEvaluationUploadProps {
  clientId: string;
  onEvaluationComplete?: (evaluation: any) => void;
}

export function PlanEvaluationUpload({
  clientId,
  onEvaluationComplete,
}: PlanEvaluationUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [planType, setPlanType] = useState<'diet' | 'exercise'>('diet');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      validateAndSetFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);

    // 检查文件扩展名
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['txt', 'md', 'docx'];

    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      setError('不支持的文件格式，请上传 .txt、.md 或 .docx 文件');
      return;
    }

    // 检查文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError('文件大小超过 5MB，请上传更小的文件');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('planType', planType);

    try {
      const response = await fetch(`/api/clients/${clientId}/evaluate-plan`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '上传失败');
      }

      onEvaluationComplete?.(data.evaluation);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  const getPlanTypeInfo = () => {
    return planType === 'diet' ? {
      title: '饮食计划',
      icon: Apple,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: '上传包含饮食建议、食物推荐、营养补充剂的计划文件',
      placeholder: '上传饮食计划',
    } : {
      title: '运动计划',
      icon: Dumbbell,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: '上传包含运动处方、训练计划、运动注意事项的计划文件',
      placeholder: '上传运动计划',
    };
  };

  const planTypeInfo = getPlanTypeInfo();
  const PlanIcon = planTypeInfo.icon;

  return (
    <div className="space-y-6">
      {/* 计划类型选择 */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">选择计划类型</h4>
        <Tabs value={planType} onValueChange={(v) => setPlanType(v as 'diet' | 'exercise')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="diet" className="gap-2">
              <Apple className="w-4 h-4" />
              饮食计划
            </TabsTrigger>
            <TabsTrigger value="exercise" className="gap-2">
              <Dumbbell className="w-4 h-4" />
              运动计划
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 计划类型说明 */}
      <div className={`${planTypeInfo.bgColor} ${planTypeInfo.borderColor} border rounded-lg p-4`}>
        <div className="flex items-start space-x-3">
          <PlanIcon className={`w-6 h-6 ${planTypeInfo.color} mt-0.5`} />
          <div>
            <h4 className={`font-medium ${planTypeInfo.color} mb-1`}>
              {planTypeInfo.title}
            </h4>
            <p className="text-sm text-gray-600">{planTypeInfo.description}</p>
          </div>
        </div>
      </div>

      {/* 上传区域 */}
      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
          `}
        >
          <input
            type="file"
            accept=".txt,.md,.docx"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="plan-file-input"
          />
          <label htmlFor="plan-file-input" className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {uploading ? '正在处理...' : planTypeInfo.placeholder}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              拖拽文件到此处，或点击选择文件
            </p>
            <p className="text-xs text-gray-400">
              支持 .txt、.md、.docx 格式，最大 5MB
            </p>
          </label>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleRemoveFile}
              disabled={uploading}
            >
              取消
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  评估中...
                </>
              ) : (
                '开始评估'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 使用说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">使用说明</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>先选择计划类型（饮食计划或运动计划）</li>
          <li>上传对应的计划文件</li>
          <li>AI 将根据客户的健康状况自动评估计划的安全性</li>
          <li>识别潜在问题并提供专业的调整建议</li>
          <li>建议分开上传饮食和运动计划，以获得更精准的评估</li>
        </ul>
      </div>
    </div>
  );
}
