'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Upload, FileText } from 'lucide-react';
import FileUploader from './FileUploader';
import type { CreateConsultationFormData } from '@/types';

interface ConsultationFormProps {
  clientId: string;
  consultationId?: string;
  initialData?: Partial<CreateConsultationFormData>;
}

export default function ConsultationForm({ clientId, consultationId, initialData }: ConsultationFormProps) {
  const isEdit = !!consultationId;
  const router = useRouter();
  const [consultationType, setConsultationType] = useState(initialData?.consultationType || '复诊');
  const [sessionNotes, setSessionNotes] = useState(initialData?.sessionNotes || '');
  const [pastedText, setPastedText] = useState('');
  const [images, setImages] = useState<Array<{ data: string; description?: string }>>(initialData?.images || []);
  const [textFiles, setTextFiles] = useState<Array<{ data: string; fileName: string; fileSize: number; content?: string; fileType?: 'txt' | 'md' | 'doc' | 'docx' }>>(initialData?.textFiles || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [
          ...prev,
          {
            data: reader.result as string,
            description: '',
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageDescriptionChange = (index: number, description: string) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, description } : img))
    );
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Edit mode: only update consultationType and sessionNotes
    if (isEdit) {
      if (!consultationId) return;

      setIsSubmitting(true);
      try {
        const requestBody: any = { consultationType };
        if (sessionNotes.trim()) {
          requestBody.sessionNotes = sessionNotes;
        }

        console.log('[ConsultationForm] Updating:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`/api/clients/${clientId}/consultations/${consultationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (response.status === 401) {
          alert('登录已过期，请重新登录');
          window.location.href = '/auth/signin';
          return;
        }

        const data = await response.json();
        if (!response.ok) {
          const errorMsg = data.error || '更新失败';
          throw new Error(errorMsg);
        }

        alert('咨询记录已更新');
        router.push(`/clients/${clientId}/consultations/${consultationId}`);
      } catch (error) {
        console.error('[ConsultationForm] Update error:', error);
        alert('更新失败：' + (error as Error).message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Create mode
    // Combine pasted text with uploaded text files that have content
    const allTextFiles = [...textFiles];
    if (pastedText.trim()) {
      allTextFiles.push({
        data: '', // Not used by API, only content is used
        fileName: `粘贴文本-${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}.txt`,
        fileSize: new Blob([pastedText]).size,
        content: pastedText,
        fileType: 'txt' as const,
      });
    }

    // Filter out files without content (shouldn't happen, but just in case)
    const validTextFiles = allTextFiles.filter(tf => tf.content && tf.content.trim().length > 0);

    if (!sessionNotes.trim() && images.length === 0 && validTextFiles.length === 0) {
      alert('请至少填写咨询内容、上传图片或文本文件');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build request body - only include fields that have data
      const requestBody: any = {
        consultationType,
      };

      if (sessionNotes.trim()) {
        requestBody.sessionNotes = sessionNotes;
      }

      if (images.length > 0) {
        requestBody.images = images;
      }

      if (validTextFiles.length > 0) {
        requestBody.textFiles = validTextFiles.map(tf => ({
          content: tf.content!,
          fileName: tf.fileName,
          fileType: tf.fileType || 'txt',
        }));
      }

      console.log('[ConsultationForm] Submitting:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`/api/clients/${clientId}/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      // Handle 401 Unauthorized specifically
      if (response.status === 401) {
        alert('登录已过期，请重新登录');
        window.location.href = '/auth/signin';
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data.error || '创建失败';
        const details = data.details ? `\n详情: ${JSON.stringify(data.details)}` : '';
        throw new Error(errorMsg + details);
      }

      alert('咨询记录已创建');
      const newConsultationId = data.consultation.id;
      router.push(`/clients/${clientId}/consultations/${newConsultationId}`);
    } catch (error) {
      console.error('[ConsultationForm] Submit error:', error);
      alert('创建失败：' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const consultationTypes = ['初诊', '复诊', '电话咨询', '在线咨询', '微信咨询', '其他'];

  return (
    <div className="space-y-6">
      {/* 咨询类型 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          咨询类型 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {consultationTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setConsultationType(type)}
              className={`px-3 py-2 rounded-lg border-2 transition-colors ${
                consultationType === type
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {!isEdit && (
        <>
          {/* 文本文件上传 - 仅创建模式 */}
          <div>
            <FileUploader
              onFilesChange={setTextFiles}
              acceptedTypes={['text']}
              maxFiles={10}
            />
            <p className="text-xs text-gray-500 mt-2">
              支持上传 TXT、MD、DOC、DOCX 格式的文本文件，最大 5MB
            </p>
          </div>

          {/* 直接粘贴文本 - 仅创建模式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <FileText size={16} />
                咨询内容 <span className="text-gray-500 font-normal">（可直接粘贴文本）</span>
              </span>
            </label>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="在此粘贴咨询记录文本内容，如：客户主诉、病史、症状、诊断结果、治疗方案等..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-y font-mono text-sm"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">
                {pastedText.length} 字
              </p>
              {pastedText.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPastedText('')}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  清空内容
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* 备注说明 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          备注说明 <span className="text-gray-500 font-normal">（可选）</span>
        </label>
        <textarea
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          placeholder="补充说明：可记录咨询后的总结思考、下次随访计划、其他补充信息..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {sessionNotes.length} 字
        </p>
      </div>

      {!isEdit && (
        /* 图片上传 - 仅创建模式 */
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            相关图片
          </label>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
                <Upload size={18} className="text-gray-500" />
                <span className="text-sm text-gray-600">上传图片</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-gray-500">支持 JPG、PNG、WEBP、GIF 格式</span>
            </div>

            {images.map((image, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                <img
                  src={image.data}
                  alt={`上传图片 ${index + 1}`}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={image.description || ''}
                    onChange={(e) => handleImageDescriptionChange(index, e.target.value)}
                    placeholder="图片描述（可选）"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save size={18} />
          {isSubmitting ? (isEdit ? '更新中...' : '保存中...') : (isEdit ? '更新记录' : '保存记录')}
        </button>
      </div>
    </div>
  );
}
