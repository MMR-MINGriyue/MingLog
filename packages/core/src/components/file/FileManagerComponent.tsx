/**
 * 文件管理组件
 * 提供文件列表、搜索、过滤、排序、批量操作的统一界面
 * 集成FileStorageService、FilePreviewComponent、FileAssociationComponent
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { cn } from '../../utils'
import { FileStorageService, FileEntity, FileQueryOptions } from '../../services/FileStorageService'
import { FileAssociationService } from '../../services/FileAssociationService'
import { FileUploadComponent, FileUploadItem } from './FileUploadComponent'
import { FilePreviewComponent, PreviewMode } from './FilePreviewComponent'
import { FileAssociationComponent } from './FileAssociationComponent'

// 简单的图标组件
const SearchIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const FilterIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
  </svg>
)

const SortIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
  </svg>
)

const GridIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
)

const ListIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
)

const UploadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
)

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const LinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
)

const RefreshIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

// 视图模式枚举
export type ViewMode = 'grid' | 'list'

// 排序字段枚举
export type SortField = 'name' | 'size' | 'type' | 'created_at' | 'updated_at'

// 排序方向枚举
export type SortOrder = 'asc' | 'desc'

// 文件管理组件属性
export interface FileManagerComponentProps {
  /** 文件存储服务 */
  fileStorageService: FileStorageService
  /** 文件关联服务 */
  fileAssociationService?: FileAssociationService
  /** 初始视图模式 */
  initialViewMode?: ViewMode
  /** 是否显示上传区域 */
  showUpload?: boolean
  /** 是否显示预览面板 */
  showPreview?: boolean
  /** 是否显示关联面板 */
  showAssociations?: boolean
  /** 是否允许批量操作 */
  allowBatchOperations?: boolean
  /** 是否允许删除 */
  allowDelete?: boolean
  /** 是否允许下载 */
  allowDownload?: boolean
  /** 每页显示数量 */
  pageSize?: number
  /** 自定义样式类名 */
  className?: string
  /** 文件选择回调 */
  onFileSelect?: (file: FileEntity | null) => void
  /** 文件上传完成回调 */
  onFileUploaded?: (files: FileUploadItem[]) => void
  /** 文件删除回调 */
  onFileDeleted?: (fileId: string) => void
  /** 错误回调 */
  onError?: (error: string) => void
}

/**
 * 文件管理组件
 */
export const FileManagerComponent: React.FC<FileManagerComponentProps> = ({
  fileStorageService,
  fileAssociationService,
  initialViewMode = 'grid',
  showUpload = true,
  showPreview = true,
  showAssociations = true,
  allowBatchOperations = true,
  allowDelete = true,
  allowDownload = true,
  pageSize = 20,
  className,
  onFileSelect,
  onFileUploaded,
  onFileDeleted,
  onError
}) => {
  // 状态管理
  const [files, setFiles] = useState<FileEntity[]>([])
  const [selectedFile, setSelectedFile] = useState<FileEntity | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  
  // 搜索和过滤状态
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [totalFiles, setTotalFiles] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  
  // 预览和关联状态
  const [previewMode, setPreviewMode] = useState<PreviewMode>('inline')
  const [showUploadPanel, setShowUploadPanel] = useState(false)
  
  // 引用
  const fileListRef = useRef<HTMLDivElement>(null)

  // 加载文件列表
  const loadFiles = useCallback(async (page: number = 1, append: boolean = false) => {
    setIsLoading(true)
    setError('')
    
    try {
      const queryOptions: FileQueryOptions = {
        search: searchQuery || undefined,
        type_filter: selectedType !== 'all' ? [selectedType] : undefined,
        category_filter: selectedCategory !== 'all' ? [selectedCategory] : undefined,
        sort_by: sortField,
        sort_order: sortOrder,
        limit: pageSize,
        offset: (page - 1) * pageSize
      }
      
      const result = await fileStorageService.queryFiles(queryOptions)
      
      if (append) {
        setFiles(prev => [...prev, ...result.files])
      } else {
        setFiles(result.files)
      }
      
      setTotalFiles(result.total)
      setHasMore(result.hasMore)
      setCurrentPage(page)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载文件失败'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [fileStorageService, searchQuery, selectedType, selectedCategory, sortField, sortOrder, pageSize, onError])

  // 初始化加载
  useEffect(() => {
    loadFiles(1, false)
  }, [loadFiles])

  // 处理搜索
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }, [])

  // 处理过滤
  const handleFilter = useCallback((type: string, category: string) => {
    setSelectedType(type)
    setSelectedCategory(category)
    setCurrentPage(1)
  }, [])

  // 处理排序
  const handleSort = useCallback((field: SortField, order: SortOrder) => {
    setSortField(field)
    setSortOrder(order)
    setCurrentPage(1)
  }, [])

  // 处理文件选择
  const handleFileSelect = useCallback((file: FileEntity) => {
    setSelectedFile(file)
    onFileSelect?.(file)
  }, [onFileSelect])

  // 处理批量选择
  const handleBatchSelect = useCallback((fileId: string, selected: boolean) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(fileId)
      } else {
        newSet.delete(fileId)
      }
      return newSet
    })
  }, [])

  // 处理全选
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedFiles(new Set(files.map(f => f.id)))
    } else {
      setSelectedFiles(new Set())
    }
  }, [files])

  // 处理文件上传完成
  const handleUploadComplete = useCallback(async (uploadedFiles: FileUploadItem[]) => {
    onFileUploaded?.(uploadedFiles)
    setShowUploadPanel(false)
    
    // 重新加载文件列表
    await loadFiles(1, false)
  }, [onFileUploaded, loadFiles])

  // 处理文件删除
  const handleFileDelete = useCallback(async (fileId: string) => {
    if (!confirm('确定要删除这个文件吗？')) return
    
    try {
      const result = await fileStorageService.deleteFile(fileId, true)
      if (result.success) {
        setFiles(prev => prev.filter(f => f.id !== fileId))
        setSelectedFiles(prev => {
          const newSet = new Set(prev)
          newSet.delete(fileId)
          return newSet
        })
        
        if (selectedFile?.id === fileId) {
          setSelectedFile(null)
        }
        
        onFileDeleted?.(fileId)
      } else {
        throw new Error(result.error || '删除失败')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除文件失败'
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }, [fileStorageService, selectedFile, onFileDeleted, onError])

  // 处理批量删除
  const handleBatchDelete = useCallback(async () => {
    if (selectedFiles.size === 0) return
    
    if (!confirm(`确定要删除选中的 ${selectedFiles.size} 个文件吗？`)) return
    
    try {
      const deletePromises = Array.from(selectedFiles).map(fileId =>
        fileStorageService.deleteFile(fileId, true)
      )
      
      const results = await Promise.all(deletePromises)
      const successCount = results.filter(r => r.success).length
      
      if (successCount > 0) {
        setFiles(prev => prev.filter(f => !selectedFiles.has(f.id)))
        setSelectedFiles(new Set())
        
        if (selectedFile && selectedFiles.has(selectedFile.id)) {
          setSelectedFile(null)
        }
      }
      
      if (successCount < selectedFiles.size) {
        throw new Error(`${selectedFiles.size - successCount} 个文件删除失败`)
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量删除失败'
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }, [selectedFiles, fileStorageService, selectedFile, onError])

  // 处理文件下载
  const handleFileDownload = useCallback((file: FileEntity) => {
    const link = document.createElement('a')
    link.href = file.url || file.path
    link.download = file.original_name
    link.click()
  }, [])

  // 处理批量下载
  const handleBatchDownload = useCallback(() => {
    if (selectedFiles.size === 0) return
    
    const selectedFileEntities = files.filter(f => selectedFiles.has(f.id))
    selectedFileEntities.forEach(file => {
      setTimeout(() => handleFileDownload(file), 100)
    })
  }, [selectedFiles, files, handleFileDownload])

  // 加载更多文件
  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadFiles(currentPage + 1, true)
    }
  }, [isLoading, hasMore, currentPage, loadFiles])

  // 刷新文件列表
  const handleRefresh = useCallback(() => {
    setCurrentPage(1)
    loadFiles(1, false)
  }, [loadFiles])

  // 格式化文件大小
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  // 获取文件类型图标
  const getFileTypeIcon = useCallback((fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.startsWith('video/')) return '🎥'
    if (fileType.startsWith('audio/')) return '🎵'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.startsWith('text/')) return '📝'
    if (fileType.includes('word') || fileType.includes('document')) return '📄'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📈'
    return '📁'
  }, [])

  // 获取文件类型列表
  const fileTypes = useMemo(() => {
    const types = new Set<string>()
    files.forEach(file => {
      const mainType = file.type.split('/')[0]
      types.add(mainType)
    })
    return Array.from(types).sort()
  }, [files])

  // 获取文件分类列表
  const fileCategories = useMemo(() => {
    const categories = new Set<string>()
    files.forEach(file => {
      if (file.metadata.category) {
        categories.add(file.metadata.category)
      }
    })
    return Array.from(categories).sort()
  }, [files])

  // 渲染工具栏
  const renderToolbar = () => (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* 左侧：搜索和过滤 */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* 搜索框 */}
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="搜索文件..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 类型过滤 */}
          <select
            value={selectedType}
            onChange={(e) => handleFilter(e.target.value, selectedCategory)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部类型</option>
            {fileTypes.map(type => (
              <option key={type} value={type + '/*'}>{type}</option>
            ))}
          </select>

          {/* 分类过滤 */}
          <select
            value={selectedCategory}
            onChange={(e) => handleFilter(selectedType, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部分类</option>
            {fileCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2">
          {/* 排序 */}
          <div className="flex items-center gap-1">
            <SortIcon className="text-gray-400" />
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-') as [SortField, SortOrder]
                handleSort(field, order)
              }}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at-desc">最新创建</option>
              <option value="created_at-asc">最早创建</option>
              <option value="updated_at-desc">最近更新</option>
              <option value="updated_at-asc">最早更新</option>
              <option value="name-asc">名称 A-Z</option>
              <option value="name-desc">名称 Z-A</option>
              <option value="size-desc">大小 大-小</option>
              <option value="size-asc">大小 小-大</option>
            </select>
          </div>

          {/* 视图切换 */}
          <div className="flex border border-gray-300 rounded">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 text-sm',
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
              title="网格视图"
            >
              <GridIcon />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 text-sm border-l border-gray-300',
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
              title="列表视图"
            >
              <ListIcon />
            </button>
          </div>

          {/* 刷新按钮 */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            title="刷新"
          >
            <RefreshIcon className={cn(isLoading && 'animate-spin')} />
          </button>

          {/* 上传按钮 */}
          {showUpload && (
            <button
              onClick={() => setShowUploadPanel(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <UploadIcon />
              上传文件
            </button>
          )}
        </div>
      </div>

      {/* 批量操作栏 */}
      {allowBatchOperations && selectedFiles.size > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800">
              已选择 {selectedFiles.size} 个文件
            </div>

            <div className="flex items-center gap-2">
              {allowDownload && (
                <button
                  onClick={handleBatchDownload}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <DownloadIcon />
                  下载
                </button>
              )}

              {allowDelete && (
                <button
                  onClick={handleBatchDelete}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <DeleteIcon />
                  删除
                </button>
              )}

              <button
                onClick={() => setSelectedFiles(new Set())}
                className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                取消选择
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // 渲染文件项（网格视图）
  const renderFileGridItem = (file: FileEntity) => (
    <div
      key={file.id}
      className={cn(
        'relative p-4 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:border-gray-300',
        selectedFile?.id === file.id && 'border-blue-500 bg-blue-50',
        selectedFiles.has(file.id) && 'ring-2 ring-blue-500'
      )}
      onClick={() => handleFileSelect(file)}
    >
      {/* 批量选择复选框 */}
      {allowBatchOperations && (
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={selectedFiles.has(file.id)}
            onChange={(e) => {
              e.stopPropagation()
              handleBatchSelect(file.id, e.target.checked)
            }}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      )}

      {/* 文件图标 */}
      <div className="flex justify-center mb-3">
        <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-lg">
          <span className="text-3xl">{getFileTypeIcon(file.type)}</span>
        </div>
      </div>

      {/* 文件信息 */}
      <div className="text-center">
        <h3 className="font-medium text-gray-900 truncate mb-1" title={file.name}>
          {file.name}
        </h3>
        <p className="text-sm text-gray-500 mb-2">
          {formatFileSize(file.size)}
        </p>
        <p className="text-xs text-gray-400">
          {file.created_at.toLocaleDateString()}
        </p>
      </div>

      {/* 标签 */}
      {file.metadata.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1 justify-center">
          {file.metadata.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className="px-1 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
            >
              {tag}
            </span>
          ))}
          {file.metadata.tags.length > 2 && (
            <span className="text-xs text-gray-400">
              +{file.metadata.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setPreviewMode('modal')
              handleFileSelect(file)
            }}
            className="p-1 bg-white shadow-sm border border-gray-200 rounded hover:bg-gray-50"
            title="预览"
          >
            <EyeIcon />
          </button>

          {allowDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleFileDownload(file)
              }}
              className="p-1 bg-white shadow-sm border border-gray-200 rounded hover:bg-gray-50"
              title="下载"
            >
              <DownloadIcon />
            </button>
          )}

          {allowDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleFileDelete(file.id)
              }}
              className="p-1 bg-white shadow-sm border border-gray-200 rounded hover:bg-red-50 text-red-600"
              title="删除"
            >
              <DeleteIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  // 渲染文件项（列表视图）
  const renderFileListItem = (file: FileEntity) => (
    <div
      key={file.id}
      className={cn(
        'flex items-center p-3 border-b border-gray-200 cursor-pointer transition-colors',
        'hover:bg-gray-50',
        selectedFile?.id === file.id && 'bg-blue-50 border-blue-200',
        selectedFiles.has(file.id) && 'bg-blue-25'
      )}
      onClick={() => handleFileSelect(file)}
    >
      {/* 批量选择复选框 */}
      {allowBatchOperations && (
        <div className="mr-3">
          <input
            type="checkbox"
            checked={selectedFiles.has(file.id)}
            onChange={(e) => {
              e.stopPropagation()
              handleBatchSelect(file.id, e.target.checked)
            }}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      )}

      {/* 文件图标 */}
      <div className="mr-3">
        <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded">
          <span className="text-xl">{getFileTypeIcon(file.type)}</span>
        </div>
      </div>

      {/* 文件信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 truncate" title={file.name}>
            {file.name}
          </h3>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-gray-500">
              {formatFileSize(file.size)}
            </span>
            <span className="text-sm text-gray-400">
              {file.created_at.toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{file.type}</span>
            {file.metadata.tags.length > 0 && (
              <div className="flex gap-1">
                {file.metadata.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="px-1 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {file.metadata.tags.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{file.metadata.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setPreviewMode('modal')
                handleFileSelect(file)
              }}
              className="p-1 text-gray-400 hover:text-blue-600 rounded"
              title="预览"
            >
              <EyeIcon />
            </button>

            {fileAssociationService && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleFileSelect(file)
                }}
                className="p-1 text-gray-400 hover:text-green-600 rounded"
                title="关联"
              >
                <LinkIcon />
              </button>
            )}

            {allowDownload && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleFileDownload(file)
                }}
                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                title="下载"
              >
                <DownloadIcon />
              </button>
            )}

            {allowDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleFileDelete(file.id)
                }}
                className="p-1 text-gray-400 hover:text-red-600 rounded"
                title="删除"
              >
                <DeleteIcon />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // 渲染文件列表
  const renderFileList = () => {
    if (isLoading && files.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshIcon className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">正在加载文件...</p>
          </div>
        </div>
      )
    }

    if (files.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-gray-500 mb-4">暂无文件</p>
            {showUpload && (
              <button
                onClick={() => setShowUploadPanel(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mx-auto"
              >
                <UploadIcon />
                上传第一个文件
              </button>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 overflow-auto">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
            {files.map(renderFileGridItem)}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* 列表头部 */}
            {allowBatchOperations && (
              <div className="flex items-center p-3 bg-gray-50 border-b border-gray-200">
                <input
                  type="checkbox"
                  checked={files.length > 0 && selectedFiles.size === files.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                />
                <span className="text-sm font-medium text-gray-700">
                  全选 ({files.length} 个文件)
                </span>
              </div>
            )}

            {files.map(renderFileListItem)}
          </div>
        )}

        {/* 加载更多 */}
        {hasMore && (
          <div className="p-4 text-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // 渲染侧边栏
  const renderSidebar = () => {
    if (!selectedFile) {
      return (
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">👁️</div>
            <p>选择文件查看详情</p>
          </div>
        </div>
      )
    }

    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* 预览区域 */}
        {showPreview && (
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">文件预览</h3>
            <FilePreviewComponent
              file={selectedFile}
              fileStorageService={fileStorageService}
              mode="inline"
              maxWidth={280}
              maxHeight={200}
              showControls={false}
              showFileInfo={false}
              onError={(error) => setError(error)}
            />
          </div>
        )}

        {/* 文件信息 */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">文件信息</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">名称:</span>
              <span className="ml-2 font-medium">{selectedFile.name}</span>
            </div>
            <div>
              <span className="text-gray-600">大小:</span>
              <span className="ml-2">{formatFileSize(selectedFile.size)}</span>
            </div>
            <div>
              <span className="text-gray-600">类型:</span>
              <span className="ml-2">{selectedFile.type}</span>
            </div>
            <div>
              <span className="text-gray-600">创建时间:</span>
              <span className="ml-2">{selectedFile.created_at.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">更新时间:</span>
              <span className="ml-2">{selectedFile.updated_at.toLocaleString()}</span>
            </div>
            {selectedFile.metadata.description && (
              <div>
                <span className="text-gray-600">描述:</span>
                <span className="ml-2">{selectedFile.metadata.description}</span>
              </div>
            )}
            {selectedFile.metadata.tags.length > 0 && (
              <div>
                <span className="text-gray-600">标签:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedFile.metadata.tags.map(tag => (
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

        {/* 关联管理 */}
        {showAssociations && fileAssociationService && (
          <div className="flex-1 overflow-auto">
            <FileAssociationComponent
              file={selectedFile}
              fileAssociationService={fileAssociationService}
              showSuggestions={true}
              allowEdit={true}
              allowDelete={true}
              showSearch={false}
              maxDisplayCount={10}
              onError={(error) => setError(error)}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('file-manager-component h-full flex flex-col', className)}>
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 m-4">
          <div className="flex items-center gap-2">
            <div className="text-red-600">⚠️</div>
            <div className="text-red-800 text-sm">{error}</div>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 工具栏 */}
      {renderToolbar()}

      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 文件列表 */}
        <div className="flex-1 flex flex-col">
          {renderFileList()}
        </div>

        {/* 侧边栏 */}
        {(showPreview || showAssociations) && renderSidebar()}
      </div>

      {/* 上传面板 */}
      {showUploadPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">上传文件</h2>
                <button
                  onClick={() => setShowUploadPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <FileUploadComponent
                config={{
                  acceptedTypes: [
                    'image/*',
                    'video/*',
                    'audio/*',
                    'application/pdf',
                    'text/*',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                  ],
                  maxFileSize: 50 * 1024 * 1024,
                  maxFiles: 10,
                  multiple: true,
                  autoUpload: true
                }}
                onUploadComplete={handleUploadComplete}
                onUploadError={(file, error) => setError(`上传失败: ${error}`)}
                placeholder="拖拽文件到此处或点击选择文件"
              />
            </div>
          </div>
        </div>
      )}

      {/* 模态框预览 */}
      {selectedFile && previewMode === 'modal' && (
        <FilePreviewComponent
          file={selectedFile}
          fileStorageService={fileStorageService}
          mode="modal"
          onClose={() => setPreviewMode('inline')}
          onError={(error) => setError(error)}
        />
      )}

      {/* 统计信息 */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            共 {totalFiles} 个文件
            {selectedFiles.size > 0 && ` • 已选择 ${selectedFiles.size} 个`}
          </div>

          <div className="flex items-center gap-4">
            {currentPage > 1 && (
              <span>第 {currentPage} 页</span>
            )}

            {isLoading && (
              <div className="flex items-center gap-1">
                <RefreshIcon className="w-3 h-3 animate-spin" />
                <span>加载中...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileManagerComponent
