/**
 * 文件上传组件
 * 支持图片和文档上传，集成到笔记编辑器中
 */

import React, { useCallback, useState, useRef } from 'react'
import {
  Upload,
  Image,
  FileText,
  X,
  Check,
  AlertCircle,
  Paperclip
} from 'lucide-react'

interface FileUploadProps {
  onFileUpload: (file: File, url: string) => void
  onError?: (error: string) => void
  acceptedTypes?: string[]
  maxSize?: number // in MB
  className?: string
  disabled?: boolean
}

interface UploadedFile {
  id: string
  file: File
  url: string
  status: 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  onError,
  acceptedTypes = ['image/*', '.pdf', '.doc', '.docx', '.txt', '.md'],
  maxSize = 10, // 10MB
  className = '',
  disabled = false
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 检查文件类型
  const isFileTypeAccepted = useCallback((file: File): boolean => {
    return acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      }
      if (type.includes('/*')) {
        const [mainType] = type.split('/')
        return file.type.startsWith(mainType)
      }
      return file.type === type
    })
  }, [acceptedTypes])

  // 检查文件大小
  const isFileSizeValid = useCallback((file: File): boolean => {
    return file.size <= maxSize * 1024 * 1024
  }, [maxSize])

  // 生成文件预览URL
  const generateFileUrl = useCallback((file: File): string => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file)
    }
    // 对于非图片文件，返回一个占位符URL或者文件名
    return `file://${file.name}`
  }, [])

  // 模拟文件上传
  const uploadFile = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 模拟上传进度
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          clearInterval(interval)
          // 模拟成功上传，返回文件URL
          const url = generateFileUrl(file)
          resolve(url)
        }
      }, 100)

      // 模拟可能的上传失败
      if (Math.random() < 0.1) { // 10% 失败率
        setTimeout(() => {
          clearInterval(interval)
          reject(new Error('上传失败，请重试'))
        }, 1000)
      }
    })
  }, [generateFileUrl])

  // 处理文件上传
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (disabled) return

    const validFiles: File[] = []
    const errors: string[] = []

    // 验证文件
    Array.from(files).forEach(file => {
      if (!isFileTypeAccepted(file)) {
        errors.push(`文件 "${file.name}" 类型不支持`)
        return
      }
      if (!isFileSizeValid(file)) {
        errors.push(`文件 "${file.name}" 大小超过 ${maxSize}MB`)
        return
      }
      validFiles.push(file)
    })

    // 显示错误
    if (errors.length > 0) {
      onError?.(errors.join('\n'))
      return
    }

    // 上传有效文件
    for (const file of validFiles) {
      const fileId = `${Date.now()}-${Math.random()}`
      const uploadedFile: UploadedFile = {
        id: fileId,
        file,
        url: '',
        status: 'uploading',
        progress: 0
      }

      setUploadedFiles(prev => [...prev, uploadedFile])

      try {
        const url = await uploadFile(file)
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, url, status: 'success', progress: 100 }
            : f
        ))
        onFileUpload(file, url)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '上传失败'
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'error', error: errorMessage }
            : f
        ))
        onError?.(errorMessage)
      }
    }
  }, [disabled, isFileTypeAccepted, isFileSizeValid, maxSize, uploadFile, onFileUpload, onError])

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (!disabled && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }, [disabled, handleFileUpload])

  // 点击上传
  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }, [disabled])

  // 文件输入变化
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files)
      // 清空input值，允许重复上传同一文件
      e.target.value = ''
    }
  }, [handleFileUpload])

  // 移除文件
  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  // 获取文件图标
  const getFileIcon = useCallback((file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-4 h-4" />
    }
    return <FileText className="w-4 h-4" />
  }, [])

  return (
    <div className={`file-upload ${className}`}>
      {/* 上传区域 */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="flex flex-col items-center space-y-2">
          <div className={`p-3 rounded-full ${isDragOver ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <Upload className={`w-6 h-6 ${isDragOver ? 'text-blue-600' : 'text-gray-600'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isDragOver ? '释放文件以上传' : '点击或拖拽文件到此处'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              支持 {acceptedTypes.join(', ')} 格式，最大 {maxSize}MB
            </p>
          </div>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* 上传文件列表 */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-900">上传的文件</h4>
          {uploadedFiles.map(uploadedFile => (
            <div
              key={uploadedFile.id}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-shrink-0">
                {getFileIcon(uploadedFile.file)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                
                {uploadedFile.status === 'uploading' && (
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${uploadedFile.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {uploadedFile.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">
                    {uploadedFile.error}
                  </p>
                )}
              </div>
              
              <div className="flex-shrink-0 flex items-center space-x-2">
                {uploadedFile.status === 'success' && (
                  <Check className="w-4 h-4 text-green-600" />
                )}
                {uploadedFile.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(uploadedFile.id)}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
                  title="移除文件"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 简单的文件附件显示组件
export const FileAttachment: React.FC<{
  fileName: string
  fileSize?: number
  fileUrl: string
  onRemove?: () => void
  className?: string
}> = ({ fileName, fileSize, fileUrl, onRemove, className = '' }) => {
  const isImage = fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)

  return (
    <div className={`file-attachment flex items-center space-x-2 p-2 bg-gray-100 rounded-lg ${className}`}>
      <div className="flex-shrink-0">
        {isImage ? (
          <Image className="w-4 h-4 text-blue-600" />
        ) : (
          <Paperclip className="w-4 h-4 text-gray-600" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate block"
        >
          {fileName}
        </a>
        {fileSize && (
          <p className="text-xs text-gray-500">
            {(fileSize / 1024 / 1024).toFixed(2)} MB
          </p>
        )}
      </div>
      
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
          title="移除附件"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

export default FileUpload
