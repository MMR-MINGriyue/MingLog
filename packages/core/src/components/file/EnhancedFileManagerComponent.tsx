/**
 * 增强版文件管理组件
 * 完善文件预览、批量操作、响应式设计和用户体验
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { cn } from '../../utils'
import { FileStorageService, FileEntity, FileQueryOptions } from '../../services/FileStorageService'
import { FileAssociationService } from '../../services/FileAssociationService'
import { FileUploadComponent, FileUploadItem } from './FileUploadComponent'
import { FilePreviewComponent, PreviewMode } from './FilePreviewComponent'
import { BatchOperationsPanel } from '../operations/BatchOperationsPanel'

// 增强的视图模式
type ViewMode = 'grid' | 'list' | 'table' | 'timeline'

// 文件夹结构
interface FolderNode {
  id: string
  name: string
  path: string
  parentId?: string
  children: FolderNode[]
  fileCount: number
  isExpanded: boolean
}

// 增强的文件管理组件属性
export interface EnhancedFileManagerComponentProps {
  /** 文件存储服务 */
  fileStorageService: FileStorageService
  /** 文件关联服务 */
  fileAssociationService?: FileAssociationService
  /** 初始视图模式 */
  initialViewMode?: ViewMode
  /** 是否显示文件夹树 */
  showFolderTree?: boolean
  /** 是否显示面包屑导航 */
  showBreadcrumb?: boolean
  /** 是否启用虚拟化 */
  enableVirtualization?: boolean
  /** 是否启用拖拽排序 */
  enableDragSort?: boolean
  /** 是否启用快捷键 */
  enableKeyboardShortcuts?: boolean
  /** 是否显示文件详情面板 */
  showDetailsPanel?: boolean
  /** 是否启用实时搜索 */
  enableLiveSearch?: boolean
  /** 搜索防抖延迟 */
  searchDebounceMs?: number
  /** 每页显示数量 */
  pageSize?: number
  /** 自定义样式类名 */
  className?: string
  /** 文件选择回调 */
  onFileSelect?: (file: FileEntity | null) => void
  /** 文件夹变更回调 */
  onFolderChange?: (folderId: string) => void
  /** 批量操作回调 */
  onBatchOperation?: (operation: string, files: FileEntity[]) => Promise<void>
  /** 错误回调 */
  onError?: (error: string) => void
}

/**
 * 增强版文件管理组件
 */
export const EnhancedFileManagerComponent: React.FC<EnhancedFileManagerComponentProps> = ({
  fileStorageService,
  fileAssociationService,
  initialViewMode = 'grid',
  showFolderTree = true,
  showBreadcrumb = true,
  enableVirtualization = true,
  enableDragSort = true,
  enableKeyboardShortcuts = true,
  showDetailsPanel = true,
  enableLiveSearch = true,
  searchDebounceMs = 300,
  pageSize = 50,
  className,
  onFileSelect,
  onFolderChange,
  onBatchOperation,
  onError
}) => {
  // 状态管理
  const [files, setFiles] = useState<FileEntity[]>([])
  const [selectedFile, setSelectedFile] = useState<FileEntity | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
  const [currentFolder, setCurrentFolder] = useState<string>('/')
  const [folderTree, setFolderTree] = useState<FolderNode[]>([])
  const [breadcrumb, setBreadcrumb] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showBatchPanel, setShowBatchPanel] = useState(false)
  const [draggedFile, setDraggedFile] = useState<FileEntity | null>(null)

  // 引用
  const searchInputRef = useRef<HTMLInputElement>(null)
  const fileListRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // 防抖搜索
  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      loadFiles(1, false, query)
    }, searchDebounceMs)
  }, [searchDebounceMs])

  // 处理搜索输入
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    
    if (enableLiveSearch) {
      debouncedSearch(query)
    }
  }, [enableLiveSearch, debouncedSearch])

  // 加载文件列表
  const loadFiles = useCallback(async (
    page: number = 1, 
    append: boolean = false, 
    search?: string
  ) => {
    setIsLoading(true)
    setError('')
    
    try {
      const queryOptions: FileQueryOptions = {
        search: search || searchQuery || undefined,
        folder: currentFolder !== '/' ? currentFolder : undefined,
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载文件失败'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [fileStorageService, searchQuery, currentFolder, sortField, sortOrder, pageSize, onError])

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

  // 处理文件夹切换
  const handleFolderChange = useCallback((folderId: string) => {
    setCurrentFolder(folderId)
    setSelectedFiles(new Set())
    onFolderChange?.(folderId)
    
    // 更新面包屑
    const pathParts = folderId.split('/').filter(Boolean)
    setBreadcrumb(['根目录', ...pathParts])
  }, [onFolderChange])

  // 处理拖拽开始
  const handleDragStart = useCallback((e: React.DragEvent, file: FileEntity) => {
    if (!enableDragSort) return
    
    setDraggedFile(file)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', file.id)
  }, [enableDragSort])

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    setDraggedFile(null)
  }, [])

  // 处理文件拖放
  const handleDrop = useCallback((e: React.DragEvent, targetFolder: string) => {
    e.preventDefault()
    
    if (!draggedFile || !enableDragSort) return
    
    // 这里可以实现文件移动逻辑
    console.log(`移动文件 ${draggedFile.name} 到文件夹 ${targetFolder}`)
    setDraggedFile(null)
  }, [draggedFile, enableDragSort])

  // 键盘快捷键处理
  useEffect(() => {
    if (!enableKeyboardShortcuts) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+A 全选
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        handleSelectAll(true)
      }
      
      // Delete 删除选中文件
      if (e.key === 'Delete' && selectedFiles.size > 0) {
        e.preventDefault()
        setShowBatchPanel(true)
      }
      
      // Ctrl+F 聚焦搜索框
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      
      // Escape 取消选择
      if (e.key === 'Escape') {
        setSelectedFiles(new Set())
        setSelectedFile(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboardShortcuts, selectedFiles.size, handleSelectAll])

  // 初始化加载
  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  // 渲染工具栏
  const renderToolbar = () => (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      {/* 左侧：面包屑导航 */}
      {showBreadcrumb && (
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumb.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-gray-400">/</span>}
              <button
                className="text-blue-600 hover:text-blue-800 hover:underline"
                onClick={() => {
                  const path = breadcrumb.slice(0, index + 1).join('/')
                  handleFolderChange(index === 0 ? '/' : path)
                }}
              >
                {crumb}
              </button>
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* 中间：搜索框 */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="搜索文件..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 右侧：视图切换和操作按钮 */}
      <div className="flex items-center space-x-2">
        {/* 视图模式切换 */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          {(['grid', 'list', 'table'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'px-3 py-2 text-sm font-medium transition-colors',
                viewMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              {mode === 'grid' ? '网格' : mode === 'list' ? '列表' : '表格'}
            </button>
          ))}
        </div>

        {/* 批量操作按钮 */}
        {selectedFiles.size > 0 && (
          <button
            onClick={() => setShowBatchPanel(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            批量操作 ({selectedFiles.size})
          </button>
        )}

        {/* 排序选择 */}
        <select
          value={`${sortField}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-')
            setSortField(field)
            setSortOrder(order as 'asc' | 'desc')
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="name-asc">名称 ↑</option>
          <option value="name-desc">名称 ↓</option>
          <option value="size-asc">大小 ↑</option>
          <option value="size-desc">大小 ↓</option>
          <option value="modified-asc">修改时间 ↑</option>
          <option value="modified-desc">修改时间 ↓</option>
        </select>
      </div>
    </div>
  )

  // 渲染文件夹树
  const renderFolderTree = () => (
    <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">文件夹</h3>
        {/* 这里可以实现递归的文件夹树组件 */}
        <div className="space-y-1">
          <button
            onClick={() => handleFolderChange('/')}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
              currentFolder === '/' 
                ? 'bg-blue-100 text-blue-800' 
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            📁 根目录
          </button>
          {/* 其他文件夹节点 */}
        </div>
      </div>
    </div>
  )

  // 渲染文件列表
  const renderFileList = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      )
    }

    if (files.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-gray-600 mb-2">暂无文件</p>
            <p className="text-sm text-gray-500">拖拽文件到此处或点击上传按钮</p>
          </div>
        </div>
      )
    }

    return (
      <div ref={fileListRef} className="flex-1 overflow-auto p-4">
        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {files.map(file => (
              <div
                key={file.id}
                draggable={enableDragSort}
                onDragStart={(e) => handleDragStart(e, file)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'relative p-4 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200',
                  'hover:shadow-md hover:border-gray-300',
                  selectedFile?.id === file.id && 'border-blue-500 bg-blue-50',
                  selectedFiles.has(file.id) && 'ring-2 ring-blue-500',
                  draggedFile?.id === file.id && 'opacity-50'
                )}
                onClick={() => handleFileSelect(file)}
              >
                {/* 文件图标和名称 */}
                <div className="text-center">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{file.size ? `${Math.round(file.size / 1024)}KB` : ''}</p>
                </div>

                {/* 批量选择复选框 */}
                <div className="absolute top-2 left-2">
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
              </div>
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-2">
            {files.map(file => (
              <div
                key={file.id}
                draggable={enableDragSort}
                onDragStart={(e) => handleDragStart(e, file)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer transition-colors',
                  'hover:bg-gray-50',
                  selectedFile?.id === file.id && 'bg-blue-50 border-blue-200',
                  selectedFiles.has(file.id) && 'bg-blue-25',
                  draggedFile?.id === file.id && 'opacity-50'
                )}
                onClick={() => handleFileSelect(file)}
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.id)}
                  onChange={(e) => {
                    e.stopPropagation()
                    handleBatchSelect(file.id, e.target.checked)
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                />
                <div className="text-2xl mr-3">📄</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {file.size ? `${Math.round(file.size / 1024)}KB` : ''} •
                    {file.modified_at ? new Date(file.modified_at).toLocaleDateString() : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={files.length > 0 && selectedFiles.size === files.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    大小
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    修改时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map(file => (
                  <tr
                    key={file.id}
                    className={cn(
                      'hover:bg-gray-50 cursor-pointer',
                      selectedFile?.id === file.id && 'bg-blue-50',
                      selectedFiles.has(file.id) && 'bg-blue-25'
                    )}
                    onClick={() => handleFileSelect(file)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleBatchSelect(file.id, e.target.checked)
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-xl mr-3">📄</div>
                        <div className="text-sm font-medium text-gray-900">{file.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {file.size ? `${Math.round(file.size / 1024)}KB` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {file.modified_at ? new Date(file.modified_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // 下载文件
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        下载
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // 删除文件
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('enhanced-file-manager h-full flex flex-col bg-white', className)}>
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
        {/* 文件夹树 */}
        {showFolderTree && renderFolderTree()}

        {/* 文件列表 */}
        {renderFileList()}

        {/* 详情面板 */}
        {showDetailsPanel && selectedFile && (
          <div className="w-80 border-l border-gray-200 bg-gray-50">
            <FilePreviewComponent
              file={selectedFile.id}
              fileStorageService={fileStorageService}
              mode="inline"
              showControls={true}
              showFileInfo={true}
              allowDownload={true}
              allowFullscreen={true}
            />
          </div>
        )}
      </div>

      {/* 批量操作面板 */}
      {showBatchPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <BatchOperationsPanel
              items={Array.from(selectedFiles).map(id => {
                const file = files.find(f => f.id === id)
                return {
                  id,
                  title: file?.name || '',
                  type: 'file',
                  lastModified: file?.modified_at
                }
              })}
              operations={[
                { id: 'delete', name: '删除', description: '删除选中的文件' },
                { id: 'move', name: '移动', description: '移动到其他文件夹' },
                { id: 'copy', name: '复制', description: '复制文件' },
                { id: 'rename', name: '重命名', description: '批量重命名' }
              ]}
              selectedItems={Array.from(selectedFiles)}
              onOperationExecute={async (operation) => {
                const selectedFileEntities = files.filter(f => selectedFiles.has(f.id))
                await onBatchOperation?.(operation, selectedFileEntities)
                setShowBatchPanel(false)
                setSelectedFiles(new Set())
              }}
              onCancel={() => setShowBatchPanel(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedFileManagerComponent
