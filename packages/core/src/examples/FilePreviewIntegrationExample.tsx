/**
 * 文件预览组件集成示例
 * 展示FilePreviewComponent与FileUploadComponent、FileStorageService的完整集成
 */

import React, { useState, useEffect, useCallback } from 'react'
import { FileUploadComponent, type FileUploadItem } from '../components/file/FileUploadComponent'
import { FilePreviewComponent, type PreviewMode, type PreviewStatus } from '../components/file/FilePreviewComponent'
import { FileStorageService, type FileEntity, type FileQueryOptions } from '../services/FileStorageService'
import { EventBus } from '../event-system/EventBus'
import { SearchEngine } from '../search/SearchEngine'

// 文件项组件
interface FileItemProps {
  file: FileEntity
  onPreview: (file: FileEntity, mode: PreviewMode) => void
  onDelete: (fileId: string) => void
}

const FileItem: React.FC<FileItemProps> = ({ file, onPreview, onDelete }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileTypeIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.startsWith('video/')) return '🎥'
    if (fileType.startsWith('audio/')) return '🎵'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.startsWith('text/')) return '📝'
    return '📁'
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getFileTypeIcon(file.type)}</span>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 truncate">{file.name}</h3>
            <p className="text-sm text-gray-500">
              {formatFileSize(file.size)} • {file.type}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onPreview(file, 'inline')}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            预览
          </button>
          <button
            onClick={() => onPreview(file, 'modal')}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            弹窗
          </button>
          <button
            onClick={() => onDelete(file.id)}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            删除
          </button>
        </div>
      </div>

      {file.metadata.description && (
        <p className="text-sm text-gray-600 mb-2">{file.metadata.description}</p>
      )}

      {file.metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {file.metadata.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// 主组件
export const FilePreviewIntegrationExample: React.FC = () => {
  const [fileStorageService, setFileStorageService] = useState<FileStorageService | null>(null)
  const [files, setFiles] = useState<FileEntity[]>([])
  const [selectedFile, setSelectedFile] = useState<FileEntity | null>(null)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('inline')
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>('loading')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')

  // 初始化文件存储服务
  useEffect(() => {
    const initializeService = async () => {
      try {
        const eventBus = new EventBus()
        const searchEngine = new SearchEngine()
        
        const service = new FileStorageService(
          {
            storage_root: './data/files',
            thumbnail_dir: './data/thumbnails',
            max_file_size: 50 * 1024 * 1024,
            allowed_types: [
              'image/*',
              'video/*',
              'audio/*',
              'application/pdf',
              'text/*',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ],
            enable_thumbnails: true,
            enable_indexing: true,
            storage_strategy: 'date-based'
          },
          eventBus,
          searchEngine
        )

        await service.initialize()
        setFileStorageService(service)
        
        // 加载现有文件
        await loadFiles(service)
      } catch (error) {
        console.error('文件存储服务初始化失败:', error)
      }
    }

    initializeService()
  }, [])

  // 加载文件列表
  const loadFiles = useCallback(async (service?: FileStorageService) => {
    if (!service && !fileStorageService) return
    
    const storageService = service || fileStorageService!
    setIsLoading(true)
    
    try {
      const queryOptions: FileQueryOptions = {
        search: searchQuery || undefined,
        type_filter: selectedType !== 'all' ? [selectedType] : undefined,
        sort_by: 'created_at',
        sort_order: 'desc',
        limit: 20
      }
      
      const result = await storageService.queryFiles(queryOptions)
      setFiles(result.files)
    } catch (error) {
      console.error('加载文件列表失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fileStorageService, searchQuery, selectedType])

  // 重新加载文件列表
  useEffect(() => {
    if (fileStorageService) {
      loadFiles()
    }
  }, [loadFiles])

  // 处理文件上传完成
  const handleUploadComplete = useCallback(async (uploadedFiles: FileUploadItem[]) => {
    console.log('文件上传完成:', uploadedFiles)
    await loadFiles()
  }, [loadFiles])

  // 处理文件预览
  const handlePreview = useCallback((file: FileEntity, mode: PreviewMode) => {
    setSelectedFile(file)
    setPreviewMode(mode)
  }, [])

  // 处理预览关闭
  const handlePreviewClose = useCallback(() => {
    setSelectedFile(null)
  }, [])

  // 处理预览状态变化
  const handlePreviewStatusChange = useCallback((status: PreviewStatus) => {
    setPreviewStatus(status)
  }, [])

  // 处理预览错误
  const handlePreviewError = useCallback((error: string) => {
    console.error('预览错误:', error)
    alert(`预览失败: ${error}`)
  }, [])

  // 处理文件删除
  const handleDeleteFile = useCallback(async (fileId: string) => {
    if (!fileStorageService) return

    if (confirm('确定要删除这个文件吗？')) {
      try {
        const result = await fileStorageService.deleteFile(fileId, true)
        if (result.success) {
          await loadFiles()
          if (selectedFile?.id === fileId) {
            setSelectedFile(null)
          }
        } else {
          alert(`删除失败: ${result.error}`)
        }
      } catch (error) {
        console.error('删除文件失败:', error)
        alert('删除文件失败')
      }
    }
  }, [fileStorageService, loadFiles, selectedFile])

  // 获取文件类型选项
  const getFileTypes = (): string[] => {
    const types = new Set<string>()
    files.forEach(file => {
      const mainType = file.type.split('/')[0]
      types.add(mainType)
    })
    return Array.from(types).sort()
  }

  if (!fileStorageService) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">正在初始化文件服务...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          文件预览集成示例
        </h1>
        <p className="text-gray-600">
          展示文件上传、存储、预览的完整工作流程
        </p>
      </div>

      {/* 文件上传区域 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          文件上传
        </h2>
        
        <FileUploadComponent
          config={{
            acceptedTypes: [
              'image/*',
              'video/*',
              'audio/*',
              'application/pdf',
              'text/*'
            ],
            maxFileSize: 50 * 1024 * 1024,
            maxFiles: 5,
            multiple: true,
            autoUpload: true
          }}
          onUploadComplete={handleUploadComplete}
          placeholder="拖拽文件到此处或点击选择文件，支持图片、视频、音频、PDF、文本等格式"
        />
      </div>

      {/* 文件管理区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 文件列表 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                文件列表 ({files.length})
              </h2>
              
              <button
                onClick={() => loadFiles()}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? '加载中...' : '刷新'}
              </button>
            </div>

            {/* 搜索和过滤 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  搜索文件
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="输入文件名或描述..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  文件类型
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部类型</option>
                  {getFileTypes().map(type => (
                    <option key={type} value={type + '/*'}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 文件列表 */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-600">正在加载文件...</div>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-600">暂无文件</div>
              </div>
            ) : (
              <div className="space-y-4">
                {files.map((file) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    onPreview={handlePreview}
                    onDelete={handleDeleteFile}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 预览区域 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              文件预览
            </h2>
            
            {selectedFile ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  预览模式: {previewMode === 'inline' ? '内联' : '弹窗'}
                </div>
                
                <div className="text-sm text-gray-600">
                  状态: {
                    previewStatus === 'loading' ? '加载中' :
                    previewStatus === 'loaded' ? '已加载' :
                    previewStatus === 'error' ? '错误' : '不支持'
                  }
                </div>
                
                {previewMode === 'inline' && (
                  <FilePreviewComponent
                    file={selectedFile}
                    fileStorageService={fileStorageService}
                    mode="inline"
                    maxWidth={300}
                    maxHeight={400}
                    onStatusChange={handlePreviewStatusChange}
                    onError={handlePreviewError}
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">👁️</div>
                <div>选择文件进行预览</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 模态框预览 */}
      {selectedFile && previewMode === 'modal' && (
        <FilePreviewComponent
          file={selectedFile}
          fileStorageService={fileStorageService}
          mode="modal"
          onClose={handlePreviewClose}
          onStatusChange={handlePreviewStatusChange}
          onError={handlePreviewError}
        />
      )}
    </div>
  )
}

export default FilePreviewIntegrationExample
