'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, AlertCircle, Info } from 'lucide-react';

interface DietPhotoUploadProps {
  clientId: string;
  onUploadSuccess?: (photos: any[]) => void;
  maxSize?: number; // MB
}

interface PhotoToUpload {
  data: string; // Base64
  mealType?: string;
  notes?: string;
  preview: string;
  fileName: string;
  isValid: boolean;
  error?: string;
  needsConversion?: boolean; // 需要转换格式
}

export default function DietPhotoUpload({
  clientId,
  onUploadSuccess,
  maxSize = 5,
}: DietPhotoUploadProps) {
  const [photos, setPhotos] = useState<PhotoToUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 验证图片是否能正常加载
  const validateImage = (base64: string, fileName: string): Promise<{ valid: boolean; error?: string }> => {
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
      img.onload = () => {
        resolve({ valid: true });
      };
      img.onerror = () => {
        resolve({ valid: false, error: '图片加载失败' });
      };
      // 设置超时
      setTimeout(() => {
        if (!img.complete) {
          resolve({ valid: false, error: '图片加载超时' });
        }
      }, 10000);
      img.src = base64;
    });
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

    // 验证返回的数据格式
    if (!data.data || typeof data.data !== 'string') {
      throw new Error('HEIC 转换返回数据无效');
    }

    if (!data.data.startsWith('data:image/')) {
      throw new Error('HEIC 转换返回格式错误');
    }

    return data.data;
  };

  // 处理单个文件
  const processFile = async (file: File, tempIndex: number) => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert(`${file.name} 不是图片文件`);
      return null;
    }

    // 验证文件大小
    if (file.size > maxSize * 1024 * 1024) {
      alert(`${file.name} 超过${maxSize}MB限制`);
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
        const validation = await validateImage(base64, fileName);

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
    // 读取文件并转换为 Base64
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 验证 Base64 数据是否完整
      if (!base64 || base64.length < 100) {
        return {
          data: base64,
          preview: base64,
          fileName: fileName,
          isValid: false,
          error: '图片数据不完整',
        };
      }

      // 验证图片是否能加载
      const validation = await validateImage(base64, fileName);

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

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (photos.length + files.length > 9) {
      alert('单次最多上传9张照片');
      return;
    }

    // 直接处理所有文件，不使用占位符
    const results = await Promise.all(
      files.map((file) => processFile(file, 0))
    );

    // 过滤掉 null 结果，添加有效的照片
    setPhotos(prev => {
      const validResults = results.filter(r => r !== null) as PhotoToUpload[];
      return [...prev, ...validResults];
    });

    // 重置 input 以允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理文件（用于拖拽和选择）
  const processFiles = useCallback(async (files: File[]) => {
    if (photos.length + files.length > 9) {
      alert('单次最多上传9张照片');
      return;
    }

    // 直接处理所有文件，不使用占位符
    const results = await Promise.all(
      files.map((file) => processFile(file, 0))
    );

    // 过滤掉 null 结果，添加有效的照片
    setPhotos(prev => {
      const validResults = results.filter(r => r !== null) as PhotoToUpload[];
      return [...prev, ...validResults];
    });
  }, [photos.length, maxSize]);

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

  // 移除照片
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // 更新餐型
  const updateMealType = (index: number, mealType: string) => {
    setPhotos(prev =>
      prev.map((photo, i) =>
        i === index ? { ...photo, mealType } : photo
      )
    );
  };

  // 更新备注
  const updateNotes = (index: number, notes: string) => {
    setPhotos(prev =>
      prev.map((photo, i) =>
        i === index ? { ...photo, notes } : photo
      )
    );
  };

  // 上传照片
  const handleUpload = async () => {
    if (photos.length === 0) {
      alert('请至少选择一张照片');
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

    if (validPhotos.length === 0) {
      alert('没有有效的照片可以上传，请检查图片格式');
      return;
    }

    if (invalidPhotos.length > 0) {
      const confirmMsg = `有 ${invalidPhotos.length} 张照片无法加载，是否只上传 ${validPhotos.length} 张有效照片？`;
      if (!confirm(confirmMsg)) {
        return;
      }
    }

    setIsUploading(true);

    try {
      // 只发送有效照片的数据
      const photosToUpload = validPhotos.map(p => ({
        data: p.data,
        mealType: p.mealType,
        notes: p.notes,
      }));

      const response = await fetch(`/api/clients/${clientId}/diet-photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: photosToUpload }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '上传失败');
      }

      // 清空照片列表
      setPhotos([]);

      // 触发成功回调
      onUploadSuccess?.(data.photos);

      alert(`成功上传 ${data.photos.length} 张照片`);
    } catch (error) {
      console.error('Upload error:', error);
      alert((error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          点击上传或拖拽照片到此处
        </p>
        <p className="text-sm text-gray-500">
          支持同时上传多张照片（最多9张）
        </p>
        <p className="text-xs text-gray-400 mt-2">
          格式：JPG, PNG，每张不超过{maxSize}MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* 已选照片预览 */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700">
            已选择 {photos.length} 张照片
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div
                key={index}
                className={`relative border rounded-lg overflow-hidden ${
                  photo.needsConversion
                    ? 'bg-amber-50 border-amber-300'
                    : photo.isValid
                    ? 'bg-white'
                    : 'bg-red-50 border-red-300'
                }`}
              >
                {/* 删除按钮 */}
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* HEIC 需要转换提示 */}
                {photo.needsConversion && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500 text-white text-xs px-2 py-1 rounded-full z-10">
                    <Info className="h-3 w-3" />
                    <span>需转换</span>
                  </div>
                )}

                {/* 错误提示 */}
                {!photo.isValid && !photo.needsConversion && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10">
                    <AlertCircle className="h-3 w-3" />
                    <span>{photo.error || '加载失败'}</span>
                  </div>
                )}

                {/* 图片预览 */}
                {photo.preview ? (
                  <img
                    src={photo.preview}
                    alt={`预览 ${index + 1}`}
                    className={`w-full h-48 object-cover ${photo.isValid ? '' : 'opacity-50'}`}
                  />
                ) : photo.needsConversion ? (
                  <div className="w-full h-48 bg-amber-50 flex flex-col items-center justify-center">
                    <Info className="h-12 w-12 text-amber-500 mb-2" />
                    <p className="text-sm text-amber-700">HEIC 格式</p>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <AlertCircle className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="p-3 space-y-2">
                  <div>
                    <label htmlFor={`photo-mealtype-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      餐型（可选）
                    </label>
                    <select
                      id={`photo-mealtype-${index}`}
                      name={`photo-mealtype-${index}`}
                      value={photo.mealType || ''}
                      onChange={(e) => updateMealType(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">未选择</option>
                      <option value="早餐">早餐</option>
                      <option value="午餐">午餐</option>
                      <option value="晚餐">晚餐</option>
                      <option value="加餐">加餐</option>
                    </select>
                  </div>

                  {/* 备注 */}
                  <div>
                    <label htmlFor={`photo-notes-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      备注（可选）
                    </label>
                    <input
                      id={`photo-notes-${index}`}
                      name={`photo-notes-${index}`}
                      type="text"
                      value={photo.notes || ''}
                      onChange={(e) => updateNotes(index, e.target.value)}
                      placeholder="添加备注..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* HEIC 转换提示 */}
          {photos.some(p => p.needsConversion) && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-amber-800 mb-2">
                    检测到 HEIC 格式照片
                  </p>
                  <p className="text-amber-700 mb-2">
                    HEIC 是 iPhone 默认格式，需要转换为 JPG 后才能上传。请选择以下方式之一：
                  </p>
                  <ul className="space-y-1 text-amber-700 ml-4 list-disc">
                    <li><strong>iPhone 设置：</strong>设置 → 相机 → 格式 → 选择"兼容性最好"</li>
                    <li><strong>在线转换：</strong>搜索 "heic to jpg converter"</li>
                    <li><strong>电脑转换：</strong>macOS 预览 app 可打开并导出为 JPG</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 上传按钮 */}
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isUploading ? '上传中...' : '上传照片'}
            </button>
            <button
              onClick={() => setPhotos([])}
              disabled={isUploading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              清空
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
