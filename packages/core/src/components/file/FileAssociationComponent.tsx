/**
 * 文件关联组件
 * 提供文件与笔记、任务的双向关联管理界面
 * 支持关联创建、编辑、删除、搜索和可视化
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { cn } from '../../utils'
import { 
  FileAssociationService, 
  FileAssociation, 
  AssociationModule, 
  FileAssociationType,
  AssociationSuggestion,
  AssociationQueryOptions
} from '../../services/FileAssociationService'
import { FileEntity } from '../../services/FileStorageService'

// 简单的图标组件
const LinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
)

const UnlinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
)

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const BulbIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

// 关联类型标签颜色映射
const ASSOCIATION_TYPE_COLORS: Record<FileAssociationType, string> = {
  attachment: 'bg-blue-100 text-blue-800',
  reference: 'bg-green-100 text-green-800',
  embed: 'bg-purple-100 text-purple-800',
  mention: 'bg-yellow-100 text-yellow-800',
  dependency: 'bg-red-100 text-red-800'
}

// 模块标签颜色映射
const MODULE_COLORS: Record<AssociationModule, string> = {
  notes: 'bg-indigo-100 text-indigo-800',
  tasks: 'bg-orange-100 text-orange-800',
  mindmap: 'bg-pink-100 text-pink-800',
  graph: 'bg-teal-100 text-teal-800'
}

// 关联类型中文名称
const ASSOCIATION_TYPE_NAMES: Record<FileAssociationType, string> = {
  attachment: '附件',
  reference: '引用',
  embed: '嵌入',
  mention: '提及',
  dependency: '依赖'
}

// 模块中文名称
const MODULE_NAMES: Record<AssociationModule, string> = {
  notes: '笔记',
  tasks: '任务',
  mindmap: '思维导图',
  graph: '图谱'
}

// 组件属性接口
export interface FileAssociationComponentProps {
  /** 文件实体 */
  file: FileEntity
  /** 文件关联服务 */
  fileAssociationService: FileAssociationService
  /** 是否显示建议 */
  showSuggestions?: boolean
  /** 是否允许编辑 */
  allowEdit?: boolean
  /** 是否允许删除 */
  allowDelete?: boolean
  /** 是否显示搜索 */
  showSearch?: boolean
  /** 最大显示数量 */
  maxDisplayCount?: number
  /** 自定义样式类名 */
  className?: string
  /** 关联创建回调 */
  onAssociationCreated?: (association: FileAssociation) => void
  /** 关联删除回调 */
  onAssociationDeleted?: (associationId: string) => void
  /** 关联更新回调 */
  onAssociationUpdated?: (association: FileAssociation) => void
  /** 错误回调 */
  onError?: (error: string) => void
}

/**
 * 文件关联组件
 */
export const FileAssociationComponent: React.FC<FileAssociationComponentProps> = ({
  file,
  fileAssociationService,
  showSuggestions = true,
  allowEdit = true,
  allowDelete = true,
  showSearch = true,
  maxDisplayCount = 20,
  className,
  onAssociationCreated,
  onAssociationDeleted,
  onAssociationUpdated,
  onError
}) => {
  // 状态管理
  const [associations, setAssociations] = useState<FileAssociation[]>([])
  const [suggestions, setSuggestions] = useState<AssociationSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedModule, setSelectedModule] = useState<AssociationModule | 'all'>('all')
  const [selectedType, setSelectedType] = useState<FileAssociationType | 'all'>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAssociation, setEditingAssociation] = useState<FileAssociation | null>(null)

  // 加载文件关联
  const loadAssociations = useCallback(async () => {
    if (!file?.id) return
    
    setIsLoading(true)
    try {
      const fileAssociations = await fileAssociationService.getFileAssociations(file.id)
      setAssociations(fileAssociations)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载关联失败'
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [file?.id, fileAssociationService, onError])

  // 加载关联建议
  const loadSuggestions = useCallback(async () => {
    if (!file?.id || !showSuggestions) return
    
    try {
      const associationSuggestions = await fileAssociationService.getAssociationSuggestions(file.id, {
        maxSuggestions: 5,
        minConfidence: 0.7
      })
      setSuggestions(associationSuggestions)
    } catch (error) {
      console.error('加载建议失败:', error)
    }
  }, [file?.id, fileAssociationService, showSuggestions])

  // 初始化加载
  useEffect(() => {
    loadAssociations()
    loadSuggestions()
  }, [loadAssociations, loadSuggestions])

  // 过滤后的关联列表
  const filteredAssociations = useMemo(() => {
    let filtered = associations

    // 模块过滤
    if (selectedModule !== 'all') {
      filtered = filtered.filter(a => a.module === selectedModule)
    }

    // 类型过滤
    if (selectedType !== 'all') {
      filtered = filtered.filter(a => a.associationType === selectedType)
    }

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(a => 
        a.metadata.description?.toLowerCase().includes(query) ||
        a.metadata.tags.some(tag => tag.toLowerCase().includes(query)) ||
        a.entityId.toLowerCase().includes(query)
      )
    }

    return filtered.slice(0, maxDisplayCount)
  }, [associations, selectedModule, selectedType, searchQuery, maxDisplayCount])

  // 创建关联
  const handleCreateAssociation = useCallback(async (
    module: AssociationModule,
    entityId: string,
    associationType: FileAssociationType,
    options: {
      description?: string
      tags?: string[]
      strength?: number
    } = {}
  ) => {
    if (!file?.id) return

    try {
      const association = await fileAssociationService.createAssociation(
        file.id,
        module,
        entityId,
        associationType,
        {
          strength: options.strength || 1.0,
          metadata: {
            description: options.description,
            tags: options.tags || [],
            customFields: {}
          }
        }
      )

      setAssociations(prev => [...prev, association])
      onAssociationCreated?.(association)
      setShowCreateForm(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建关联失败'
      onError?.(errorMessage)
    }
  }, [file?.id, fileAssociationService, onAssociationCreated, onError])

  // 删除关联
  const handleDeleteAssociation = useCallback(async (associationId: string) => {
    if (!confirm('确定要删除这个关联吗？')) return

    try {
      const success = await fileAssociationService.deleteAssociation(associationId)
      if (success) {
        setAssociations(prev => prev.filter(a => a.id !== associationId))
        onAssociationDeleted?.(associationId)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除关联失败'
      onError?.(errorMessage)
    }
  }, [fileAssociationService, onAssociationDeleted, onError])

  // 更新关联
  const handleUpdateAssociation = useCallback(async (
    associationId: string,
    updates: Partial<Pick<FileAssociation, 'associationType' | 'strength' | 'metadata'>>
  ) => {
    try {
      const updatedAssociation = await fileAssociationService.updateAssociation(associationId, updates)
      setAssociations(prev => prev.map(a => a.id === associationId ? updatedAssociation : a))
      onAssociationUpdated?.(updatedAssociation)
      setEditingAssociation(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新关联失败'
      onError?.(errorMessage)
    }
  }, [fileAssociationService, onAssociationUpdated, onError])

  // 应用建议
  const handleApplySuggestion = useCallback(async (suggestion: AssociationSuggestion) => {
    await handleCreateAssociation(
      suggestion.targetModule,
      suggestion.targetEntityId,
      suggestion.suggestedType,
      {
        description: suggestion.reason,
        strength: suggestion.confidence
      }
    )

    // 移除已应用的建议
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
  }, [handleCreateAssociation])

  // 格式化关联强度
  const formatStrength = useCallback((strength: number): string => {
    return `${Math.round(strength * 100)}%`
  }, [])

  // 渲染关联项
  const renderAssociationItem = useCallback((association: FileAssociation) => (
    <div
      key={association.id}
      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('px-2 py-1 text-xs rounded-full', MODULE_COLORS[association.module])}>
            {MODULE_NAMES[association.module]}
          </span>
          <span className={cn('px-2 py-1 text-xs rounded-full', ASSOCIATION_TYPE_COLORS[association.associationType])}>
            {ASSOCIATION_TYPE_NAMES[association.associationType]}
          </span>
          <span className="text-xs text-gray-500">
            强度: {formatStrength(association.strength)}
          </span>
        </div>
        
        <div className="text-sm font-medium text-gray-900 truncate">
          {association.entityId}
        </div>
        
        {association.metadata.description && (
          <div className="text-xs text-gray-600 mt-1">
            {association.metadata.description}
          </div>
        )}
        
        {association.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {association.metadata.tags.map(tag => (
              <span
                key={tag}
                className="px-1 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1 ml-2">
        {allowEdit && (
          <button
            onClick={() => setEditingAssociation(association)}
            className="p-1 text-gray-400 hover:text-blue-600 rounded"
            title="编辑关联"
          >
            <EditIcon />
          </button>
        )}
        
        {allowDelete && (
          <button
            onClick={() => handleDeleteAssociation(association.id)}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
            title="删除关联"
          >
            <DeleteIcon />
          </button>
        )}
      </div>
    </div>
  ), [allowEdit, allowDelete, formatStrength, handleDeleteAssociation])

  return (
    <div className={cn('file-association-component space-y-4', className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon />
          <h3 className="text-lg font-semibold text-gray-900">
            文件关联 ({associations.length})
          </h3>
        </div>
        
        {allowEdit && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <PlusIcon />
            添加关联
          </button>
        )}
      </div>

      {/* 搜索和过滤 */}
      {showSearch && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索关联..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value as AssociationModule | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部模块</option>
            {Object.entries(MODULE_NAMES).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as FileAssociationType | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部类型</option>
            {Object.entries(ASSOCIATION_TYPE_NAMES).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>
      )}

      {/* 建议区域 */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <BulbIcon className="text-yellow-600" />
            <h4 className="font-medium text-yellow-800">关联建议</h4>
          </div>
          
          <div className="space-y-2">
            {suggestions.map(suggestion => (
              <div
                key={suggestion.id}
                className="flex items-center justify-between p-2 bg-white rounded border"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {MODULE_NAMES[suggestion.targetModule]}: {suggestion.targetEntityId}
                  </div>
                  <div className="text-xs text-gray-600">
                    {suggestion.reason} (置信度: {Math.round(suggestion.confidence * 100)}%)
                  </div>
                </div>
                
                <button
                  onClick={() => handleApplySuggestion(suggestion)}
                  className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  应用
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 关联列表 */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            正在加载关联...
          </div>
        ) : filteredAssociations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {associations.length === 0 ? '暂无关联' : '没有匹配的关联'}
          </div>
        ) : (
          filteredAssociations.map(renderAssociationItem)
        )}
      </div>
    </div>
  )
}

export default FileAssociationComponent
