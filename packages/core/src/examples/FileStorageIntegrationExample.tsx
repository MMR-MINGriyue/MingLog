/**
 * 文件存储服务集成示例
 * 展示FileStorageService与FileUploadComponent的完整集成
 */

import React, { useState, useEffect, useCallback } from 'react'
import { FileUploadComponent, type FileUploadItem } from '../components/file/FileUploadComponent'
import { FileStorageService, type FileEntity, type FileQueryOptions } from '../services/FileStorageService'
import { EventBus } from '../event-system/EventBus'
import { SearchEngine } from '../search/SearchEngine'

// 文件管理器组件
export const FileStorageIntegrationExample: React.FC = () => {
  const [fileStorageService, setFileStorageService] = useState<FileStorageService | null>(null)
  const [storedFiles, setStoredFiles] = useState<FileEntity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

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
            max_file_size: 50 * 1024 * 1024, // 50MB
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
        category_filter: selectedCategory !== 'all' ? [selectedCategory] : undefined,
        tag_filter: selectedTags.length > 0 ? selectedTags : undefined,
        sort_by: 'created_at',
        sort_order: 'desc',
        limit: 50
      }
      
      const result = await storageService.queryFiles(queryOptions)
      setStoredFiles(result.files)
    } catch (error) {
      console.error('加载文件列表失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fileStorageService, searchQuery, selectedCategory, selectedTags])

  // 重新加载文件列表
  useEffect(() => {
    if (fileStorageService) {
      loadFiles()
    }
  }, [loadFiles])

  // 处理文件上传完成
  const handleUploadComplete = useCallback(async (files: FileUploadItem[]) => {
    if (!fileStorageService) return

    console.log('文件上传完成:', files)
    
    // 文件已经通过EventBus自动集成到存储服务
    // 这里可以添加额外的处理逻辑
    
    // 重新加载文件列表
    await loadFiles()
  }, [fileStorageService, loadFiles])

  // 处理文件删除
  const handleDeleteFile = useCallback(async (fileId: string, permanent: boolean = false) => {
    if (!fileStorageService) return

    try {
      const result = await fileStorageService.deleteFile(fileId, permanent)
      if (result.success) {
        console.log('文件删除成功:', result.file?.name)
        await loadFiles()
      } else {
        console.error('文件删除失败:', result.error)
      }
    } catch (error) {
      console.error('文件删除失败:', error)
    }
  }, [fileStorageService, loadFiles])

  // 处理文件元数据更新
  const handleUpdateMetadata = useCallback(async (fileId: string, description: string, tags: string[]) => {
    if (!fileStorageService) return

    try {
      const result = await fileStorageService.updateFileMetadata(fileId, {
        description,
        tags
      })
      
      if (result.success) {
        console.log('文件元数据更新成功')
        await loadFiles()
      } else {
        console.error('文件元数据更新失败:', result.error)
      }
    } catch (error) {
      console.error('文件元数据更新失败:', error)
    }
  }, [fileStorageService, loadFiles])

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 获取文件类型图标
  const getFileTypeIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.startsWith('video/')) return '🎥'
    if (fileType.startsWith('audio/')) return '🎵'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.startsWith('text/')) return '📝'
    return '📁'
  }

  // 获取所有标签
  const getAllTags = (): string[] => {
    const tags = new Set<string>()
    storedFiles.forEach(file => {
      file.metadata.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }

  // 获取所有分类
  const getAllCategories = (): string[] => {
    const categories = new Set<string>()
    storedFiles.forEach(file => {
      if (file.metadata.category) {
        categories.add(file.metadata.category)
      }
    })
    return Array.from(categories).sort()
  }

  if (!fileStorageService) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">正在初始化文件存储服务...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          文件存储服务集成示例
        </h1>
        <p className="text-gray-600">
          展示FileStorageService与FileUploadComponent的完整集成
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
              'text/*',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ],
            maxFileSize: 50 * 1024 * 1024,
            maxFiles: 10,
            multiple: true,
            autoUpload: true
          }}
          onUploadComplete={handleUploadComplete}
          placeholder="拖拽文件到此处或点击选择文件，文件将自动保存到存储服务"
        />
      </div>

      {/* 文件管理区域 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            文件管理 ({storedFiles.length})
          </h2>
          
          <button
            onClick={() => loadFiles()}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? '加载中...' : '刷新'}
          </button>
        </div>

        {/* 搜索和过滤 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* 搜索框 */}
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

          {/* 分类过滤 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文件分类
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部分类</option>
              {getAllCategories().map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* 标签过滤 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文件标签
            </label>
            <div className="flex flex-wrap gap-2">
              {getAllTags().map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    if (selectedTags.includes(tag)) {
                      setSelectedTags(prev => prev.filter(t => t !== tag))
                    } else {
                      setSelectedTags(prev => [...prev, tag])
                    }
                  }}
                  className={`px-2 py-1 text-xs rounded-full border ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 文件列表 */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-600">正在加载文件...</div>
          </div>
        ) : storedFiles.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-600">暂无文件</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storedFiles.map((file) => (
              <div
                key={file.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getFileTypeIcon(file.type)}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {file.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteFile(file.id, false)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    删除
                  </button>
                </div>

                {file.metadata.description && (
                  <p className="text-sm text-gray-600 mb-2">
                    {file.metadata.description}
                  </p>
                )}

                {file.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
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

                <div className="text-xs text-gray-500">
                  创建时间: {file.created_at.toLocaleString()}
                </div>

                {file.associations.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    关联: {file.associations.length} 个项目
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          存储统计
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {storedFiles.length}
            </div>
            <div className="text-sm text-gray-600">总文件数</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatFileSize(storedFiles.reduce((sum, file) => sum + file.size, 0))}
            </div>
            <div className="text-sm text-gray-600">总存储大小</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {getAllCategories().length}
            </div>
            <div className="text-sm text-gray-600">文件分类</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {getAllTags().length}
            </div>
            <div className="text-sm text-gray-600">文件标签</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileStorageIntegrationExample
