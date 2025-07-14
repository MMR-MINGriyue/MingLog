/**
 * 文件上传组件
 * 支持拖拽上传、进度显示、格式验证等功能
 * 集成EventBus和存储模块，提供完整的文件上传体验
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '../../utils'
import { EventBus } from '../../event-system/EventBus'

// 简单的图标组件
const UploadIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
)

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const FileTextIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const ImageIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const VideoIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

const MusicIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
)

const ArchiveIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  </svg>
)

const AlertCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

// 简单的Button组件（如果不存在的话）
const Button: React.FC<{
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}> = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  }

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-6 text-lg'
  }

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? '加载中...' : children}
    </button>
  )
}

// 文件上传相关类型定义
export interface FileUploadItem {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  url?: string
  thumbnailUrl?: string
}

export interface FileUploadConfig {
  /** 允许的文件类型 */
  acceptedTypes?: string[]
  /** 最大文件大小（字节） */
  maxFileSize?: number
  /** 最大文件数量 */
  maxFiles?: number
  /** 是否允许多文件上传 */
  multiple?: boolean
  /** 上传目录 */
  uploadPath?: string
  /** 是否自动上传 */
  autoUpload?: boolean
}

export interface FileUploadComponentProps {
  /** 上传配置 */
  config?: FileUploadConfig
  /** 上传完成回调 */
  onUploadComplete?: (files: FileUploadItem[]) => void
  /** 上传进度回调 */
  onUploadProgress?: (file: FileUploadItem) => void
  /** 上传错误回调 */
  onUploadError?: (file: FileUploadItem, error: string) => void
  /** 文件选择回调 */
  onFileSelect?: (files: File[]) => void
  /** 文件移除回调 */
  onFileRemove?: (fileId: string) => void
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义样式类名 */
  className?: string
  /** 占位符文本 */
  placeholder?: string
}

// 默认配置
const DEFAULT_CONFIG: FileUploadConfig = {
  acceptedTypes: [
    'image/*',
    'application/pdf',
    'text/*',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 10,
  multiple: true,
  uploadPath: '/uploads',
  autoUpload: true
}

// 文件类型图标映射
const getFileIcon = (file: File) => {
  const type = file.type.toLowerCase()

  if (type.startsWith('image/')) return <ImageIcon />
  if (type.startsWith('video/')) return <VideoIcon />
  if (type.startsWith('audio/')) return <MusicIcon />
  if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return <ArchiveIcon />

  return <FileTextIcon />
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 验证文件类型
const validateFileType = (file: File, acceptedTypes: string[]): boolean => {
  return acceptedTypes.some(type => {
    if (type === '*') return true
    if (type.endsWith('/*')) {
      const category = type.slice(0, -2)
      return file.type.startsWith(category + '/')
    }
    return file.type === type
  })
}

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  config = {},
  onUploadComplete,
  onUploadProgress,
  onUploadError,
  onFileSelect,
  onFileRemove,
  disabled = false,
  className,
  placeholder = '拖拽文件到此处或点击选择文件'
}) => {
  // 合并配置
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // 状态管理
  const [uploadItems, setUploadItems] = useState<FileUploadItem[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  // 引用
  const fileInputRef = useRef<HTMLInputElement>(null)
  const eventBusRef = useRef<EventBus | null>(null)
  
  // 初始化EventBus
  useEffect(() => {
    eventBusRef.current = new EventBus()
    
    return () => {
      eventBusRef.current = null
    }
  }, [])

  // 文件验证
  const validateFile = useCallback((file: File): string | null => {
    // 检查文件类型
    if (!validateFileType(file, finalConfig.acceptedTypes!)) {
      return `不支持的文件类型: ${file.type}`
    }
    
    // 检查文件大小
    if (file.size > finalConfig.maxFileSize!) {
      return `文件大小超过限制: ${formatFileSize(file.size)} > ${formatFileSize(finalConfig.maxFileSize!)}`
    }
    
    return null
  }, [finalConfig])

  // 处理文件选择
  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    // 检查文件数量限制
    if (uploadItems.length + fileArray.length > finalConfig.maxFiles!) {
      const remainingSlots = finalConfig.maxFiles! - uploadItems.length
      if (remainingSlots <= 0) {
        // 触发错误事件
        eventBusRef.current?.emit('file:upload:error', {
          error: `已达到最大文件数量限制: ${finalConfig.maxFiles}`
        })
        return
      }
      
      // 只取允许的文件数量
      fileArray.splice(remainingSlots)
    }
    
    // 验证并创建上传项
    const newUploadItems: FileUploadItem[] = []
    const validFiles: File[] = []
    
    for (const file of fileArray) {
      const error = validateFile(file)
      
      const uploadItem: FileUploadItem = {
        id: generateId(),
        file,
        progress: 0,
        status: error ? 'error' : 'pending',
        error
      }
      
      newUploadItems.push(uploadItem)
      
      if (!error) {
        validFiles.push(file)
      }
    }
    
    // 更新状态
    setUploadItems(prev => [...prev, ...newUploadItems])
    
    // 触发文件选择回调
    if (onFileSelect && validFiles.length > 0) {
      onFileSelect(validFiles)
    }
    
    // 触发事件
    eventBusRef.current?.emit('file:upload:select', {
      files: validFiles,
      totalFiles: newUploadItems.length,
      validFiles: validFiles.length
    })
    
    // 自动上传
    if (finalConfig.autoUpload && validFiles.length > 0) {
      startUpload(newUploadItems.filter(item => item.status === 'pending'))
    }
  }, [uploadItems, finalConfig, validateFile, onFileSelect])

  // 开始上传
  const startUpload = useCallback(async (items: FileUploadItem[]) => {
    if (isUploading || items.length === 0) return
    
    setIsUploading(true)
    
    try {
      // 并发上传文件
      const uploadPromises = items.map(async (item) => {
        try {
          // 更新状态为上传中
          setUploadItems(prev => 
            prev.map(prevItem => 
              prevItem.id === item.id 
                ? { ...prevItem, status: 'uploading' as const }
                : prevItem
            )
          )
          
          // 模拟上传进度
          const uploadResult = await simulateFileUpload(item, (progress) => {
            setUploadItems(prev => 
              prev.map(prevItem => 
                prevItem.id === item.id 
                  ? { ...prevItem, progress }
                  : prevItem
              )
            )
            
            // 触发进度回调
            if (onUploadProgress) {
              onUploadProgress({ ...item, progress })
            }
          })
          
          // 上传成功
          const updatedItem: FileUploadItem = {
            ...item,
            status: 'success',
            progress: 100,
            url: uploadResult.url,
            thumbnailUrl: uploadResult.thumbnailUrl
          }
          
          setUploadItems(prev => 
            prev.map(prevItem => 
              prevItem.id === item.id ? updatedItem : prevItem
            )
          )
          
          // 触发事件
          eventBusRef.current?.emit('file:upload:success', {
            file: updatedItem,
            url: uploadResult.url
          })
          
          return updatedItem
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '上传失败'
          
          // 上传失败
          const failedItem: FileUploadItem = {
            ...item,
            status: 'error',
            error: errorMessage
          }
          
          setUploadItems(prev => 
            prev.map(prevItem => 
              prevItem.id === item.id ? failedItem : prevItem
            )
          )
          
          // 触发错误回调
          if (onUploadError) {
            onUploadError(failedItem, errorMessage)
          }
          
          // 触发事件
          eventBusRef.current?.emit('file:upload:error', {
            file: failedItem,
            error: errorMessage
          })
          
          return failedItem
        }
      })
      
      const results = await Promise.all(uploadPromises)
      const successfulUploads = results.filter(item => item.status === 'success')
      
      // 触发完成回调
      if (onUploadComplete && successfulUploads.length > 0) {
        onUploadComplete(successfulUploads)
      }
      
      // 触发完成事件
      eventBusRef.current?.emit('file:upload:complete', {
        totalFiles: results.length,
        successfulFiles: successfulUploads.length,
        failedFiles: results.length - successfulUploads.length,
        files: successfulUploads
      })
      
    } finally {
      setIsUploading(false)
    }
  }, [isUploading, onUploadProgress, onUploadError, onUploadComplete])

  // 模拟文件上传（实际项目中应该调用真实的上传API）
  const simulateFileUpload = async (
    item: FileUploadItem,
    onProgress: (progress: number) => void
  ): Promise<{ url: string; thumbnailUrl?: string }> => {
    return new Promise((resolve, reject) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 20
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)

          // 模拟上传成功
          setTimeout(() => {
            resolve({
              url: `/uploads/${item.file.name}`,
              thumbnailUrl: item.file.type.startsWith('image/')
                ? `/uploads/thumbnails/${item.file.name}`
                : undefined
            })
          }, 200)
        }

        onProgress(Math.min(progress, 100))
      }, 100)

      // 模拟偶发的上传失败
      if (Math.random() < 0.1) {
        setTimeout(() => {
          clearInterval(interval)
          reject(new Error('网络连接错误'))
        }, 1000)
      }
    })
  }

  // 移除文件
  const removeFile = useCallback((fileId: string) => {
    setUploadItems(prev => prev.filter(item => item.id !== fileId))

    if (onFileRemove) {
      onFileRemove(fileId)
    }

    // 触发事件
    eventBusRef.current?.emit('file:upload:remove', { fileId })
  }, [onFileRemove])

  // 重试上传
  const retryUpload = useCallback((fileId: string) => {
    const item = uploadItems.find(item => item.id === fileId)
    if (item && item.status === 'error') {
      const retryItem = { ...item, status: 'pending' as const, error: undefined }
      setUploadItems(prev =>
        prev.map(prevItem =>
          prevItem.id === fileId ? retryItem : prevItem
        )
      )

      startUpload([retryItem])
    }
  }, [uploadItems, startUpload])

  // 拖拽事件处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }, [disabled, handleFileSelect])

  // 点击选择文件
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled])

  // 文件输入变化
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }

    // 清空input值，允许重复选择同一文件
    if (e.target) {
      e.target.value = ''
    }
  }, [handleFileSelect])

  // 手动开始上传
  const handleStartUpload = useCallback(() => {
    const pendingItems = uploadItems.filter(item => item.status === 'pending')
    if (pendingItems.length > 0) {
      startUpload(pendingItems)
    }
  }, [uploadItems, startUpload])

  // 清空所有文件
  const handleClearAll = useCallback(() => {
    setUploadItems([])
    eventBusRef.current?.emit('file:upload:clear', {})
  }, [])

  return (
    <div className={cn('file-upload-component', className)}>
      {/* 拖拽上传区域 */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
          'hover:border-blue-500 hover:bg-blue-50',
          isDragOver && 'border-blue-500 bg-blue-100',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={finalConfig.multiple}
          accept={finalConfig.acceptedTypes?.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            'bg-blue-100 text-blue-600',
            isDragOver && 'bg-blue-200'
          )}>
            <UploadIcon />
          </div>

          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">
              {placeholder}
            </p>
            <p className="text-sm text-gray-600">
              支持 {finalConfig.acceptedTypes?.join(', ')} 格式，
              单个文件最大 {formatFileSize(finalConfig.maxFileSize!)},
              最多 {finalConfig.maxFiles} 个文件
            </p>
          </div>

          {!finalConfig.autoUpload && uploadItems.some(item => item.status === 'pending') && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleStartUpload()
              }}
              loading={isUploading}
              disabled={disabled}
            >
              开始上传
            </Button>
          )}
        </div>
      </div>

      {/* 文件列表 */}
      {uploadItems.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-foreground-primary">
              文件列表 ({uploadItems.length})
            </h3>

            <div className="flex items-center gap-2">
              {!finalConfig.autoUpload && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStartUpload}
                  loading={isUploading}
                  disabled={disabled || !uploadItems.some(item => item.status === 'pending')}
                >
                  全部上传
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearAll}
                disabled={disabled || isUploading}
              >
                清空列表
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {uploadItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border',
                  'bg-surface-secondary',
                  item.status === 'error' && 'border-semantic-error bg-semantic-error/5',
                  item.status === 'success' && 'border-semantic-success bg-semantic-success/5'
                )}
              >
                {/* 文件图标 */}
                <div className="flex-shrink-0">
                  {getFileIcon(item.file)}
                </div>

                {/* 文件信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground-primary truncate">
                      {item.file.name}
                    </p>
                    <span className="text-xs text-foreground-secondary">
                      {formatFileSize(item.file.size)}
                    </span>
                  </div>

                  {/* 进度条 */}
                  {(item.status === 'uploading' || item.status === 'success') && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-foreground-secondary mb-1">
                        <span>
                          {item.status === 'uploading' ? '上传中...' : '上传完成'}
                        </span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="w-full bg-surface-tertiary rounded-full h-2">
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all duration-300',
                            item.status === 'success'
                              ? 'bg-semantic-success'
                              : 'bg-brand-primary'
                          )}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 错误信息 */}
                  {item.status === 'error' && item.error && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
                      <AlertCircleIcon />
                      <span>{item.error}</span>
                    </div>
                  )}

                  {/* 成功信息 */}
                  {item.status === 'success' && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                      <CheckCircleIcon />
                      <span>上传成功</span>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-primary hover:underline"
                        >
                          查看文件
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2">
                  {item.status === 'error' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retryUpload(item.id)}
                      disabled={disabled || isUploading}
                    >
                      重试
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(item.id)}
                    disabled={disabled || (isUploading && item.status === 'uploading')}
                  >
                    <XIcon />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
