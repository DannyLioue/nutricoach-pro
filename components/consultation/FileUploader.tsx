'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, FileAudio, FileImage, FileText, Loader2 } from 'lucide-react';
import { validateAudioFile, validateImageFile, fileToBase64, formatFileSize, MAX_AUDIO_SIZE_MB, MAX_IMAGE_SIZE_MB } from '@/lib/utils/fileUtils';
import { validateTextFile, extractTextFromFile, getTextFileType } from '@/lib/utils/textFileUtils';

interface UploadedFile {
  data: string;
  fileName: string;
  fileSize: number;
  content?: string;       // 文本文件的提取内容
  fileType?: 'txt' | 'md' | 'doc' | 'docx';  // 文本文件类型
}

interface FileUploaderProps {
  onFilesChange: (files: UploadedFile[]) => void;
  acceptedTypes: Array<'audio' | 'image' | 'text'>;
  maxFiles?: number;
  className?: string;
}

const MAX_TEXT_SIZE_MB = 5;

export default function FileUploader({
  onFilesChange,
  acceptedTypes,
  maxFiles = 10,
  className = '',
}: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptedFileTypes = () => {
    const types: string[] = [];
    if (acceptedTypes.includes('audio')) {
      types.push('audio/*');
    }
    if (acceptedTypes.includes('image')) {
      types.push('image/*');
    }
    if (acceptedTypes.includes('text')) {
      types.push('.txt,.md,.doc,.docx');
    }
    return types.join(',');
  };

  const getAcceptedTypesText = () => {
    const types: string[] = [];
    if (acceptedTypes.includes('audio')) {
      types.push('MP3、M4A、WAV、WEBM');
    }
    if (acceptedTypes.includes('image')) {
      types.push('JPG、PNG、WEBP、GIF');
    }
    if (acceptedTypes.includes('text')) {
      types.push('TXT、MD、DOC、DOCX');
    }
    return types.join('、');
  };

  const getMaxSizeText = () => {
    const sizes: string[] = [];
    if (acceptedTypes.includes('audio')) {
      sizes.push(`音频${MAX_AUDIO_SIZE_MB}MB`);
    }
    if (acceptedTypes.includes('image')) {
      sizes.push(`图片${MAX_IMAGE_SIZE_MB}MB`);
    }
    if (acceptedTypes.includes('text')) {
      sizes.push(`文本${MAX_TEXT_SIZE_MB}MB`);
    }
    return sizes.join('，');
  };

  const isTextFile = (file: File): boolean => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    return ['txt', 'md', 'doc', 'docx'].includes(extension);
  };

  const validateFile = (file: File) => {
    if (acceptedTypes.includes('audio') && file.type.startsWith('audio/')) {
      return validateAudioFile(file);
    }
    if (acceptedTypes.includes('image') && file.type.startsWith('image/')) {
      return validateImageFile(file);
    }
    if (acceptedTypes.includes('text') && isTextFile(file)) {
      return validateTextFile(file);
    }
    return {
      valid: false,
      error: '不支持的文件格式',
    };
  };

  const processFiles = async (fileList: FileList) => {
    if (files.length + fileList.length > maxFiles) {
      setErrors([`已达到文件数量上限，最多上传 ${maxFiles} 个文件`]);
      return;
    }

    setProcessing(true);
    setErrors([]);

    const processedFiles: UploadedFile[] = [];
    const newErrors: string[] = [];

    for (const file of Array.from(fileList)) {
      const validation = validateFile(file);

      if (!validation.valid) {
        newErrors.push(`${file.name}: ${validation.error}`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        const processedFile: UploadedFile = {
          data: base64,
          fileName: file.name,
          fileSize: file.size,
        };

        // 对于文本文件，提取内容
        if (acceptedTypes.includes('text') && isTextFile(file)) {
          const extractionResult = await extractTextFromFile(file);
          if (extractionResult.success && extractionResult.content) {
            processedFile.content = extractionResult.content;
            processedFile.fileType = getTextFileType(file);
          } else {
            newErrors.push(`${file.name}: ${extractionResult.error || '文本提取失败'}`);
            continue;
          }
        }

        processedFiles.push(processedFile);
      } catch (error) {
        newErrors.push(`${file.name}: 文件处理失败`);
      }
    }

    const updatedFiles = [...files, ...processedFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);

    if (newErrors.length > 0) {
      setErrors(newErrors);
    }

    setProcessing(false);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [files]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [files]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const getFileIcon = (fileName: string, fileType?: string) => {
    if (fileType === 'txt' || fileType === 'md' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      return <FileText size={20} className="text-blue-600" />;
    }
    if (fileType === 'doc' || fileType === 'docx' || fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return <FileText size={20} className="text-blue-700" />;
    }
    if (['mp3', 'm4a', 'wav', 'webm', 'ogg'].includes(fileName.split('.').pop()?.toLowerCase() || '')) {
      return <FileAudio size={20} className="text-blue-600" />;
    }
    return <FileImage size={20} className="text-emerald-600" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dropzone */}
      <div
        data-testid="dropzone"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
          ${processing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptedFileTypes()}
          multiple
          onChange={handleFileInput}
          className="hidden"
          disabled={processing}
        />

        {processing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-gray-500" />
            <p className="text-gray-600">正在处理文件...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload size={32} className="text-gray-500" />
            <div>
              <p className="text-gray-700 font-medium">拖拽文件到此处，或点击选择文件</p>
              <p className="text-sm text-gray-500 mt-1">
                支持 {getAcceptedTypesText()} 格式，单个文件大小不超过 {getMaxSizeText()}
              </p>
              {maxFiles && (
                <p className="text-sm text-gray-500">最多上传 {maxFiles} 个文件</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div data-testid="file-list" className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(file.fileName, file.fileType)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.fileName}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</p>
                  {file.content && (
                    <p className="text-xs text-blue-600 mt-1">
                      {file.content.slice(0, 50)}{file.content.length > 50 ? '...' : ''}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                aria-label={`删除 ${file.fileName}`}
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
