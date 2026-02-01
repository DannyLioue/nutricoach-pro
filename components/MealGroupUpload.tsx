'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { Upload, X, Calendar, AlertCircle, Info } from 'lucide-react';
import type { CreateMealGroupFormData } from '@/types';

interface MealGroupUploadProps {
  clientId: string;
  onCreateSuccess?: (mealGroup: any) => void;
  onCancel?: () => void;
  editingGroup?: any; // 用于编辑模式
}

interface PhotoToUpload {
  data: string; // Base64
  preview: string;
  fileName: string;
  isValid: boolean;
  error?: string;
  needsConversion?: boolean; // 需要转换格式
}

// 生成食谱组名称
function generateGroupName(date: string, mealType: string): string {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();
  return `${year}年${month}月${day}日${mealType}`;
}

export default function MealGroupUpload({
  clientId,
  onCreateSuccess,
  onCancel,
  editingGroup,
}: MealGroupUploadProps) {
  const [formData, setFormData] = useState({
    date: editingGroup?.date || new Date().toISOString().split('T')[0],
    mealType: (editingGroup?.mealType || '全天') as '早餐' | '午餐' | '晚餐' | '加餐' | '全天',
    notes: editingGroup?.notes || '',
    textDescription: editingGroup?.textDescription || '',
  });
  const [photos, setPhotos] = useState<PhotoToUpload[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 自动生成的名称
  const generatedName = useMemo(() => {
    return generateGroupName(formData.date, formData.mealType);
  }, [formData.date, formData.mealType]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  // 服务器端转换 HEIC 为 JPG
  const convertHeicServerSide = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/convert-heic', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      const errorMsg = data.suggestion
        ? `${data.error}: ${data.suggestion}`
        : data.error || 'HEIC 转换失败';
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data.data;
  };

  // 验证图片是否能正常加载
  const validateImage = (base64: string): Promise<{ valid: boolean; error?: string }> => {
    return new Promise((resolve) => {
      // 先检查 base64 格式是否正确
      if (!base64 || typeof base64 !== 'string') {
        resolve({ valid: false, error: '图片数据为空' });
        return;
      }

      if (!base64.startsWith('data:image/')) {
        resolve({ valid: false, error: '图片格式无效' });
        return;
      }

      // 检查 data URL 格式
      const parts = base64.split(',');
      if (parts.length !== 2 || !parts[0].includes('base64')) {
        resolve({ valid: false, error: '图片数据格式错误' });
        return;
      }

      // 检查 base64 数据部分是否为空
      const base64Data = parts[1];
      if (!base64Data || base64Data.length === 0) {
        resolve({ valid: false, error: '图片数据不完整' });
        return;
      }

      const img = new Image();
      img.onload = () => resolve({ valid: true });
      img.onerror = () => resolve({ valid: false, error: '图片加载失败' });
      setTimeout(() => {
        if (!img.complete) resolve({ valid: false, error: '图片加载超时' });
      }, 10000);
      img.src = base64;
    });
  };

  // 处理单个文件
  const processSingleFile = async (file: File): Promise<PhotoToUpload | null> => {
    if (!file.type.startsWith('image/')) {
      alert(`${file.name} 不是图片文件`);
      return null;
    }

    // 检查是否为 HEIC 格式
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' ||
                   file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');

    let fileName = file.name;

    // 如果是 HEIC，先服务器端转换
    if (isHeic) {
      try {
        const base64 = await convertHeicServerSide(file);

        // 验证转换后的图片
        const validation = await validateImage(base64);

        return {
          data: validation.valid ? base64 : '',
          preview: validation.valid ? base64 : '',
          fileName: file.name.replace(/\.heic$/i, '.jpg'),
          isValid: validation.valid,
          error: validation.error,
        };
      } catch (error) {
        console.error('HEIC 转换失败:', error);
        return {
          data: '',
          preview: '',
          fileName: file.name,
          isValid: false,
          needsConversion: true,
          error: `HEIC转换失败: ${error instanceof Error ? error.message : '未知错误'}`,
        };
      }
    }

    // 非 HEIC 文件，直接读取
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      if (!base64 || base64.length < 100) {
        return {
          data: base64,
          preview: base64,
          fileName: fileName,
          isValid: false,
          error: '图片数据不完整',
        };
      }

      const validation = await validateImage(base64);

      return {
        data: validation.valid ? base64 : '',
        preview: validation.valid ? base64 : '',
        fileName: fileName,
        isValid: validation.valid,
        error: validation.error,
      };
    } catch (error) {
      return {
        data: '',
        preview: '',
        fileName: fileName,
        isValid: false,
        error: '文件读取失败',
      };
    }
  };

  // 处理文件（用于拖拽和选择）
  const processFiles = useCallback(async (files: File[]) => {
    if (photos.length + files.length > 9) {
      alert('单次最多上传9张照片');
      return;
    }

    // 处理所有文件（不使用占位符，直接处理）
    const results = await Promise.all(
      files.map(async (file) => {
        const result = await processSingleFile(file);
        return result;
      })
    );

    // 过滤掉 null 结果，添加有效的照片
    setPhotos(prev => {
      const validResults = results.filter(r => r !== null) as PhotoToUpload[];
      return [...prev, ...validResults];
    });
  }, [photos.length]);

  // 拖拽相关事件处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 只有当离开整个拖拽区域时才取消拖拽状态
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    // 如果鼠标在元素边界外，才算真正离开
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 保持拖拽状态
    setIsDragging(true);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // 编辑模式：只需要更新日期、餐型、备注，不需要重新上传照片
    if (editingGroup) {
      setIsCreating(true);
      try {
        const submitData: CreateMealGroupFormData = {
          name: generatedName,
          date: formData.date,
          mealType: formData.mealType,
          notes: formData.notes,
          photos: [], // 编辑模式下不发送照片
          textDescription: formData.textDescription,
        };

        const response = await fetch(`/api/clients/${clientId}/meal-groups/${editingGroup.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '更新失败');
        }

        // 清空表单
        setFormData({
          date: new Date().toISOString().split('T')[0],
          mealType: '全天',
          notes: '',
          textDescription: '',
        });

        onCreateSuccess?.(data.mealGroup);
        alert('食谱组更新成功！');
      } catch (error) {
        console.error('Meal group update error:', error);
        alert((error as Error).message);
      } finally {
        setIsCreating(false);
      }
      return;
    }

    // 创建模式：需要上传照片或填写文字描述
    if (photos.length === 0 && !formData.textDescription.trim()) {
      alert('请至少上传一张照片或填写文字描述');
      return;
    }

    // 检查是否有需要转换的 HEIC 照片
    const needsConversionPhotos = photos.filter(p => p.needsConversion);
    if (needsConversionPhotos.length > 0) {
      alert(`${needsConversionPhotos.length} 张 HEIC 格式照片需要先转换为 JPG。请参考下方的转换说明。`);
      return;
    }

    // 只上传有效的照片
    const validPhotos = photos.filter(p => p.isValid);
    const invalidPhotos = photos.filter(p => !p.isValid);

    if (validPhotos.length === 0 && !formData.textDescription.trim()) {
      alert('没有有效的照片可以上传，请检查图片格式或填写文字描述');
      return;
    }

    if (invalidPhotos.length > 0) {
      const confirmMsg = `有 ${invalidPhotos.length} 张照片无法加载，是否只上传 ${validPhotos.length} 张有效照片？`;
      if (!confirm(confirmMsg)) {
        return;
      }
    }

    setIsCreating(true);

    try {
      const submitData: CreateMealGroupFormData = {
        name: generatedName,
        date: formData.date,
        mealType: formData.mealType,
        notes: formData.notes,
        textDescription: formData.textDescription,
        photos: validPhotos.length > 0 ? validPhotos.map(p => ({
          data: p.data,
          mealType: '', // 不再需要，使用食谱组的餐型
          notes: '', // 不再需要，使用食谱组的备注
        })) : undefined,
      };

      const response = await fetch(`/api/clients/${clientId}/meal-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '创建失败');
      }

      // 清空表单
      setFormData({
        date: new Date().toISOString().split('T')[0],
        mealType: '全天',
        notes: '',
        textDescription: '',
      });
      setPhotos([]);

      onCreateSuccess?.(data.mealGroup);
      alert('食谱组创建成功！');
    } catch (error) {
      console.error('Meal group operation error:', error);
      alert((error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      {/* 基本信息 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {editingGroup ? '编辑食谱组' : '创建食谱组'}
        </h3>

        {/* 自动生成的名称预览 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-medium">名称：</span>
            {generatedName}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="meal-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              日期 <span className="text-red-500">*</span>
            </label>
            <input
              id="meal-date"
              name="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-zinc-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="meal-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              餐型
            </label>
            <select
              id="meal-type"
              name="mealType"
              value={formData.mealType}
              onChange={(e) => setFormData({ ...formData, mealType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-zinc-800 dark:text-gray-100"
            >
              <option value="全天">全天</option>
              <option value="早餐">早餐</option>
              <option value="午餐">午餐</option>
              <option value="晚餐">晚餐</option>
              <option value="加餐">加餐</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="meal-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            备注
          </label>
          <textarea
            id="meal-notes"
            name="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="添加备注信息..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-zinc-800 dark:text-gray-100"
          />
        </div>

        {/* 文字描述 - 替代照片上传 */}
        {!editingGroup && (
          <div>
            <label htmlFor="text-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              食物描述 <span className="text-gray-500">(或上传照片，二选一)</span>
            </label>
            <textarea
              id="text-description"
              name="textDescription"
              value={formData.textDescription}
              onChange={(e) => setFormData({ ...formData, textDescription: e.target.value })}
              placeholder="详细描述这餐吃了什么，例如：煎蛋饼2个（用2个鸡蛋、牛奶、葱花制作），全麦面包1片，黄油10g，咖啡1杯加牛奶..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-zinc-800 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {photos.length > 0 ? '已选择照片，文字描述可选' : '如果没有照片，请填写文字描述'}
            </p>
          </div>
        )}
      </div>

      {/* 上传照片 */}
      {!editingGroup && (
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              点击上传照片（最多9张）
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              支持 JPG、PNG 格式
            </p>
            <input
              ref={(el) => {
                if (el) fileInputRef.current = el;
              }}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>
      )}

      {/* 已选照片 */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            已选择 {photos.length} 张照片
          </h4>

          <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo, index) => (
              <div
                key={index}
                className={`relative border rounded-lg overflow-hidden ${
                  photo.needsConversion
                    ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20'
                    : photo.isValid
                    ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-800'
                    : 'border-red-300 bg-red-50 dark:bg-red-900/20'
                }`}
              >
                {/* 删除按钮 */}
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* HEIC 需要转换提示 */}
                {photo.needsConversion && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500 text-white text-xs px-2 py-1 rounded-full z-10">
                    <Info className="h-2 w-2" />
                    <span>需转换</span>
                  </div>
                )}

                {/* 错误提示 */}
                {!photo.isValid && !photo.needsConversion && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10">
                    <AlertCircle className="h-2 w-2" />
                    <span>{photo.error || '失败'}</span>
                  </div>
                )}

                {/* 图片预览 */}
                {photo.preview ? (
                  <img
                    src={photo.preview}
                    alt={`照片 ${index + 1}`}
                    className={`w-full h-24 object-cover ${photo.isValid ? '' : 'opacity-50'}`}
                  />
                ) : photo.needsConversion ? (
                  <div className="w-full h-24 bg-amber-50 dark:bg-amber-900/20 flex flex-col items-center justify-center p-2">
                    <Info className="h-6 w-6 text-amber-500 mb-1" />
                    <span className="text-xs text-amber-700 dark:text-amber-300 text-center">HEIC格式</span>
                  </div>
                ) : (
                  <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* HEIC 转换提示 */}
          {photos.some(p => p.needsConversion) && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                    检测到 HEIC 格式照片
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 mb-2">
                    HEIC 是 iPhone 默认格式，需要转换为 JPG 后才能上传。请选择以下方式之一：
                  </p>
                  <ul className="space-y-1 text-amber-700 dark:text-amber-300 ml-4 list-disc">
                    <li><strong>iPhone 设置：</strong>设置 → 相机 → 格式 → 选择"兼容性最好"</li>
                    <li><strong>在线转换：</strong>搜索 "heic to jpg converter"</li>
                    <li><strong>电脑转换：</strong>macOS 预览 app 可打开并导出为 JPG</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isCreating}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            取消
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={isCreating || (!editingGroup && photos.length === 0 && !formData.textDescription.trim())}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {editingGroup ? '更新中...' : '创建中...'}
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4" />
              {editingGroup ? '更新食谱组' : '创建食谱组'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
