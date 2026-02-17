'use client';

import { useState, useRef } from 'react';
import { X, Camera, Loader2, Sparkles, Upload } from 'lucide-react';

interface ExerciseRecordFormProps {
  initialData?: {
    date?: string;
    type?: string;
    duration?: number;
    intensity?: string;
    notes?: string;
    imageUrl?: string;
    analysis?: string;
  };
  recordId?: string; // If editing existing record
  clientId?: string; // For AI analysis
  onSubmit: (data: {
    date: string;
    type: string;
    duration: number;
    intensity?: string;
    notes?: string;
    imageUrl?: string;
  }) => Promise<void>;
  onCreateAndReturnId?: (data: {
    date: string;
    type: string;
    duration: number;
    intensity?: string;
    notes?: string;
    imageUrl?: string;
  }) => Promise<string>; // Returns the new record ID
  onCancel: () => void;
}

export default function ExerciseRecordForm({
  initialData,
  recordId,
  clientId,
  onSubmit,
  onCreateAndReturnId,
  onCancel,
}: ExerciseRecordFormProps) {
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    type: initialData?.type || '有氧',
    duration: initialData?.duration || 30,
    intensity: initialData?.intensity || '中',
    notes: initialData?.notes || '',
  });
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState(recordId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process file (shared by both select and drop)
  const processFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setAnalyzeError('请选择图片文件');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setAnalyzeError('图片大小不能超过10MB');
      return;
    }

    setAnalyzeError('');

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImageUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  // Handle file selection and convert to base64
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Handle image removal
  const handleRemoveImage = () => {
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setAnalyzeError('');
  };

  // Handle AI analysis of screenshot
  const handleAnalyze = async () => {
    if (!imageUrl) {
      setAnalyzeError('请先上传运动截图');
      return;
    }

    if (!clientId) {
      setAnalyzeError('无法分析：缺少客户ID');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeError('');

    try {
      let recordIdToUse = currentRecordId;

      // If this is a new record (no recordId yet), create it first
      if (!recordIdToUse) {
        if (!onCreateAndReturnId) {
          setAnalyzeError('无法分析：请先填写必填信息并保存记录');
          return;
        }

        // Create the record first to get an ID
        recordIdToUse = await onCreateAndReturnId({
          date: formData.date,
          type: formData.type,
          duration: formData.duration,
          intensity: formData.intensity,
          notes: formData.notes,
          imageUrl: imageUrl,
        });

        // Set the new record ID for future use
        setCurrentRecordId(recordIdToUse);
      }

      const response = await fetch(
        `/api/clients/${clientId}/exercise-records/${recordIdToUse}/analyze`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '分析失败');
      }

      // Update form with AI extracted data
      if (data.analysis) {
        const analysis = data.analysis;
        setFormData((prev) => ({
          ...prev,
          date: analysis.date || prev.date,
          type: analysis.exerciseType || prev.type,
          duration: analysis.duration?.minutes || prev.duration,
          intensity: analysis.intensity || prev.intensity,
          notes: analysis.description || prev.notes,
        }));
      }

      if (data.record) {
        setFormData((prev) => ({
          ...prev,
          date: data.record.date || prev.date,
          type: data.record.type || prev.type,
          duration: data.record.duration || prev.duration,
          intensity: data.record.intensity || prev.intensity,
        }));
      }
    } catch (error) {
      setAnalyzeError(error instanceof Error ? error.message : '分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        imageUrl: imageUrl || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 图片上传 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          运动截图（可选）
        </label>
        <div className="space-y-2">
          {!imageUrl ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                isDragging
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-400'
              }`}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-3">
                拖拽图片到这里，或点击下方按钮选择
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="exercise-image-upload"
              />
              <label
                htmlFor="exercise-image-upload"
                className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors cursor-pointer text-sm font-medium"
              >
                选择图片
              </label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={imageUrl}
                alt="运动截图"
                className="w-full max-h-64 object-contain rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          )}

          {/* AI 分析按钮 */}
          {imageUrl && recordId && clientId && (
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-md hover:from-purple-600 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI 分析中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  AI 识别截图数据
                </>
              )}
            </button>
          )}

          {/* 分析错误提示 */}
          {analyzeError && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
              {analyzeError}
            </div>
          )}

          {/* 分析提示 */}
          {imageUrl && !isAnalyzing && !analyzeError && (
            <div className="text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-md">
              💡 上传截图后，点击"AI 识别截图数据"自动填充运动信息
            </div>
          )}
        </div>
      </div>

      {/* 日期和类型 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            日期 *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            运动类型 *
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          >
            <option value="有氧">有氧运动</option>
            <option value="力量">力量训练</option>
            <option value="柔韧">柔韧性训练</option>
            <option value="其他">其他</option>
          </select>
        </div>
      </div>

      {/* 时长和强度 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            时长（分钟）*
          </label>
          <input
            type="number"
            value={formData.duration}
            onChange={(e) =>
              setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })
            }
            min="1"
            max="600"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            强度
          </label>
          <select
            value={formData.intensity}
            onChange={(e) => setFormData({ ...formData, intensity: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="低">低强度</option>
            <option value="中">中强度</option>
            <option value="高">高强度</option>
          </select>
        </div>
      </div>

      {/* 备注 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          备注（对AI识别结果进行补充说明）
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="如：跑步5公里、深蹲3组x10次..."
        />
      </div>

      {/* 按钮 */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || isAnalyzing}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {isSubmitting ? '保存中...' : '保存'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting || isAnalyzing}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          取消
        </button>
      </div>
    </form>
  );
}
