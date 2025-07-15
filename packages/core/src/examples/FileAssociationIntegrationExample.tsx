/**
 * 文件关联系统集成示例
 * 展示文件关联服务与其他组件的完整集成和工作流程
 */

import React, { useState, useEffect, useCallback } from 'react'
import { FileAssociationComponent } from '../components/file/FileAssociationComponent'
import { FilePreviewComponent } from '../components/file/FilePreviewComponent'
import { 
  FileAssociationService, 
  FileAssociation, 
  AssociationModule, 
  FileAssociationType 
} from '../services/FileAssociationService'
import { FileStorageService, FileEntity } from '../services/FileStorageService'
import { CrossModuleLinkService } from '../services/CrossModuleLinkService'
import { SearchEngine } from '../search/SearchEngine'
import { EventBus } from '../event-system/EventBus'
import { DatabaseManager } from '../database/DatabaseManager'

// 模拟的笔记和任务数据
interface MockNote {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: Date
}

interface MockTask {
  id: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  createdAt: Date
}

// 关联统计组件
const AssociationStats: React.FC<{
  fileAssociationService: FileAssociationService
}> = ({ fileAssociationService }) => {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const associationStats = await fileAssociationService.getAssociationStats()
      setStats(associationStats)
    } catch (error) {
      console.error('加载统计失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fileAssociationService])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  if (isLoading) {
    return <div className="text-center py-4">正在加载统计...</div>
  }

  if (!stats) {
    return <div className="text-center py-4 text-gray-500">暂无统计数据</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">关联统计</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalAssociations}</div>
          <div className="text-sm text-gray-600">总关联数</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.byModule.notes}</div>
          <div className="text-sm text-gray-600">笔记关联</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.byModule.tasks}</div>
          <div className="text-sm text-gray-600">任务关联</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(stats.performanceMetrics.averageQueryTime)}ms
          </div>
          <div className="text-sm text-gray-600">平均查询时间</div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="font-medium text-gray-700 mb-2">按类型分布</h4>
          <div className="space-y-1">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex justify-between text-sm">
                <span className="text-gray-600">{type}:</span>
                <span className="font-medium">{count as number}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-700 mb-2">性能指标</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">总查询数:</span>
              <span className="font-medium">{stats.performanceMetrics.totalQueries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">缓存命中率:</span>
              <span className="font-medium">
                {Math.round(stats.performanceMetrics.cacheHitRate * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 关联可视化组件
const AssociationVisualization: React.FC<{
  file: FileEntity
  associations: FileAssociation[]
}> = ({ file, associations }) => {
  const [selectedAssociation, setSelectedAssociation] = useState<FileAssociation | null>(null)

  // 按模块分组关联
  const groupedAssociations = associations.reduce((groups, association) => {
    if (!groups[association.module]) {
      groups[association.module] = []
    }
    groups[association.module].push(association)
    return groups
  }, {} as Record<AssociationModule, FileAssociation[]>)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">关联可视化</h3>
      
      <div className="space-y-4">
        {/* 文件节点 */}
        <div className="text-center">
          <div className="inline-block p-4 bg-blue-100 rounded-lg">
            <div className="font-medium text-blue-900">{file.name}</div>
            <div className="text-sm text-blue-700">{file.type}</div>
          </div>
        </div>

        {/* 关联连线和节点 */}
        {Object.entries(groupedAssociations).map(([module, moduleAssociations]) => (
          <div key={module} className="space-y-2">
            <h4 className="font-medium text-gray-700 capitalize">{module}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {moduleAssociations.map(association => (
                <div
                  key={association.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedAssociation?.id === association.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAssociation(association)}
                >
                  <div className="font-medium text-sm">{association.entityId}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {association.associationType} • 强度: {Math.round(association.strength * 100)}%
                  </div>
                  
                  {association.metadata.description && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {association.metadata.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {associations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            暂无关联数据
          </div>
        )}
      </div>

      {/* 选中关联的详细信息 */}
      {selectedAssociation && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">关联详情</h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">目标模块:</span>
              <span className="ml-2 font-medium">{selectedAssociation.module}</span>
            </div>
            
            <div>
              <span className="text-gray-600">关联类型:</span>
              <span className="ml-2 font-medium">{selectedAssociation.associationType}</span>
            </div>
            
            <div>
              <span className="text-gray-600">关联强度:</span>
              <span className="ml-2 font-medium">
                {Math.round(selectedAssociation.strength * 100)}%
              </span>
            </div>
            
            <div>
              <span className="text-gray-600">双向关联:</span>
              <span className="ml-2 font-medium">
                {selectedAssociation.bidirectional ? '是' : '否'}
              </span>
            </div>
            
            <div className="col-span-2">
              <span className="text-gray-600">创建时间:</span>
              <span className="ml-2 font-medium">
                {selectedAssociation.createdAt.toLocaleString()}
              </span>
            </div>
            
            {selectedAssociation.metadata.description && (
              <div className="col-span-2">
                <span className="text-gray-600">描述:</span>
                <span className="ml-2">{selectedAssociation.metadata.description}</span>
              </div>
            )}
            
            {selectedAssociation.metadata.tags.length > 0 && (
              <div className="col-span-2">
                <span className="text-gray-600">标签:</span>
                <div className="ml-2 flex flex-wrap gap-1 mt-1">
                  {selectedAssociation.metadata.tags.map(tag => (
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
      )}
    </div>
  )
}

// 主组件
export const FileAssociationIntegrationExample: React.FC = () => {
  const [fileAssociationService, setFileAssociationService] = useState<FileAssociationService | null>(null)
  const [fileStorageService, setFileStorageService] = useState<FileStorageService | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileEntity | null>(null)
  const [files, setFiles] = useState<FileEntity[]>([])
  const [associations, setAssociations] = useState<FileAssociation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // 初始化服务
  useEffect(() => {
    const initializeServices = async () => {
      try {
        const eventBus = new EventBus()
        const databaseManager = new DatabaseManager({} as any) // 临时修复类型问题
        const searchEngine = new SearchEngine()
        
        // 初始化文件存储服务
        const fileStorage = new FileStorageService(
          {
            storage_root: './data/files',
            thumbnail_dir: './data/thumbnails',
            max_file_size: 50 * 1024 * 1024,
            allowed_types: ['*'],
            enable_thumbnails: true,
            enable_indexing: true,
            storage_strategy: 'date-based'
          },
          eventBus,
          searchEngine
        )
        
        // 初始化跨模块链接服务
        const crossModuleLinkService = new CrossModuleLinkService(
          eventBus,
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
          eventBus,
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
        
        await fileStorage.initialize()
        await fileAssociation.initialize()
        
        setFileStorageService(fileStorage)
        setFileAssociationService(fileAssociation)
        
        // 加载示例文件
        await loadSampleFiles(fileStorage)
        
      } catch (error) {
        console.error('服务初始化失败:', error)
        setError('服务初始化失败')
      }
    }

    initializeServices()
  }, [])

  // 加载示例文件
  const loadSampleFiles = async (fileStorage: FileStorageService) => {
    try {
      // 这里应该加载实际的文件数据
      // 暂时使用模拟数据
      const sampleFiles: FileEntity[] = [
        {
          id: 'file-1',
          name: '项目需求文档.pdf',
          original_name: '项目需求文档.pdf',
          type: 'application/pdf',
          size: 2 * 1024 * 1024,
          path: '/files/project-requirements.pdf',
          checksum: 'checksum-1',
          url: '/api/files/file-1',
          metadata: {
            description: '项目需求分析文档',
            tags: ['需求', '项目', '文档'],
            category: 'document',
            custom_fields: {},
            permissions: {
              is_public: false,
              allow_download: true,
              allow_preview: true,
              shared_users: [],
              editors: [],
              viewers: []
            }
          },
          associations: [],
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        {
          id: 'file-2',
          name: '设计原型图.png',
          original_name: '设计原型图.png',
          type: 'image/png',
          size: 5 * 1024 * 1024,
          path: '/files/design-prototype.png',
          checksum: 'checksum-2',
          url: '/api/files/file-2',
          metadata: {
            description: 'UI设计原型图',
            tags: ['设计', 'UI', '原型'],
            category: 'image',
            custom_fields: {},
            permissions: {
              is_public: false,
              allow_download: true,
              allow_preview: true,
              shared_users: [],
              editors: [],
              viewers: []
            }
          },
          associations: [],
          created_at: new Date('2024-01-02'),
          updated_at: new Date('2024-01-02')
        }
      ]
      
      setFiles(sampleFiles)
      if (sampleFiles.length > 0) {
        setSelectedFile(sampleFiles[0])
      }
    } catch (error) {
      console.error('加载示例文件失败:', error)
    }
  }

  // 加载文件关联
  const loadFileAssociations = useCallback(async (file: FileEntity) => {
    if (!fileAssociationService) return
    
    setIsLoading(true)
    try {
      const fileAssociations = await fileAssociationService.getFileAssociations(file.id)
      setAssociations(fileAssociations)
    } catch (error) {
      console.error('加载文件关联失败:', error)
      setError('加载文件关联失败')
    } finally {
      setIsLoading(false)
    }
  }, [fileAssociationService])

  // 选择文件
  const handleFileSelect = useCallback((file: FileEntity) => {
    setSelectedFile(file)
    loadFileAssociations(file)
  }, [loadFileAssociations])

  // 处理关联创建
  const handleAssociationCreated = useCallback((association: FileAssociation) => {
    setAssociations(prev => [...prev, association])
  }, [])

  // 处理关联删除
  const handleAssociationDeleted = useCallback((associationId: string) => {
    setAssociations(prev => prev.filter(a => a.id !== associationId))
  }, [])

  // 处理关联更新
  const handleAssociationUpdated = useCallback((association: FileAssociation) => {
    setAssociations(prev => prev.map(a => a.id === association.id ? association : a))
  }, [])

  // 处理错误
  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setTimeout(() => setError(''), 5000)
  }, [])

  if (!fileAssociationService || !fileStorageService) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">正在初始化文件关联系统...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          文件关联系统集成示例
        </h1>
        <p className="text-gray-600">
          展示文件与笔记、任务的双向关联管理和可视化
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 文件列表 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">文件列表</h2>
            
            <div className="space-y-3">
              {files.map(file => (
                <div
                  key={file.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedFile?.id === file.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleFileSelect(file)}
                >
                  <div className="font-medium text-gray-900">{file.name}</div>
                  <div className="text-sm text-gray-600">{file.type}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {file.metadata.tags.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 统计信息 */}
          <div className="mt-6">
            <AssociationStats fileAssociationService={fileAssociationService} />
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="lg:col-span-2 space-y-6">
          {selectedFile ? (
            <>
              {/* 文件预览 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">文件预览</h2>
                <FilePreviewComponent
                  file={selectedFile}
                  fileStorageService={fileStorageService}
                  mode="inline"
                  maxWidth={600}
                  maxHeight={400}
                  onError={handleError}
                />
              </div>

              {/* 文件关联管理 */}
              <FileAssociationComponent
                file={selectedFile}
                fileAssociationService={fileAssociationService}
                showSuggestions={true}
                allowEdit={true}
                allowDelete={true}
                showSearch={true}
                onAssociationCreated={handleAssociationCreated}
                onAssociationDeleted={handleAssociationDeleted}
                onAssociationUpdated={handleAssociationUpdated}
                onError={handleError}
              />

              {/* 关联可视化 */}
              <AssociationVisualization
                file={selectedFile}
                associations={associations}
              />
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📁</div>
              <div>请选择一个文件查看关联信息</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FileAssociationIntegrationExample
