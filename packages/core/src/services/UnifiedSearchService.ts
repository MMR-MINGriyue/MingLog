/**
 * 统一搜索服务
 * 提供跨模块的统一搜索功能
 */

import { DataAssociationService, EntityType, UnifiedSearchResult } from './DataAssociationService'
import { CrossModuleEventBus, EventType } from './CrossModuleEventBus'

// 搜索提供者接口
export interface SearchProvider {
  id: string
  moduleId: string
  entityTypes: EntityType[]
  search(query: string, options?: SearchProviderOptions): Promise<UnifiedSearchResult[]>
  getEntity?(entityId: string): Promise<UnifiedSearchResult | null>
  getSuggestions?(query: string, limit?: number): Promise<string[]>
}

// 搜索提供者选项
export interface SearchProviderOptions {
  limit?: number
  offset?: number
  fuzzyMatch?: boolean
  includeContent?: boolean
  filters?: Record<string, any>
}

// 高级搜索选项
export interface AdvancedSearchOptions extends SearchProviderOptions {
  entityTypes?: EntityType[]
  moduleIds?: string[]
  includeAssociations?: boolean
  sortBy?: 'relevance' | 'date' | 'title'
  sortOrder?: 'asc' | 'desc'
  dateRange?: {
    from?: Date
    to?: Date
  }
  associationDepth?: number
}

// 搜索结果聚合
export interface SearchResultAggregation {
  query: string
  totalResults: number
  resultsByType: Record<EntityType, number>
  resultsByModule: Record<string, number>
  searchTime: number
  results: UnifiedSearchResult[]
  suggestions?: string[]
  relatedQueries?: string[]
}

// 搜索索引项
export interface SearchIndexItem {
  id: string
  entityType: EntityType
  moduleId: string
  title: string
  content?: string
  keywords: string[]
  metadata?: Record<string, any>
  lastUpdated: Date
}

/**
 * 统一搜索服务实现
 */
export class UnifiedSearchService {
  private providers: Map<string, SearchProvider> = new Map()
  private searchIndex: Map<string, SearchIndexItem> = new Map()
  private queryHistory: string[] = []
  private popularQueries: Map<string, number> = new Map()
  private maxHistorySize: number = 100

  constructor(
    private dataAssociationService: DataAssociationService,
    private eventBus: CrossModuleEventBus
  ) {
    this.setupEventListeners()
  }

  /**
   * 注册搜索提供者
   */
  registerProvider(provider: SearchProvider): void {
    this.providers.set(provider.id, provider)
    console.log(`搜索提供者已注册: ${provider.id} (模块: ${provider.moduleId})`)
  }

  /**
   * 注销搜索提供者
   */
  unregisterProvider(providerId: string): void {
    this.providers.delete(providerId)
    console.log(`搜索提供者已注销: ${providerId}`)
  }

  /**
   * 基础搜索
   */
  async search(
    query: string,
    options?: AdvancedSearchOptions
  ): Promise<SearchResultAggregation> {
    const startTime = performance.now()
    
    // 记录查询历史
    this.recordQuery(query)

    // 获取相关提供者
    const relevantProviders = this.getRelevantProviders(options)
    
    // 并行搜索
    const searchPromises = relevantProviders.map(async provider => {
      try {
        const providerOptions: SearchProviderOptions = {
          limit: options?.limit,
          offset: options?.offset,
          fuzzyMatch: options?.fuzzyMatch,
          includeContent: options?.includeContent,
          filters: options?.filters
        }
        
        const results = await provider.search(query, providerOptions)
        return results.map(result => ({
          ...result,
          metadata: {
            ...result.metadata,
            providerId: provider.id,
            moduleId: provider.moduleId
          }
        }))
      } catch (error) {
        console.error(`搜索提供者 ${provider.id} 搜索失败:`, error)
        return []
      }
    })

    const allResults = (await Promise.all(searchPromises)).flat()

    // 合并和去重
    const uniqueResults = this.deduplicateResults(allResults)

    // 添加关联信息
    if (options?.includeAssociations) {
      await this.addAssociationInfo(uniqueResults, options.associationDepth)
    }

    // 排序
    const sortedResults = this.sortResults(uniqueResults, options)

    // 分页
    const paginatedResults = this.paginateResults(sortedResults, options)

    // 生成统计信息
    const endTime = performance.now()
    const searchTime = endTime - startTime

    const aggregation: SearchResultAggregation = {
      query,
      totalResults: uniqueResults.length,
      resultsByType: this.aggregateByType(uniqueResults),
      resultsByModule: this.aggregateByModule(uniqueResults),
      searchTime,
      results: paginatedResults,
      suggestions: await this.getSuggestions(query),
      relatedQueries: this.getRelatedQueries(query)
    }

    // 发布搜索事件
    await this.eventBus.publishEvent(EventType.SEARCH_RESULT, 'unified-search', aggregation)

    return aggregation
  }

  /**
   * 智能搜索（包含语义理解）
   */
  async smartSearch(
    query: string,
    options?: AdvancedSearchOptions
  ): Promise<SearchResultAggregation> {
    // 预处理查询
    const processedQuery = this.preprocessQuery(query)
    
    // 提取关键词
    const keywords = this.extractKeywords(processedQuery)
    
    // 扩展查询（同义词、相关词）
    const expandedQueries = await this.expandQuery(processedQuery, keywords)
    
    // 执行多个查询并合并结果
    const searchPromises = [processedQuery, ...expandedQueries].map(q =>
      this.search(q, { ...options, limit: Math.ceil((options?.limit || 20) / (expandedQueries.length + 1)) })
    )
    
    const searchResults = await Promise.all(searchPromises)
    
    // 合并结果并重新评分
    const mergedResults = this.mergeSearchResults(searchResults, query)
    
    return mergedResults
  }

  /**
   * 实时搜索建议
   */
  async getSearchSuggestions(
    partialQuery: string,
    limit: number = 10
  ): Promise<string[]> {
    const suggestions = new Set<string>()
    
    // 从查询历史获取建议
    const historySuggestions = this.queryHistory
      .filter(q => q.toLowerCase().includes(partialQuery.toLowerCase()))
      .slice(0, limit / 2)
    
    historySuggestions.forEach(s => suggestions.add(s))
    
    // 从热门查询获取建议
    const popularSuggestions = Array.from(this.popularQueries.entries())
      .filter(([query]) => query.toLowerCase().includes(partialQuery.toLowerCase()))
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit / 2)
      .map(([query]) => query)
    
    popularSuggestions.forEach(s => suggestions.add(s))
    
    // 从搜索提供者获取建议
    const providerSuggestions = await Promise.all(
      Array.from(this.providers.values()).map(async provider => {
        if (provider.getSuggestions) {
          try {
            return await provider.getSuggestions(partialQuery, 3)
          } catch (error) {
            console.error(`获取建议失败 (提供者: ${provider.id}):`, error)
            return []
          }
        }
        return []
      })
    )
    
    providerSuggestions.flat().forEach(s => suggestions.add(s))
    
    return Array.from(suggestions).slice(0, limit)
  }

  /**
   * 按实体ID搜索
   */
  async searchByEntity(
    entityType: EntityType,
    entityId: string,
    options?: AdvancedSearchOptions
  ): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = []
    
    // 从相关提供者获取实体
    for (const provider of this.providers.values()) {
      if (provider.entityTypes.includes(entityType) && provider.getEntity) {
        try {
          const entity = await provider.getEntity(entityId)
          if (entity) {
            results.push({
              ...entity,
              metadata: {
                ...entity.metadata,
                providerId: provider.id,
                moduleId: provider.moduleId
              }
            })
          }
        } catch (error) {
          console.error(`获取实体失败 (提供者: ${provider.id}):`, error)
        }
      }
    }
    
    // 添加关联信息
    if (options?.includeAssociations) {
      await this.addAssociationInfo(results, options.associationDepth)
    }
    
    return results
  }

  /**
   * 获取搜索统计
   */
  getSearchStatistics(): {
    totalQueries: number
    uniqueQueries: number
    popularQueries: Array<{ query: string, count: number }>
    providerCount: number
    indexSize: number
  } {
    const popularQueries = Array.from(this.popularQueries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }))
    
    return {
      totalQueries: this.queryHistory.length,
      uniqueQueries: this.popularQueries.size,
      popularQueries,
      providerCount: this.providers.size,
      indexSize: this.searchIndex.size
    }
  }

  /**
   * 清理搜索历史
   */
  clearSearchHistory(): void {
    this.queryHistory = []
    this.popularQueries.clear()
    console.log('搜索历史已清理')
  }

  /**
   * 重建搜索索引
   */
  async rebuildSearchIndex(): Promise<void> {
    this.searchIndex.clear()
    
    // 从所有提供者重建索引
    for (const provider of this.providers.values()) {
      try {
        // 这里需要提供者支持批量获取所有实体
        // 简化实现，实际中需要更复杂的索引重建逻辑
        console.log(`重建索引: ${provider.id}`)
      } catch (error) {
        console.error(`重建索引失败 (提供者: ${provider.id}):`, error)
      }
    }
    
    console.log('搜索索引重建完成')
  }

  // 私有方法

  private setupEventListeners(): void {
    // 监听数据变更事件，更新搜索索引
    this.eventBus.registerListener({
      id: 'unified-search-indexer',
      moduleId: 'unified-search',
      eventTypes: [
        EventType.NOTE_CREATED,
        EventType.NOTE_UPDATED,
        EventType.NOTE_DELETED,
        EventType.TASK_CREATED,
        EventType.TASK_UPDATED,
        EventType.TASK_DELETED,
        EventType.MINDMAP_NODE_ADDED,
        EventType.MINDMAP_NODE_UPDATED,
        EventType.MINDMAP_NODE_DELETED,
        EventType.GRAPH_NODE_ADDED,
        EventType.GRAPH_NODE_UPDATED,
        EventType.GRAPH_NODE_DELETED
      ],
      handler: async (event) => {
        await this.handleDataChangeEvent(event)
      }
    })
  }

  private async handleDataChangeEvent(event: any): Promise<void> {
    // 根据事件类型更新搜索索引
    const { type, entityId, entityType, data } = event
    
    if (type.includes('deleted')) {
      this.searchIndex.delete(`${entityType}:${entityId}`)
    } else if (type.includes('created') || type.includes('updated')) {
      // 更新索引项
      if (data && entityId && entityType) {
        const indexItem: SearchIndexItem = {
          id: entityId,
          entityType: entityType as EntityType,
          moduleId: event.moduleId,
          title: data.title || data.text || entityId,
          content: data.content || data.description,
          keywords: this.extractKeywords(data.title || data.text || ''),
          metadata: data.metadata,
          lastUpdated: new Date()
        }
        
        this.searchIndex.set(`${entityType}:${entityId}`, indexItem)
      }
    }
  }

  private getRelevantProviders(options?: AdvancedSearchOptions): SearchProvider[] {
    let providers = Array.from(this.providers.values())
    
    if (options?.moduleIds) {
      providers = providers.filter(p => options.moduleIds!.includes(p.moduleId))
    }
    
    if (options?.entityTypes) {
      providers = providers.filter(p => 
        p.entityTypes.some(type => options.entityTypes!.includes(type))
      )
    }
    
    return providers
  }

  private deduplicateResults(results: UnifiedSearchResult[]): UnifiedSearchResult[] {
    const seen = new Set<string>()
    return results.filter(result => {
      const key = `${result.type}:${result.id}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  private async addAssociationInfo(
    results: UnifiedSearchResult[],
    maxDepth: number = 1
  ): Promise<void> {
    for (const result of results) {
      try {
        result.associations = await this.dataAssociationService.getEntityAssociations(
          result.type,
          result.id,
          { maxDepth }
        )
      } catch (error) {
        console.error(`获取关联信息失败 (实体: ${result.type}:${result.id}):`, error)
      }
    }
  }

  private sortResults(
    results: UnifiedSearchResult[],
    options?: AdvancedSearchOptions
  ): UnifiedSearchResult[] {
    const sortBy = options?.sortBy || 'relevance'
    const sortOrder = options?.sortOrder || 'desc'
    
    return results.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'relevance':
          comparison = a.score - b.score
          break
        case 'date':
          const aDate = new Date(a.metadata?.updatedAt || a.metadata?.createdAt || 0)
          const bDate = new Date(b.metadata?.updatedAt || b.metadata?.createdAt || 0)
          comparison = aDate.getTime() - bDate.getTime()
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })
  }

  private paginateResults(
    results: UnifiedSearchResult[],
    options?: AdvancedSearchOptions
  ): UnifiedSearchResult[] {
    const offset = options?.offset || 0
    const limit = options?.limit || 20
    
    return results.slice(offset, offset + limit)
  }

  private aggregateByType(results: UnifiedSearchResult[]): Record<EntityType, number> {
    const aggregation: Record<EntityType, number> = {} as any
    
    Object.values(EntityType).forEach(type => {
      aggregation[type] = 0
    })
    
    results.forEach(result => {
      aggregation[result.type]++
    })
    
    return aggregation
  }

  private aggregateByModule(results: UnifiedSearchResult[]): Record<string, number> {
    const aggregation: Record<string, number> = {}
    
    results.forEach(result => {
      const moduleId = result.metadata?.moduleId || 'unknown'
      aggregation[moduleId] = (aggregation[moduleId] || 0) + 1
    })
    
    return aggregation
  }

  private recordQuery(query: string): void {
    this.queryHistory.push(query)
    this.popularQueries.set(query, (this.popularQueries.get(query) || 0) + 1)
    
    // 限制历史记录大小
    if (this.queryHistory.length > this.maxHistorySize) {
      this.queryHistory = this.queryHistory.slice(-this.maxHistorySize)
    }
  }

  private async getSuggestions(query: string): Promise<string[]> {
    return this.getSearchSuggestions(query, 5)
  }

  private getRelatedQueries(query: string): string[] {
    // 简单的相关查询实现
    const keywords = this.extractKeywords(query)
    const related = new Set<string>()
    
    this.queryHistory.forEach(historyQuery => {
      const historyKeywords = this.extractKeywords(historyQuery)
      const commonKeywords = keywords.filter(k => historyKeywords.includes(k))
      
      if (commonKeywords.length > 0 && historyQuery !== query) {
        related.add(historyQuery)
      }
    })
    
    return Array.from(related).slice(0, 3)
  }

  private preprocessQuery(query: string): string {
    return query.trim().toLowerCase()
  }

  private extractKeywords(text: string): string[] {
    // 简单的关键词提取
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word))
  }

  private async expandQuery(query: string, keywords: string[]): Promise<string[]> {
    // 简单的查询扩展实现
    // 实际应用中可以使用同义词词典或语义模型
    const expanded: string[] = []
    
    // 添加部分关键词组合
    if (keywords.length > 1) {
      for (let i = 0; i < keywords.length - 1; i++) {
        expanded.push(`${keywords[i]} ${keywords[i + 1]}`)
      }
    }
    
    return expanded.slice(0, 2) // 限制扩展查询数量
  }

  private mergeSearchResults(
    searchResults: SearchResultAggregation[],
    originalQuery: string
  ): SearchResultAggregation {
    const allResults = searchResults.flatMap(sr => sr.results)
    const uniqueResults = this.deduplicateResults(allResults)
    
    // 重新计算相关性评分
    uniqueResults.forEach(result => {
      const queryKeywords = this.extractKeywords(originalQuery)
      const titleKeywords = this.extractKeywords(result.title)
      const contentKeywords = this.extractKeywords(result.content || '')
      
      let score = 0
      queryKeywords.forEach(keyword => {
        if (titleKeywords.includes(keyword)) score += 1.0
        if (contentKeywords.includes(keyword)) score += 0.5
      })
      
      result.score = score
    })
    
    // 按新评分排序
    uniqueResults.sort((a, b) => b.score - a.score)
    
    return {
      query: originalQuery,
      totalResults: uniqueResults.length,
      resultsByType: this.aggregateByType(uniqueResults),
      resultsByModule: this.aggregateByModule(uniqueResults),
      searchTime: searchResults.reduce((sum, sr) => sum + sr.searchTime, 0),
      results: uniqueResults,
      suggestions: searchResults[0]?.suggestions,
      relatedQueries: searchResults[0]?.relatedQueries
    }
  }
}

export default UnifiedSearchService
