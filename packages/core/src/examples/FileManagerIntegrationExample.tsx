/**
 * 文件管理集成示例
 * 展示FileManagerComponent与所有文件相关组件的完整集成
 */

import React, { useState, useEffect, useCallback } from 'react'
import { FileManagerComponent } from '../components/file/FileManagerComponent'
import { FileStorageService, FileEntity } from '../services/FileStorageService'
import { FileAssociationService } from '../services/FileAssociationService'
import { CrossModuleLinkService } from '../services/CrossModuleLinkService'
import { SearchEngine } from '../search/SearchEngine'
import { EventBus } from '../event-system/EventBus'
import { DatabaseManager } from '../database/DatabaseManager'
import { FileUploadItem } from '../components/file/FileUploadComponent'

// 统计面板组件
const FileStatsPanel: React.FC<{
  fileStorageService: FileStorageService
  fileAssociationService: FileAssociationService
}> = ({ fileStorageService, fileAssociationService }) => {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const [storageStats, associationStats] = await Promise.all([
        fileStorageService.getStorageStats(),
        fileAssociationService.getAssociationStats()
      ])
      
      setStats({
        storage: storageStats,
        associations: associationStats
      })
    } catch (error) {
      console.error('加载统计失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fileStorageService, fileAssociationService])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">正在加载统计...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">暂无统计数据</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">系统统计</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {stats.storage?.totalFiles || 0}
          </div>
          <div className="text-sm text-gray-600">总文件数</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.storage?.totalSize ? 
              `${Math.round(stats.storage.totalSize / (1024 * 1024))}MB` : 
              '0MB'
            }
          </div>
          <div className="text-sm text-gray-600">总大小</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {stats.associations?.totalAssociations || 0}
          </div>
          <div className="text-sm text-gray-600">关联数</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {stats.storage?.performanceMetrics?.averageQueryTime ? 
              `${Math.round(stats.storage.performanceMetrics.averageQueryTime)}ms` : 
              '0ms'
            }
          </div>
          <div className="text-sm text-gray-600">平均响应</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 文件类型分布 */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">文件类型分布</h4>
          <div className="space-y-2">
            {stats.storage?.byType && Object.entries(stats.storage.byType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{type}:</span>
                <span className="font-medium">{count as number}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 关联类型分布 */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">关联类型分布</h4>
          <div className="space-y-2">
            {stats.associations?.byType && Object.entries(stats.associations.byType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{type}:</span>
                <span className="font-medium">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={loadStats}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          刷新统计
        </button>
      </div>
    </div>
  )
}

// 活动日志组件
const ActivityLogPanel: React.FC<{
  eventBus: EventBus
}> = ({ eventBus }) => {
  const [activities, setActivities] = useState<Array<{
    id: string
    type: string
    message: string
    timestamp: Date
  }>>([])

  useEffect(() => {
    const handleFileEvent = (event: any) => {
      const activity = {
        id: `${Date.now()}-${Math.random()}`,
        type: event.type,
        message: getEventMessage(event),
        timestamp: new Date()
      }
      
      setActivities(prev => [activity, ...prev.slice(0, 19)]) // 保留最近20条
    }

    // 监听文件相关事件
    const events = [
      'file:uploaded',
      'file:deleted',
      'file:updated',
      'file-association:created',
      'file-association:deleted',
      'file-preview:opened'
    ]

    events.forEach(eventType => {
      eventBus.on(eventType, handleFileEvent)
    })

    return () => {
      events.forEach(eventType => {
        eventBus.off(eventType, handleFileEvent)
      })
    }
  }, [eventBus])

  const getEventMessage = (event: any): string => {
    switch (event.type) {
      case 'file:uploaded':
        return `上传文件: ${event.data.fileName}`
      case 'file:deleted':
        return `删除文件: ${event.data.fileName}`
      case 'file:updated':
        return `更新文件: ${event.data.fileName}`
      case 'file-association:created':
        return `创建关联: ${event.data.association.fileId} -> ${event.data.association.entityId}`
      case 'file-association:deleted':
        return `删除关联: ${event.data.associationId}`
      case 'file-preview:opened':
        return `预览文件: ${event.data.fileName}`
      default:
        return `未知操作: ${event.type}`
    }
  }

  const getEventIcon = (type: string): string => {
    switch (type) {
      case 'file:uploaded': return '📤'
      case 'file:deleted': return '🗑️'
      case 'file:updated': return '✏️'
      case 'file-association:created': return '🔗'
      case 'file-association:deleted': return '🔓'
      case 'file-preview:opened': return '👁️'
      default: return '📋'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">活动日志</h3>
      
      {activities.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          暂无活动记录
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map(activity => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-lg">{getEventIcon(activity.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {activity.timestamp.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 主组件
export const FileManagerIntegrationExample: React.FC = () => {
  const [fileStorageService, setFileStorageService] = useState<FileStorageService | null>(null)
  const [fileAssociationService, setFileAssociationService] = useState<FileAssociationService | null>(null)
  const [eventBus, setEventBus] = useState<EventBus | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileEntity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showStats, setShowStats] = useState(true)
  const [showActivity, setShowActivity] = useState(true)

  // 初始化服务
  useEffect(() => {
    const initializeServices = async () => {
      try {
        setIsLoading(true)
        
        const eventBusInstance = new EventBus()
        const databaseManager = new DatabaseManager({} as any) // 临时修复类型问题
        const searchEngine = new SearchEngine()
        
        // 初始化文件存储服务
        const fileStorage = new FileStorageService(
          {
            storage_root: './data/files',
            thumbnail_dir: './data/thumbnails',
            max_file_size: 100 * 1024 * 1024, // 100MB
            allowed_types: [
              'image/*',
              'video/*',
              'audio/*',
              'application/pdf',
              'text/*',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-powerpoint',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            ],
            enable_thumbnails: true,
            enable_indexing: true,
            storage_strategy: 'date-based'
          },
          eventBusInstance,
          searchEngine
        )
        
        // 初始化跨模块链接服务
        const crossModuleLinkService = new CrossModuleLinkService(
          eventBusInstance,
          databaseManager,
          {
            enableAutoSync: true,
            enableBidirectionalLinks: true,
            enableLinkValidation: true,
            cacheSize: 1000
          }
        )
        
        // 初始化文件关联服务
        const fileAssociation = new FileAssociationService(
          eventBusInstance,
          crossModuleLinkService,
          searchEngine,
          fileStorage,
          {
            enableAutoSuggestions: true,
            enableBidirectionalLinks: true,
            enableIndexing: true,
            cacheSize: 1000
          }
        )
        
        // 初始化所有服务
        await Promise.all([
          fileStorage.initialize(),
          fileAssociation.initialize()
        ])
        
        setEventBus(eventBusInstance)
        setFileStorageService(fileStorage)
        setFileAssociationService(fileAssociation)
        
      } catch (error) {
        console.error('服务初始化失败:', error)
        setError('服务初始化失败')
      } finally {
        setIsLoading(false)
      }
    }

    initializeServices()
  }, [])

  // 处理文件选择
  const handleFileSelect = useCallback((file: FileEntity | null) => {
    setSelectedFile(file)
  }, [])

  // 处理文件上传完成
  const handleFileUploaded = useCallback((files: FileUploadItem[]) => {
    console.log('文件上传完成:', files)
    // 这里可以添加上传完成后的处理逻辑
  }, [])

  // 处理文件删除
  const handleFileDeleted = useCallback((fileId: string) => {
    console.log('文件删除:', fileId)
    if (selectedFile?.id === fileId) {
      setSelectedFile(null)
    }
  }, [selectedFile])

  // 处理错误
  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setTimeout(() => setError(''), 5000)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">正在初始化文件管理系统...</div>
        </div>
      </div>
    )
  }

  if (!fileStorageService || !fileAssociationService || !eventBus) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-2">⚠️ 初始化失败</div>
          <div className="text-gray-600">{error || '服务初始化失败'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">文件管理系统</h1>
              <p className="text-sm text-gray-600">完整的文件管理、预览、关联解决方案</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowStats(!showStats)}
                className={`px-3 py-1 text-sm rounded ${
                  showStats 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                统计面板
              </button>
              
              <button
                onClick={() => setShowActivity(!showActivity)}
                className={`px-3 py-1 text-sm rounded ${
                  showActivity 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                活动日志
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="text-red-600">⚠️</div>
              <div className="text-red-800">{error}</div>
              <button
                onClick={() => setError('')}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 文件管理器 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '80vh' }}>
              <FileManagerComponent
                fileStorageService={fileStorageService}
                fileAssociationService={fileAssociationService}
                initialViewMode="grid"
                showUpload={true}
                showPreview={true}
                showAssociations={true}
                allowBatchOperations={true}
                allowDelete={true}
                allowDownload={true}
                pageSize={24}
                onFileSelect={handleFileSelect}
                onFileUploaded={handleFileUploaded}
                onFileDeleted={handleFileDeleted}
                onError={handleError}
              />
            </div>
          </div>

          {/* 侧边栏 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 统计面板 */}
            {showStats && (
              <FileStatsPanel
                fileStorageService={fileStorageService}
                fileAssociationService={fileAssociationService}
              />
            )}

            {/* 活动日志 */}
            {showActivity && (
              <ActivityLogPanel eventBus={eventBus} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileManagerIntegrationExample
