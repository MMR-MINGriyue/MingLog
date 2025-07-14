/**
 * 文件关联服务
 * 实现文件与笔记、任务的双向关联功能，集成CrossModuleDataBridge架构
 * 支持关联搜索和关联可视化
 */

import { EventBus } from '../event-system/EventBus'
import { CrossModuleLinkService, LinkReference } from './CrossModuleLinkService'
import { SearchEngine } from '../search/SearchEngine'
import { FileStorageService, FileEntity } from './FileStorageService'

// 文件关联类型枚举
export type FileAssociationType = 'attachment' | 'reference' | 'embed' | 'mention' | 'dependency'

// 关联模块类型
export type AssociationModule = 'notes' | 'tasks' | 'mindmap' | 'graph'

// 文件关联接口
export interface FileAssociation {
  /** 关联唯一标识符 */
  id: string
  /** 文件ID */
  fileId: string
  /** 关联模块 */
  module: AssociationModule
  /** 关联实体ID */
  entityId: string
  /** 关联类型 */
  associationType: FileAssociationType
  /** 关联强度 (0-1) */
  strength: number
  /** 是否双向关联 */
  bidirectional: boolean
  /** 关联位置信息 */
  position?: {
    /** 在文档中的位置 */
    offset?: number
    /** 行号 */
    line?: number
    /** 列号 */
    column?: number
    /** 选择范围 */
    selection?: { start: number; end: number }
  }
  /** 关联元数据 */
  metadata: {
    /** 关联描述 */
    description?: string
    /** 关联标签 */
    tags: string[]
    /** 创建者 */
    createdBy?: string
    /** 关联上下文 */
    context?: string
    /** 自定义字段 */
    customFields: Record<string, any>
  }
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
}

// 关联查询选项
export interface AssociationQueryOptions {
  /** 文件ID过滤 */
  fileId?: string
  /** 模块过滤 */
  module?: AssociationModule | AssociationModule[]
  /** 实体ID过滤 */
  entityId?: string
  /** 关联类型过滤 */
  associationType?: FileAssociationType | FileAssociationType[]
  /** 最小关联强度 */
  minStrength?: number
  /** 搜索关键词 */
  search?: string
  /** 标签过滤 */
  tags?: string[]
  /** 排序字段 */
  sortBy?: 'createdAt' | 'updatedAt' | 'strength' | 'associationType'
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'
  /** 分页限制 */
  limit?: number
  /** 分页偏移 */
  offset?: number
}

// 关联查询结果
export interface AssociationQueryResult {
  /** 关联列表 */
  associations: FileAssociation[]
  /** 总数 */
  total: number
  /** 是否有更多数据 */
  hasMore: boolean
  /** 查询统计 */
  stats: {
    /** 按模块分组的数量 */
    byModule: Record<AssociationModule, number>
    /** 按类型分组的数量 */
    byType: Record<FileAssociationType, number>
    /** 平均关联强度 */
    averageStrength: number
  }
}

// 关联建议
export interface AssociationSuggestion {
  /** 建议ID */
  id: string
  /** 文件ID */
  fileId: string
  /** 目标模块 */
  targetModule: AssociationModule
  /** 目标实体ID */
  targetEntityId: string
  /** 建议的关联类型 */
  suggestedType: FileAssociationType
  /** 建议强度 */
  confidence: number
  /** 建议原因 */
  reason: string
  /** 相关上下文 */
  context?: string
}

// 文件关联服务配置
export interface FileAssociationServiceConfig {
  /** 是否启用自动关联建议 */
  enableAutoSuggestions: boolean
  /** 是否启用双向关联 */
  enableBidirectionalLinks: boolean
  /** 是否启用关联索引 */
  enableIndexing: boolean
  /** 缓存大小 */
  cacheSize: number
  /** 建议算法配置 */
  suggestionConfig: {
    /** 最小置信度阈值 */
    minConfidence: number
    /** 最大建议数量 */
    maxSuggestions: number
    /** 启用的建议算法 */
    enabledAlgorithms: string[]
  }
}

// 默认配置
const DEFAULT_CONFIG: FileAssociationServiceConfig = {
  enableAutoSuggestions: true,
  enableBidirectionalLinks: true,
  enableIndexing: true,
  cacheSize: 1000,
  suggestionConfig: {
    minConfidence: 0.6,
    maxSuggestions: 10,
    enabledAlgorithms: ['content-similarity', 'tag-matching', 'temporal-proximity']
  }
}

/**
 * 文件关联服务类
 */
export class FileAssociationService {
  private eventBus: EventBus
  private crossModuleLinkService: CrossModuleLinkService
  private searchEngine: SearchEngine
  private fileStorageService: FileStorageService
  private config: FileAssociationServiceConfig
  
  // 缓存
  private associationCache = new Map<string, FileAssociation[]>()
  private suggestionCache = new Map<string, AssociationSuggestion[]>()
  
  // 性能监控
  private performanceMetrics = {
    totalQueries: 0,
    averageQueryTime: 0,
    cacheHitRate: 0,
    totalAssociations: 0
  }

  constructor(
    eventBus: EventBus,
    crossModuleLinkService: CrossModuleLinkService,
    searchEngine: SearchEngine,
    fileStorageService: FileStorageService,
    config: Partial<FileAssociationServiceConfig> = {}
  ) {
    this.eventBus = eventBus
    this.crossModuleLinkService = crossModuleLinkService
    this.searchEngine = searchEngine
    this.fileStorageService = fileStorageService
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    this.initializeEventListeners()
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    try {
      // 初始化索引
      if (this.config.enableIndexing) {
        await this.initializeSearchIndex()
      }
      
      // 发送初始化完成事件
      this.eventBus.emit('file-association:service-initialized', {
        config: this.config,
        metrics: this.performanceMetrics
      }, 'FileAssociationService')
      
    } catch (error) {
      console.error('文件关联服务初始化失败:', error)
      throw error
    }
  }

  /**
   * 创建文件关联
   */
  async createAssociation(
    fileId: string,
    module: AssociationModule,
    entityId: string,
    associationType: FileAssociationType,
    options: {
      strength?: number
      bidirectional?: boolean
      position?: FileAssociation['position']
      metadata?: Partial<FileAssociation['metadata']>
    } = {}
  ): Promise<FileAssociation> {
    const startTime = performance.now()
    
    try {
      // 验证文件存在
      const file = await this.fileStorageService.getFile(fileId)
      if (!file) {
        throw new Error(`文件不存在: ${fileId}`)
      }
      
      // 验证目标实体存在
      await this.validateTargetEntity(module, entityId)
      
      // 创建关联对象
      const association: FileAssociation = {
        id: this.generateAssociationId(),
        fileId,
        module,
        entityId,
        associationType,
        strength: options.strength || 1.0,
        bidirectional: options.bidirectional ?? this.config.enableBidirectionalLinks,
        position: options.position,
        metadata: {
          description: options.metadata?.description,
          tags: options.metadata?.tags || [],
          createdBy: options.metadata?.createdBy,
          context: options.metadata?.context,
          customFields: options.metadata?.customFields || {}
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // 使用CrossModuleLinkService创建底层链接
      await this.crossModuleLinkService.createLink(
        'files',
        fileId,
        module,
        entityId,
        this.mapAssociationTypeToLinkType(associationType),
        {
          strength: association.strength,
          position: association.position,
          ...association.metadata
        }
      )
      
      // 更新缓存
      this.updateAssociationCache(association)
      
      // 更新搜索索引
      if (this.config.enableIndexing) {
        await this.indexAssociation(association)
      }
      
      // 发送事件
      this.eventBus.emit('file-association:created', {
        association,
        file,
        targetModule: module,
        targetEntityId: entityId
      }, 'FileAssociationService')
      
      // 更新性能指标
      this.updatePerformanceMetrics(startTime)
      this.performanceMetrics.totalAssociations++
      
      return association
      
    } catch (error) {
      console.error('创建文件关联失败:', error)
      
      this.eventBus.emit('file-association:error', {
        operation: 'create',
        fileId,
        module,
        entityId,
        error: error instanceof Error ? error.message : '未知错误'
      }, 'FileAssociationService')
      
      throw error
    }
  }

  /**
   * 查询文件关联
   */
  async queryAssociations(options: AssociationQueryOptions = {}): Promise<AssociationQueryResult> {
    const startTime = performance.now()
    
    try {
      // 检查缓存
      const cacheKey = this.generateCacheKey(options)
      if (this.associationCache.has(cacheKey)) {
        this.performanceMetrics.cacheHitRate++
        const cachedAssociations = this.associationCache.get(cacheKey)!
        return this.buildQueryResult(cachedAssociations, options)
      }
      
      // 构建查询条件
      const queryConditions = this.buildQueryConditions(options)
      
      // 执行查询
      const associations = await this.executeAssociationQuery(queryConditions, options)
      
      // 更新缓存
      this.associationCache.set(cacheKey, associations)
      this.manageCacheSize()
      
      // 构建结果
      const result = this.buildQueryResult(associations, options)
      
      // 更新性能指标
      this.updatePerformanceMetrics(startTime)
      this.performanceMetrics.totalQueries++
      
      return result
      
    } catch (error) {
      console.error('查询文件关联失败:', error)
      throw error
    }
  }

  /**
   * 获取文件的所有关联
   */
  async getFileAssociations(fileId: string): Promise<FileAssociation[]> {
    return this.queryAssociations({ fileId }).then(result => result.associations)
  }

  /**
   * 获取实体的所有文件关联
   */
  async getEntityFileAssociations(
    module: AssociationModule,
    entityId: string
  ): Promise<FileAssociation[]> {
    return this.queryAssociations({ module, entityId }).then(result => result.associations)
  }

  /**
   * 删除文件关联
   */
  async deleteAssociation(associationId: string): Promise<boolean> {
    try {
      // 查找关联
      const association = await this.findAssociationById(associationId)
      if (!association) {
        return false
      }

      // 删除底层链接
      const linkId = await this.findLinkIdByAssociation(association)
      if (linkId) {
        await this.crossModuleLinkService.deleteLink(linkId)
      }

      // 清除缓存
      this.clearAssociationCache(association)

      // 从搜索索引中移除
      if (this.config.enableIndexing) {
        await this.removeFromSearchIndex(association)
      }

      // 发送事件
      this.eventBus.emit('file-association:deleted', {
        associationId,
        association
      }, 'FileAssociationService')

      this.performanceMetrics.totalAssociations--

      return true

    } catch (error) {
      console.error('删除文件关联失败:', error)

      this.eventBus.emit('file-association:error', {
        operation: 'delete',
        associationId,
        error: error instanceof Error ? error.message : '未知错误'
      }, 'FileAssociationService')

      throw error
    }
  }

  /**
   * 更新文件关联
   */
  async updateAssociation(
    associationId: string,
    updates: Partial<Pick<FileAssociation, 'associationType' | 'strength' | 'position' | 'metadata'>>
  ): Promise<FileAssociation> {
    try {
      const association = await this.findAssociationById(associationId)
      if (!association) {
        throw new Error(`关联不存在: ${associationId}`)
      }

      // 更新关联对象
      const updatedAssociation: FileAssociation = {
        ...association,
        ...updates,
        updatedAt: new Date()
      }

      // 更新底层链接
      const linkId = await this.findLinkIdByAssociation(association)
      if (linkId) {
        await this.crossModuleLinkService.updateLink(linkId, {
          linkType: updates.associationType ?
            this.mapAssociationTypeToLinkType(updates.associationType) :
            undefined,
          metadata: {
            strength: updates.strength,
            position: updates.position,
            ...updates.metadata
          }
        })
      }

      // 更新缓存
      this.updateAssociationCache(updatedAssociation)

      // 更新搜索索引
      if (this.config.enableIndexing) {
        await this.indexAssociation(updatedAssociation)
      }

      // 发送事件
      this.eventBus.emit('file-association:updated', {
        associationId,
        association: updatedAssociation,
        previousAssociation: association,
        updates
      }, 'FileAssociationService')

      return updatedAssociation

    } catch (error) {
      console.error('更新文件关联失败:', error)
      throw error
    }
  }

  /**
   * 获取关联建议
   */
  async getAssociationSuggestions(
    fileId: string,
    options: {
      targetModules?: AssociationModule[]
      maxSuggestions?: number
      minConfidence?: number
    } = {}
  ): Promise<AssociationSuggestion[]> {
    if (!this.config.enableAutoSuggestions) {
      return []
    }

    try {
      // 检查缓存
      const cacheKey = `suggestions:${fileId}:${JSON.stringify(options)}`
      if (this.suggestionCache.has(cacheKey)) {
        return this.suggestionCache.get(cacheKey)!
      }

      // 获取文件信息
      const file = await this.fileStorageService.getFile(fileId)
      if (!file) {
        throw new Error(`文件不存在: ${fileId}`)
      }

      // 生成建议
      const suggestions = await this.generateSuggestions(file, options)

      // 过滤和排序建议
      const filteredSuggestions = suggestions
        .filter(s => s.confidence >= (options.minConfidence || this.config.suggestionConfig.minConfidence))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, options.maxSuggestions || this.config.suggestionConfig.maxSuggestions)

      // 更新缓存
      this.suggestionCache.set(cacheKey, filteredSuggestions)

      // 发送事件
      this.eventBus.emit('file-association:suggestions-generated', {
        fileId,
        suggestions: filteredSuggestions,
        options
      }, 'FileAssociationService')

      return filteredSuggestions

    } catch (error) {
      console.error('获取关联建议失败:', error)
      throw error
    }
  }

  /**
   * 搜索关联
   */
  async searchAssociations(
    query: string,
    options: {
      modules?: AssociationModule[]
      associationTypes?: FileAssociationType[]
      limit?: number
    } = {}
  ): Promise<FileAssociation[]> {
    if (!this.config.enableIndexing) {
      // 如果没有启用索引，使用基础查询
      return this.queryAssociations({
        search: query,
        module: options.modules,
        associationType: options.associationTypes,
        limit: options.limit
      }).then(result => result.associations)
    }

    try {
      // 使用搜索引擎进行全文搜索
      const searchResults = await this.searchEngine.search(query, {
        filters: {
          type: 'file-association',
          module: options.modules,
          associationType: options.associationTypes
        },
        limit: options.limit || 20
      })

      // 将搜索结果转换为关联对象
      const associations = await Promise.all(
        searchResults.results.map(async (result) => {
          return this.findAssociationById(result.id)
        })
      )

      return associations.filter(Boolean) as FileAssociation[]

    } catch (error) {
      console.error('搜索关联失败:', error)
      throw error
    }
  }

  /**
   * 获取关联统计信息
   */
  async getAssociationStats(): Promise<{
    totalAssociations: number
    byModule: Record<AssociationModule, number>
    byType: Record<FileAssociationType, number>
    byFile: Array<{ fileId: string; fileName: string; count: number }>
    recentActivity: Array<{ date: string; count: number }>
    performanceMetrics: typeof this.performanceMetrics
  }> {
    try {
      const allAssociations = await this.queryAssociations({ limit: 10000 })

      const stats = {
        totalAssociations: allAssociations.total,
        byModule: allAssociations.stats.byModule,
        byType: allAssociations.stats.byType,
        byFile: await this.getFileAssociationCounts(),
        recentActivity: await this.getRecentActivity(),
        performanceMetrics: { ...this.performanceMetrics }
      }

      return stats

    } catch (error) {
      console.error('获取关联统计失败:', error)
      throw error
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    // 监听文件删除事件，清理相关关联
    this.eventBus.on('file:deleted', async (event) => {
      const { fileId } = event.data
      await this.deleteFileAssociations(fileId)
    })

    // 监听实体删除事件，清理相关关联
    this.eventBus.on('data:deleted', async (event) => {
      const { type, id } = event.data
      const module = this.mapEntityTypeToModule(type)
      if (module) {
        await this.deleteEntityAssociations(module, id)
      }
    })

    // 监听文件更新事件，更新关联索引
    this.eventBus.on('file:updated', async (event) => {
      const { fileId } = event.data
      await this.reindexFileAssociations(fileId)
    })
  }

  /**
   * 初始化搜索索引
   */
  private async initializeSearchIndex(): Promise<void> {
    try {
      // 为文件关联创建搜索索引
      await this.searchEngine.createIndex('file-associations', {
        fields: ['fileId', 'module', 'entityId', 'associationType', 'metadata.description', 'metadata.tags'],
        searchableFields: ['metadata.description', 'metadata.tags', 'metadata.context'],
        filterFields: ['module', 'associationType', 'fileId', 'entityId']
      })
    } catch (error) {
      console.error('初始化搜索索引失败:', error)
    }
  }

  /**
   * 验证目标实体存在
   */
  private async validateTargetEntity(module: AssociationModule, entityId: string): Promise<void> {
    // 这里应该调用相应模块的服务来验证实体存在
    // 暂时使用CrossModuleLinkService的验证逻辑
    try {
      const links = await this.crossModuleLinkService.getLinksForItem(module, entityId)
      // 如果能获取到链接信息，说明实体存在
    } catch (error) {
      throw new Error(`目标实体不存在: ${module}:${entityId}`)
    }
  }

  /**
   * 生成关联ID
   */
  private generateAssociationId(): string {
    return `file-assoc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 映射关联类型到链接类型
   */
  private mapAssociationTypeToLinkType(associationType: FileAssociationType): 'reference' | 'embed' | 'mention' | 'dependency' {
    switch (associationType) {
      case 'attachment':
      case 'reference':
        return 'reference'
      case 'embed':
        return 'embed'
      case 'mention':
        return 'mention'
      case 'dependency':
        return 'dependency'
      default:
        return 'reference'
    }
  }

  /**
   * 映射实体类型到模块
   */
  private mapEntityTypeToModule(entityType: string): AssociationModule | null {
    switch (entityType) {
      case 'note':
        return 'notes'
      case 'task':
        return 'tasks'
      case 'mindmap-node':
        return 'mindmap'
      case 'graph-node':
        return 'graph'
      default:
        return null
    }
  }

  /**
   * 更新关联缓存
   */
  private updateAssociationCache(association: FileAssociation): void {
    // 更新文件相关的缓存
    const fileKey = `file:${association.fileId}`
    const fileAssociations = this.associationCache.get(fileKey) || []
    const existingIndex = fileAssociations.findIndex(a => a.id === association.id)

    if (existingIndex >= 0) {
      fileAssociations[existingIndex] = association
    } else {
      fileAssociations.push(association)
    }

    this.associationCache.set(fileKey, fileAssociations)

    // 更新实体相关的缓存
    const entityKey = `entity:${association.module}:${association.entityId}`
    const entityAssociations = this.associationCache.get(entityKey) || []
    const entityExistingIndex = entityAssociations.findIndex(a => a.id === association.id)

    if (entityExistingIndex >= 0) {
      entityAssociations[entityExistingIndex] = association
    } else {
      entityAssociations.push(association)
    }

    this.associationCache.set(entityKey, entityAssociations)
  }

  /**
   * 清除关联缓存
   */
  private clearAssociationCache(association: FileAssociation): void {
    // 清除相关的缓存条目
    const keysToRemove: string[] = []

    for (const [key, associations] of this.associationCache.entries()) {
      const filteredAssociations = associations.filter(a => a.id !== association.id)
      if (filteredAssociations.length !== associations.length) {
        if (filteredAssociations.length === 0) {
          keysToRemove.push(key)
        } else {
          this.associationCache.set(key, filteredAssociations)
        }
      }
    }

    keysToRemove.forEach(key => this.associationCache.delete(key))
  }

  /**
   * 管理缓存大小
   */
  private manageCacheSize(): void {
    if (this.associationCache.size > this.config.cacheSize) {
      // 删除最旧的缓存条目
      const entries = Array.from(this.associationCache.entries())
      const toDelete = entries.slice(0, entries.length - this.config.cacheSize)
      toDelete.forEach(([key]) => this.associationCache.delete(key))
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(options: AssociationQueryOptions): string {
    return `query:${JSON.stringify(options)}`
  }

  /**
   * 构建查询条件
   */
  private buildQueryConditions(options: AssociationQueryOptions): any {
    const conditions: any = {}

    if (options.fileId) conditions.fileId = options.fileId
    if (options.module) conditions.module = options.module
    if (options.entityId) conditions.entityId = options.entityId
    if (options.associationType) conditions.associationType = options.associationType
    if (options.minStrength) conditions.minStrength = options.minStrength
    if (options.tags) conditions.tags = options.tags

    return conditions
  }

  /**
   * 执行关联查询
   */
  private async executeAssociationQuery(
    conditions: any,
    options: AssociationQueryOptions
  ): Promise<FileAssociation[]> {
    // 这里应该实现实际的数据库查询
    // 暂时返回模拟数据
    const mockAssociations: FileAssociation[] = []
    return mockAssociations
  }

  /**
   * 构建查询结果
   */
  private buildQueryResult(
    associations: FileAssociation[],
    options: AssociationQueryOptions
  ): AssociationQueryResult {
    const total = associations.length
    const limit = options.limit || total
    const offset = options.offset || 0

    const paginatedAssociations = associations.slice(offset, offset + limit)

    // 计算统计信息
    const byModule: Record<AssociationModule, number> = {
      notes: 0,
      tasks: 0,
      mindmap: 0,
      graph: 0
    }

    const byType: Record<FileAssociationType, number> = {
      attachment: 0,
      reference: 0,
      embed: 0,
      mention: 0,
      dependency: 0
    }

    let totalStrength = 0

    associations.forEach(association => {
      byModule[association.module]++
      byType[association.associationType]++
      totalStrength += association.strength
    })

    return {
      associations: paginatedAssociations,
      total,
      hasMore: offset + limit < total,
      stats: {
        byModule,
        byType,
        averageStrength: total > 0 ? totalStrength / total : 0
      }
    }
  }

  /**
   * 查找关联通过ID
   */
  private async findAssociationById(associationId: string): Promise<FileAssociation | null> {
    // 先检查缓存
    for (const associations of this.associationCache.values()) {
      const found = associations.find(a => a.id === associationId)
      if (found) return found
    }

    // 如果缓存中没有，查询数据库
    // 这里应该实现实际的数据库查询
    return null
  }

  /**
   * 查找链接ID通过关联
   */
  private async findLinkIdByAssociation(association: FileAssociation): Promise<string | null> {
    try {
      const links = await this.crossModuleLinkService.getLinksForItem('files', association.fileId)
      const matchingLink = links.outgoing.find(link =>
        link.targetModule === association.module &&
        link.targetId === association.entityId
      )
      return matchingLink?.id || null
    } catch (error) {
      console.error('查找链接ID失败:', error)
      return null
    }
  }

  /**
   * 索引关联到搜索引擎
   */
  private async indexAssociation(association: FileAssociation): Promise<void> {
    if (!this.config.enableIndexing) return

    try {
      const document = {
        id: association.id,
        type: 'file-association',
        fileId: association.fileId,
        module: association.module,
        entityId: association.entityId,
        associationType: association.associationType,
        content: [
          association.metadata.description || '',
          association.metadata.tags.join(' '),
          association.metadata.context || ''
        ].filter(Boolean).join(' '),
        metadata: association.metadata,
        createdAt: association.createdAt,
        updatedAt: association.updatedAt
      }

      await this.searchEngine.addDocument('file-associations', document)
    } catch (error) {
      console.error('索引关联失败:', error)
    }
  }

  /**
   * 从搜索索引中移除关联
   */
  private async removeFromSearchIndex(association: FileAssociation): Promise<void> {
    if (!this.config.enableIndexing) return

    try {
      await this.searchEngine.removeDocument('file-associations', association.id)
    } catch (error) {
      console.error('从搜索索引移除关联失败:', error)
    }
  }

  /**
   * 生成关联建议
   */
  private async generateSuggestions(
    file: FileEntity,
    options: {
      targetModules?: AssociationModule[]
      maxSuggestions?: number
      minConfidence?: number
    }
  ): Promise<AssociationSuggestion[]> {
    const suggestions: AssociationSuggestion[] = []

    // 基于内容相似性的建议
    if (this.config.suggestionConfig.enabledAlgorithms.includes('content-similarity')) {
      const contentSuggestions = await this.generateContentSimilaritySuggestions(file, options)
      suggestions.push(...contentSuggestions)
    }

    // 基于标签匹配的建议
    if (this.config.suggestionConfig.enabledAlgorithms.includes('tag-matching')) {
      const tagSuggestions = await this.generateTagMatchingSuggestions(file, options)
      suggestions.push(...tagSuggestions)
    }

    // 基于时间邻近性的建议
    if (this.config.suggestionConfig.enabledAlgorithms.includes('temporal-proximity')) {
      const temporalSuggestions = await this.generateTemporalProximitySuggestions(file, options)
      suggestions.push(...temporalSuggestions)
    }

    return suggestions
  }

  /**
   * 基于内容相似性生成建议
   */
  private async generateContentSimilaritySuggestions(
    file: FileEntity,
    options: any
  ): Promise<AssociationSuggestion[]> {
    // 实现内容相似性算法
    return []
  }

  /**
   * 基于标签匹配生成建议
   */
  private async generateTagMatchingSuggestions(
    file: FileEntity,
    options: any
  ): Promise<AssociationSuggestion[]> {
    // 实现标签匹配算法
    return []
  }

  /**
   * 基于时间邻近性生成建议
   */
  private async generateTemporalProximitySuggestions(
    file: FileEntity,
    options: any
  ): Promise<AssociationSuggestion[]> {
    // 实现时间邻近性算法
    return []
  }

  /**
   * 删除文件的所有关联
   */
  private async deleteFileAssociations(fileId: string): Promise<void> {
    try {
      const associations = await this.getFileAssociations(fileId)
      await Promise.all(associations.map(a => this.deleteAssociation(a.id)))
    } catch (error) {
      console.error('删除文件关联失败:', error)
    }
  }

  /**
   * 删除实体的所有关联
   */
  private async deleteEntityAssociations(module: AssociationModule, entityId: string): Promise<void> {
    try {
      const associations = await this.getEntityFileAssociations(module, entityId)
      await Promise.all(associations.map(a => this.deleteAssociation(a.id)))
    } catch (error) {
      console.error('删除实体关联失败:', error)
    }
  }

  /**
   * 重新索引文件关联
   */
  private async reindexFileAssociations(fileId: string): Promise<void> {
    if (!this.config.enableIndexing) return

    try {
      const associations = await this.getFileAssociations(fileId)
      await Promise.all(associations.map(a => this.indexAssociation(a)))
    } catch (error) {
      console.error('重新索引文件关联失败:', error)
    }
  }

  /**
   * 获取文件关联数量统计
   */
  private async getFileAssociationCounts(): Promise<Array<{ fileId: string; fileName: string; count: number }>> {
    // 实现文件关联数量统计
    return []
  }

  /**
   * 获取最近活动
   */
  private async getRecentActivity(): Promise<Array<{ date: string; count: number }>> {
    // 实现最近活动统计
    return []
  }

  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(startTime: number): void {
    const duration = performance.now() - startTime
    this.performanceMetrics.averageQueryTime =
      (this.performanceMetrics.averageQueryTime * this.performanceMetrics.totalQueries + duration) /
      (this.performanceMetrics.totalQueries + 1)
  }
}

export default FileAssociationService
