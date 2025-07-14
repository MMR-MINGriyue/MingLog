/**
 * 文件预览组件
 * 支持图片、文档、视频、音频等多格式预览，响应式设计
 * 集成文件存储服务，提供完整的文件预览体验
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { cn } from '../../utils'
import { FileStorageService, type FileEntity } from '../../services/FileStorageService'

// 简单的图标组件
const PlayIcon = () => (
  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z"/>
  </svg>
)

const PauseIcon = () => (
  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>
)

const VolumeIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
  </svg>
)

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const FullscreenIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ErrorIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const LoadingIcon = () => (
  <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

// 预览模式枚举
export type PreviewMode = 'inline' | 'modal' | 'fullscreen'

// 预览状态枚举
export type PreviewStatus = 'loading' | 'loaded' | 'error' | 'unsupported'

// 文件预览组件属性
export interface FilePreviewComponentProps {
  /** 文件实体或文件ID */
  file: FileEntity | string
  /** 文件存储服务实例 */
  fileStorageService: FileStorageService
  /** 预览模式 */
  mode?: PreviewMode
  /** 是否显示控制栏 */
  showControls?: boolean
  /** 是否显示文件信息 */
  showFileInfo?: boolean
  /** 是否允许下载 */
  allowDownload?: boolean
  /** 是否允许全屏 */
  allowFullscreen?: boolean
  /** 最大宽度 */
  maxWidth?: number
  /** 最大高度 */
  maxHeight?: number
  /** 自定义样式类名 */
  className?: string
  /** 自定义样式 */
  style?: React.CSSProperties
  /** 预览状态变化回调 */
  onStatusChange?: (status: PreviewStatus) => void
  /** 关闭回调（模态框模式） */
  onClose?: () => void
  /** 错误回调 */
  onError?: (error: string) => void
}

// 媒体控制状态
interface MediaControlState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
}

/**
 * 文件预览组件
 */
export const FilePreviewComponent: React.FC<FilePreviewComponentProps> = ({
  file,
  fileStorageService,
  mode = 'inline',
  showControls = true,
  showFileInfo = true,
  allowDownload = true,
  allowFullscreen = true,
  maxWidth = 800,
  maxHeight = 600,
  className,
  style,
  onStatusChange,
  onClose,
  onError
}) => {
  // 状态管理
  const [fileEntity, setFileEntity] = useState<FileEntity | null>(null)
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>('loading')
  const [fileUrl, setFileUrl] = useState<string>('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mediaControl, setMediaControl] = useState<MediaControlState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false
  })

  // 引用
  const containerRef = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null)

  // 获取文件实体
  useEffect(() => {
    const loadFile = async () => {
      try {
        setPreviewStatus('loading')
        
        let entity: FileEntity | null = null
        
        if (typeof file === 'string') {
          entity = await fileStorageService.getFile(file)
        } else {
          entity = file
        }
        
        if (!entity) {
          throw new Error('文件不存在')
        }
        
        setFileEntity(entity)
        setFileUrl(entity.url || entity.path)
        setPreviewStatus('loaded')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '加载文件失败'
        setPreviewStatus('error')
        onError?.(errorMessage)
      }
    }

    loadFile()
  }, [file, fileStorageService, onError])

  // 状态变化通知
  useEffect(() => {
    onStatusChange?.(previewStatus)
  }, [previewStatus, onStatusChange])

  // 获取文件类型
  const fileType = useMemo(() => {
    if (!fileEntity) return 'unknown'
    
    const type = fileEntity.type.toLowerCase()
    if (type.startsWith('image/')) return 'image'
    if (type.startsWith('video/')) return 'video'
    if (type.startsWith('audio/')) return 'audio'
    if (type.includes('pdf')) return 'pdf'
    if (type.startsWith('text/')) return 'text'
    if (type.includes('word') || type.includes('document')) return 'document'
    if (type.includes('excel') || type.includes('spreadsheet')) return 'spreadsheet'
    if (type.includes('powerpoint') || type.includes('presentation')) return 'presentation'
    
    return 'unknown'
  }, [fileEntity])

  // 是否支持预览
  const isSupported = useMemo(() => {
    return ['image', 'video', 'audio', 'pdf', 'text'].includes(fileType)
  }, [fileType])

  // 处理媒体播放控制
  const handlePlayPause = useCallback(() => {
    const media = mediaRef.current
    if (!media) return

    if (mediaControl.isPlaying) {
      media.pause()
    } else {
      media.play()
    }
  }, [mediaControl.isPlaying])

  // 处理音量控制
  const handleVolumeChange = useCallback((volume: number) => {
    const media = mediaRef.current
    if (!media) return

    media.volume = volume
    setMediaControl(prev => ({ ...prev, volume, isMuted: volume === 0 }))
  }, [])

  // 处理静音切换
  const handleMuteToggle = useCallback(() => {
    const media = mediaRef.current
    if (!media) return

    const newMuted = !mediaControl.isMuted
    media.muted = newMuted
    setMediaControl(prev => ({ ...prev, isMuted: newMuted }))
  }, [mediaControl.isMuted])

  // 处理进度条拖拽
  const handleSeek = useCallback((time: number) => {
    const media = mediaRef.current
    if (!media) return

    media.currentTime = time
    setMediaControl(prev => ({ ...prev, currentTime: time }))
  }, [])

  // 处理全屏切换
  const handleFullscreenToggle = useCallback(() => {
    if (!allowFullscreen) return

    if (isFullscreen) {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    } else {
      containerRef.current?.requestFullscreen?.()
      setIsFullscreen(true)
    }
  }, [isFullscreen, allowFullscreen])

  // 处理下载
  const handleDownload = useCallback(() => {
    if (!allowDownload || !fileEntity || !fileUrl) return

    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileEntity.original_name
    link.click()
  }, [allowDownload, fileEntity, fileUrl])

  // 媒体事件处理
  const handleMediaLoadedMetadata = useCallback(() => {
    const media = mediaRef.current
    if (!media) return

    setMediaControl(prev => ({
      ...prev,
      duration: media.duration || 0
    }))
  }, [])

  const handleMediaTimeUpdate = useCallback(() => {
    const media = mediaRef.current
    if (!media) return

    setMediaControl(prev => ({
      ...prev,
      currentTime: media.currentTime || 0
    }))
  }, [])

  const handleMediaPlay = useCallback(() => {
    setMediaControl(prev => ({ ...prev, isPlaying: true }))
  }, [])

  const handleMediaPause = useCallback(() => {
    setMediaControl(prev => ({ ...prev, isPlaying: false }))
  }, [])

  const handleMediaError = useCallback(() => {
    setPreviewStatus('error')
    onError?.('媒体加载失败')
  }, [onError])

  // 格式化时间
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // 格式化文件大小
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  // 渲染加载状态
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
      <LoadingIcon />
      <p className="mt-2 text-sm">正在加载文件...</p>
    </div>
  )

  // 渲染错误状态
  const renderError = () => (
    <div className="flex flex-col items-center justify-center p-8 text-red-500">
      <ErrorIcon />
      <p className="mt-2 text-sm">文件加载失败</p>
      {allowDownload && fileEntity && (
        <button
          onClick={handleDownload}
          className="mt-2 text-xs text-blue-600 hover:underline"
        >
          尝试下载文件
        </button>
      )}
    </div>
  )

  // 渲染不支持的文件类型
  const renderUnsupported = () => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
        <span className="text-2xl">📄</span>
      </div>
      <p className="text-sm mb-2">不支持预览此文件类型</p>
      <p className="text-xs text-gray-400 mb-4">{fileEntity?.type}</p>
      {allowDownload && (
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <DownloadIcon />
          下载文件
        </button>
      )}
    </div>
  )

  // 渲染图片预览
  const renderImagePreview = () => (
    <div className="relative">
      <img
        src={fileUrl}
        alt={fileEntity?.name}
        className="max-w-full max-h-full object-contain"
        style={{
          maxWidth: maxWidth,
          maxHeight: maxHeight
        }}
        onError={handleMediaError}
      />
      {showControls && (
        <div className="absolute top-2 right-2 flex gap-2">
          {allowFullscreen && (
            <button
              onClick={handleFullscreenToggle}
              className="p-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70"
              title="全屏"
            >
              <FullscreenIcon />
            </button>
          )}
          {allowDownload && (
            <button
              onClick={handleDownload}
              className="p-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70"
              title="下载"
            >
              <DownloadIcon />
            </button>
          )}
        </div>
      )}
    </div>
  )

  // 渲染视频预览
  const renderVideoPreview = () => (
    <div className="relative">
      <video
        ref={mediaRef as React.RefObject<HTMLVideoElement>}
        src={fileUrl}
        className="max-w-full max-h-full"
        style={{
          maxWidth: maxWidth,
          maxHeight: maxHeight
        }}
        onLoadedMetadata={handleMediaLoadedMetadata}
        onTimeUpdate={handleMediaTimeUpdate}
        onPlay={handleMediaPlay}
        onPause={handleMediaPause}
        onError={handleMediaError}
        controls={!showControls}
      />

      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <div className="flex items-center gap-4 text-white">
            {/* 播放/暂停按钮 */}
            <button
              onClick={handlePlayPause}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
            >
              {mediaControl.isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            {/* 进度条 */}
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span>{formatTime(mediaControl.currentTime)}</span>
                <div className="flex-1 h-1 bg-white bg-opacity-30 rounded">
                  <div
                    className="h-full bg-white rounded"
                    style={{
                      width: `${(mediaControl.currentTime / mediaControl.duration) * 100}%`
                    }}
                  />
                </div>
                <span>{formatTime(mediaControl.duration)}</span>
              </div>
            </div>

            {/* 音量控制 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleMuteToggle}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
              >
                <VolumeIcon />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={mediaControl.isMuted ? 0 : mediaControl.volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16"
              />
            </div>

            {/* 全屏和下载按钮 */}
            <div className="flex gap-2">
              {allowFullscreen && (
                <button
                  onClick={handleFullscreenToggle}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
                  title="全屏"
                >
                  <FullscreenIcon />
                </button>
              )}
              {allowDownload && (
                <button
                  onClick={handleDownload}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
                  title="下载"
                >
                  <DownloadIcon />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // 渲染音频预览
  const renderAudioPreview = () => (
    <div className="bg-gray-100 rounded-lg p-6">
      <audio
        ref={mediaRef as React.RefObject<HTMLAudioElement>}
        src={fileUrl}
        onLoadedMetadata={handleMediaLoadedMetadata}
        onTimeUpdate={handleMediaTimeUpdate}
        onPlay={handleMediaPlay}
        onPause={handleMediaPause}
        onError={handleMediaError}
        className="hidden"
      />

      {/* 音频可视化区域 */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
          <VolumeIcon />
        </div>
      </div>

      {/* 文件信息 */}
      <div className="text-center mb-6">
        <h3 className="font-medium text-gray-900 mb-1">{fileEntity?.name}</h3>
        <p className="text-sm text-gray-500">
          {fileEntity?.metadata.audio?.duration
            ? formatTime(fileEntity.metadata.audio.duration)
            : formatTime(mediaControl.duration)
          }
        </p>
      </div>

      {/* 控制栏 */}
      {showControls && (
        <div className="space-y-4">
          {/* 播放控制 */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePlayPause}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700"
            >
              {mediaControl.isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
          </div>

          {/* 进度条 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{formatTime(mediaControl.currentTime)}</span>
              <div className="flex-1 h-2 bg-gray-300 rounded">
                <div
                  className="h-full bg-blue-600 rounded"
                  style={{
                    width: `${(mediaControl.currentTime / mediaControl.duration) * 100}%`
                  }}
                />
              </div>
              <span>{formatTime(mediaControl.duration)}</span>
            </div>
          </div>

          {/* 音量控制 */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleMuteToggle}
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              <VolumeIcon />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={mediaControl.isMuted ? 0 : mediaControl.volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-24"
            />
          </div>

          {/* 下载按钮 */}
          {allowDownload && (
            <div className="flex justify-center">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                <DownloadIcon />
                下载音频
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  // 渲染PDF预览
  const renderPdfPreview = () => (
    <div className="bg-white border rounded-lg">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{fileEntity?.name}</h3>
        <div className="flex gap-2">
          {allowDownload && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <DownloadIcon />
              下载PDF
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        <iframe
          src={fileUrl}
          className="w-full border-0"
          style={{ height: maxHeight }}
          title={fileEntity?.name}
        />
      </div>
    </div>
  )

  // 渲染文本预览
  const renderTextPreview = () => {
    const [textContent, setTextContent] = useState<string>('')
    const [isLoadingText, setIsLoadingText] = useState(true)

    useEffect(() => {
      const loadTextContent = async () => {
        try {
          const response = await fetch(fileUrl)
          const text = await response.text()
          setTextContent(text)
        } catch (error) {
          setTextContent('无法加载文本内容')
        } finally {
          setIsLoadingText(false)
        }
      }

      loadTextContent()
    }, [fileUrl])

    return (
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-medium text-gray-900">{fileEntity?.name}</h3>
          <div className="flex gap-2">
            {allowDownload && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <DownloadIcon />
                下载文件
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          {isLoadingText ? (
            <div className="flex items-center justify-center py-8">
              <LoadingIcon />
              <span className="ml-2 text-gray-500">正在加载文本内容...</span>
            </div>
          ) : (
            <pre
              className="whitespace-pre-wrap text-sm text-gray-800 font-mono overflow-auto"
              style={{ maxHeight: maxHeight }}
            >
              {textContent}
            </pre>
          )}
        </div>
      </div>
    )
  }

  // 渲染文件信息
  const renderFileInfo = () => {
    if (!showFileInfo || !fileEntity) return null

    return (
      <div className="bg-gray-50 border-t p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">文件名:</span>
            <span className="ml-2 text-gray-900">{fileEntity.original_name}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">大小:</span>
            <span className="ml-2 text-gray-900">{formatFileSize(fileEntity.size)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">类型:</span>
            <span className="ml-2 text-gray-900">{fileEntity.type}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">创建时间:</span>
            <span className="ml-2 text-gray-900">
              {fileEntity.created_at.toLocaleString()}
            </span>
          </div>
          {fileEntity.metadata.description && (
            <div className="col-span-2">
              <span className="font-medium text-gray-700">描述:</span>
              <span className="ml-2 text-gray-900">{fileEntity.metadata.description}</span>
            </div>
          )}
          {fileEntity.metadata.tags.length > 0 && (
            <div className="col-span-2">
              <span className="font-medium text-gray-700">标签:</span>
              <div className="ml-2 flex flex-wrap gap-1 mt-1">
                {fileEntity.metadata.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 渲染预览内容
  const renderPreviewContent = () => {
    if (previewStatus === 'loading') return renderLoading()
    if (previewStatus === 'error') return renderError()
    if (!isSupported) return renderUnsupported()

    switch (fileType) {
      case 'image':
        return renderImagePreview()
      case 'video':
        return renderVideoPreview()
      case 'audio':
        return renderAudioPreview()
      case 'pdf':
        return renderPdfPreview()
      case 'text':
        return renderTextPreview()
      default:
        return renderUnsupported()
    }
  }

  // 容器样式
  const containerClasses = cn(
    'file-preview-component',
    'bg-white rounded-lg shadow-md overflow-hidden',
    mode === 'modal' && 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50',
    mode === 'fullscreen' && 'fixed inset-0 z-50 bg-black',
    className
  )

  const contentClasses = cn(
    'file-preview-content',
    mode === 'modal' && 'max-w-4xl max-h-screen bg-white rounded-lg overflow-hidden',
    mode === 'fullscreen' && 'w-full h-full flex flex-col'
  )

  // 模态框和全屏模式的关闭处理
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && mode === 'modal') {
      onClose?.()
    }
  }, [mode, onClose])

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          handleFullscreenToggle()
        } else if (mode === 'modal') {
          onClose?.()
        }
      }
    }

    if (mode === 'modal' || isFullscreen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mode, isFullscreen, onClose, handleFullscreenToggle])

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      style={style}
      onClick={handleBackdropClick}
    >
      <div className={contentClasses}>
        {/* 模态框头部 */}
        {mode === 'modal' && (
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {fileEntity?.name || '文件预览'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        {/* 预览内容 */}
        <div className="flex-1 overflow-auto">
          {renderPreviewContent()}
        </div>

        {/* 文件信息 */}
        {renderFileInfo()}
      </div>
    </div>
  )
}

export default FilePreviewComponent
