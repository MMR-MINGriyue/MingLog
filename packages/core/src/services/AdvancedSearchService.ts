/**
 * 高级搜索服务
 * 扩展统一搜索服务，提供多条件搜索、搜索条件保存、正则表达式搜索等高级功能
 */

import { UnifiedSearchService, SearchProvider, AdvancedSearchOptions, SearchResultAggregation } from './UnifiedSearchService'
import { DataAssociationService, EntityType, UnifiedSearchResult } from './DataAssociationService'
import { CrossModuleEventBus, EventType } from './CrossModuleEventBus'

// 搜索条件类型
export enum SearchConditionType {
  TEXT = 'text',                    // 文本搜索
  REGEX = 'regex',                  // 正则表达式
  EXACT = 'exact',                  // 精确匹配
  FUZZY = 'fuzzy',                  // 模糊匹配
  DATE_RANGE = 'date_range',        // 日期范围
  ENTITY_TYPE = 'entity_type',      // 实体类型
  TAG = 'tag',                      // 标签
  PROPERTY = 'property',            // 属性
  ASSOCIATION = 'association'       // 关联
}

// 搜索操作符
export enum SearchOperator {
  AND = 'and',
  OR = 'or',
  NOT = 'not'
}

// 搜索条件接口
export interface SearchCondition {
  id: string
  type: SearchConditionType
  operator: SearchOperator
  field?: string                    // 搜索字段
  value: any                        // 搜索值
  options?: Record<string, any>     // 额外选项
  enabled: boolean                  // 是否启用
}

// 搜索条件组
export interface SearchConditionGroup {
  id: string
  name: string
  operator: SearchOperator
  conditions: (SearchCondition | SearchConditionGroup)[]
  enabled: boolean
}

// 保存的搜索查询
export interface SavedSearchQuery {
  id: string
  name: string
  description?: string
  query: SearchConditionGroup
  options: AdvancedSearchOptions
  createdAt: Date
  updatedAt: Date
  lastUsed?: Date
  useCount: number
  tags: string[]
  isPublic: boolean
  createdBy?: string
}

// 搜索模板
export interface SearchTemplate {
  id: string
  name: string
  description: string
  category: string
  template: SearchConditionGroup
  defaultOptions: AdvancedSearchOptions
  variables?: Array<{
    name: string
    type: string
    description: string
    defaultValue?: any
  }>
  isBuiltIn: boolean
}

// 搜索建议类型
export interface SearchSuggestion {
  type: 'query' | 'field' | 'value' | 'template'
  text: string
  description?: string
  score: number
  metadata?: Record<string, any>
}

/**
 * 高级搜索服务实现
 */
export class AdvancedSearchService extends UnifiedSearchService {
  private savedQueries: Map<string, SavedSearchQuery> = new Map()
  private searchTemplates: Map<string, SearchTemplate> = new Map()
  private searchSessions: Map<string, SearchSession> = new Map()

  constructor(
    dataAssociationService: DataAssociationService,
    eventBus: CrossModuleEventBus
  ) {
    super(dataAssociationService, eventBus)
    this.initializeBuiltInTemplates()
  }

  /**
   * 多条件搜索
   */
  async advancedSearch(
    conditionGroup: SearchConditionGroup,
    options?: AdvancedSearchOptions
  ): Promise<SearchResultAggregation> {
    const startTime = performance.now()

    // 构建搜索查询
    const searchQuery = this.buildSearchQuery(conditionGroup)
    
    // 构建搜索选项
    const searchOptions = this.buildSearchOptions(conditionGroup, options)

    // 执行搜索
    let results: UnifiedSearchResult[] = []

    if (conditionGroup.conditions.length === 0) {
      // 空条件，返回空结果
      results = []
    } else {
      // 递归处理条件组
      results = await this.processConditionGroup(conditionGroup, searchOptions)
    }

    // 应用全局过滤和排序
    const filteredResults = this.applyGlobalFilters(results, options)
    const sortedResults = this.sortResults(filteredResults, options)
    const paginatedResults = this.paginateResults(sortedResults, options)

    // 生成统计信息
    const endTime = performance.now()
    const searchTime = endTime - startTime

    const aggregation: SearchResultAggregation = {
      query: this.serializeConditionGroup(conditionGroup),
      totalResults: filteredResults.length,
      resultsByType: this.aggregateByType(filteredResults),
      resultsByModule: this.aggregateByModule(filteredResults),
      searchTime,
      results: paginatedResults,
      suggestions: await this.getAdvancedSuggestions(conditionGroup),
      relatedQueries: this.getRelatedQueries(this.serializeConditionGroup(conditionGroup))
    }

    // 发布搜索事件
    await this.eventBus.publishEvent(EventType.SEARCH_RESULT, 'advanced-search', {
      ...aggregation,
      conditionGroup
    })

    return aggregation
  }

  /**
   * 正则表达式搜索
   */
  async regexSearch(
    pattern: string,
    fields: string[] = ['title', 'content'],
    options?: AdvancedSearchOptions
  ): Promise<SearchResultAggregation> {
    try {
      // 验证正则表达式
      new RegExp(pattern)
    } catch (error) {
      throw new Error(`无效的正则表达式: ${pattern}`)
    }

    const condition: SearchCondition = {
      id: this.generateId(),
      type: SearchConditionType.REGEX,
      operator: SearchOperator.AND,
      field: fields.join(','),
      value: pattern,
      enabled: true
    }

    const conditionGroup: SearchConditionGroup = {
      id: this.generateId(),
      name: 'Regex Search',
      operator: SearchOperator.AND,
      conditions: [condition],
      enabled: true
    }

    return this.advancedSearch(conditionGroup, options)
  }

  /**
   * 保存搜索查询
   */
  async saveSearchQuery(
    name: string,
    conditionGroup: SearchConditionGroup,
    options: AdvancedSearchOptions,
    metadata?: {
      description?: string
      tags?: string[]
      isPublic?: boolean
    }
  ): Promise<SavedSearchQuery> {
    const savedQuery: SavedSearchQuery = {
      id: this.generateId(),
      name,
      description: metadata?.description,
      query: conditionGroup,
      options,
      createdAt: new Date(),
      updatedAt: new Date(),
      useCount: 0,
      tags: metadata?.tags || [],
      isPublic: metadata?.isPublic || false
    }

    this.savedQueries.set(savedQuery.id, savedQuery)

    // 发布事件
    await this.eventBus.publishEvent(EventType.SEARCH_QUERY, 'advanced-search', {
      action: 'saved',
      query: savedQuery
    })

    return savedQuery
  }

  /**
   * 获取保存的搜索查询
   */
  getSavedSearchQueries(
    filter?: {
      tags?: string[]
      isPublic?: boolean
      createdBy?: string
    }
  ): SavedSearchQuery[] {
    let queries = Array.from(this.savedQueries.values())

    if (filter) {
      if (filter.tags) {
        queries = queries.filter(q => 
          filter.tags!.some(tag => q.tags.includes(tag))
        )
      }
      if (filter.isPublic !== undefined) {
        queries = queries.filter(q => q.isPublic === filter.isPublic)
      }
      if (filter.createdBy) {
        queries = queries.filter(q => q.createdBy === filter.createdBy)
      }
    }

    return queries.sort((a, b) => b.lastUsed?.getTime() || 0 - (a.lastUsed?.getTime() || 0))
  }

  /**
   * 执行保存的搜索查询
   */
  async executeSavedQuery(
    queryId: string,
    optionOverrides?: Partial<AdvancedSearchOptions>
  ): Promise<SearchResultAggregation> {
    const savedQuery = this.savedQueries.get(queryId)
    if (!savedQuery) {
      throw new Error(`保存的搜索查询不存在: ${queryId}`)
    }

    // 更新使用统计
    savedQuery.lastUsed = new Date()
    savedQuery.useCount++
    this.savedQueries.set(queryId, savedQuery)

    // 合并选项
    const options = { ...savedQuery.options, ...optionOverrides }

    return this.advancedSearch(savedQuery.query, options)
  }

  /**
   * 删除保存的搜索查询
   */
  async deleteSavedQuery(queryId: string): Promise<boolean> {
    const deleted = this.savedQueries.delete(queryId)
    
    if (deleted) {
      await this.eventBus.publishEvent(EventType.SEARCH_QUERY, 'advanced-search', {
        action: 'deleted',
        queryId
      })
    }

    return deleted
  }

  /**
   * 获取搜索模板
   */
  getSearchTemplates(category?: string): SearchTemplate[] {
    let templates = Array.from(this.searchTemplates.values())
    
    if (category) {
      templates = templates.filter(t => t.category === category)
    }

    return templates.sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * 从模板创建搜索
   */
  createSearchFromTemplate(
    templateId: string,
    variables?: Record<string, any>
  ): SearchConditionGroup {
    const template = this.searchTemplates.get(templateId)
    if (!template) {
      throw new Error(`搜索模板不存在: ${templateId}`)
    }

    // 克隆模板并替换变量
    const conditionGroup = this.cloneConditionGroup(template.template)
    
    if (variables && template.variables) {
      this.replaceVariables(conditionGroup, variables)
    }

    return conditionGroup
  }

  /**
   * 获取高级搜索建议
   */
  async getAdvancedSuggestions(
    conditionGroup: SearchConditionGroup,
    context?: string
  ): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = []

    // 基于当前条件的建议
    for (const condition of conditionGroup.conditions) {
      if (this.isSearchCondition(condition)) {
        suggestions.push(...await this.getConditionSuggestions(condition))
      }
    }

    // 模板建议
    const templateSuggestions = this.getTemplateSuggestions(conditionGroup)
    suggestions.push(...templateSuggestions)

    // 历史查询建议
    const historySuggestions = this.getHistorySuggestions(conditionGroup)
    suggestions.push(...historySuggestions)

    // 按评分排序并去重
    return this.deduplicateSuggestions(suggestions)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  }

  /**
   * 创建搜索会话
   */
  createSearchSession(): string {
    const sessionId = this.generateId()
    const session: SearchSession = {
      id: sessionId,
      createdAt: new Date(),
      queries: [],
      currentQuery: null,
      filters: {},
      options: {}
    }
    
    this.searchSessions.set(sessionId, session)
    return sessionId
  }

  /**
   * 获取搜索性能统计
   */
  getSearchPerformanceStats(): {
    averageSearchTime: number
    totalSearches: number
    popularConditionTypes: Array<{ type: SearchConditionType, count: number }>
    templateUsage: Array<{ templateId: string, count: number }>
  } {
    // 这里需要实现性能统计逻辑
    // 简化实现
    return {
      averageSearchTime: 0,
      totalSearches: 0,
      popularConditionTypes: [],
      templateUsage: []
    }
  }

  // 私有方法

  private async processConditionGroup(
    group: SearchConditionGroup,
    options: AdvancedSearchOptions
  ): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[][] = []

    for (const item of group.conditions) {
      if (!item.enabled) continue

      if (this.isSearchCondition(item)) {
        const conditionResults = await this.processSearchCondition(item, options)
        results.push(conditionResults)
      } else {
        const groupResults = await this.processConditionGroup(item, options)
        results.push(groupResults)
      }
    }

    // 根据操作符合并结果
    return this.combineResults(results, group.operator)
  }

  private async processSearchCondition(
    condition: SearchCondition,
    options: AdvancedSearchOptions
  ): Promise<UnifiedSearchResult[]> {
    switch (condition.type) {
      case SearchConditionType.TEXT:
        return this.processTextCondition(condition, options)
      case SearchConditionType.REGEX:
        return this.processRegexCondition(condition, options)
      case SearchConditionType.EXACT:
        return this.processExactCondition(condition, options)
      case SearchConditionType.FUZZY:
        return this.processFuzzyCondition(condition, options)
      case SearchConditionType.DATE_RANGE:
        return this.processDateRangeCondition(condition, options)
      case SearchConditionType.ENTITY_TYPE:
        return this.processEntityTypeCondition(condition, options)
      case SearchConditionType.TAG:
        return this.processTagCondition(condition, options)
      case SearchConditionType.PROPERTY:
        return this.processPropertyCondition(condition, options)
      case SearchConditionType.ASSOCIATION:
        return this.processAssociationCondition(condition, options)
      default:
        return []
    }
  }

  private async processTextCondition(
    condition: SearchCondition,
    options: AdvancedSearchOptions
  ): Promise<UnifiedSearchResult[]> {
    // 直接使用 dataAssociationService 进行搜索
    const searchResults = await this.dataAssociationService.unifiedSearch({
      query: condition.value,
      entityTypes: options.entityTypes,
      fuzzyMatch: condition.options?.fuzzyMatch || false,
      limit: options.pagination?.pageSize || 50
    })

    // 结果已经是 UnifiedSearchResult 格式
    return searchResults
  }

  private async processRegexCondition(
    condition: SearchCondition,
    options: AdvancedSearchOptions
  ): Promise<UnifiedSearchResult[]> {
    // 实现正则表达式搜索逻辑
    const regex = new RegExp(condition.value, condition.options?.flags || 'i')
    const fields = condition.field?.split(',') || ['title', 'content']

    // 从 dataAssociationService 获取所有结果
    const allResults = await this.dataAssociationService.unifiedSearch({
      query: '',
      entityTypes: options.entityTypes,
      limit: 10000
    })

    // 过滤匹配的结果
    return allResults.filter(result => {
      return fields.some(field => {
        const value = this.getFieldValue(result, field)
        return value && regex.test(value)
      })
    })
  }

  private combineResults(
    resultSets: UnifiedSearchResult[][],
    operator: SearchOperator
  ): UnifiedSearchResult[] {
    if (resultSets.length === 0) return []
    if (resultSets.length === 1) return resultSets[0]

    let combined = resultSets[0]

    for (let i = 1; i < resultSets.length; i++) {
      const current = resultSets[i]
      
      switch (operator) {
        case SearchOperator.AND:
          combined = this.intersectResults(combined, current)
          break
        case SearchOperator.OR:
          combined = this.unionResults(combined, current)
          break
        case SearchOperator.NOT:
          combined = this.subtractResults(combined, current)
          break
      }
    }

    return combined
  }

  private intersectResults(
    a: UnifiedSearchResult[],
    b: UnifiedSearchResult[]
  ): UnifiedSearchResult[] {
    const bIds = new Set(b.map(r => `${r.type}:${r.id}`))
    return a.filter(result => bIds.has(`${result.type}:${result.id}`))
  }

  private unionResults(
    a: UnifiedSearchResult[],
    b: UnifiedSearchResult[]
  ): UnifiedSearchResult[] {
    const seen = new Set<string>()
    const combined: UnifiedSearchResult[] = []

    for (const result of [...a, ...b]) {
      const key = `${result.type}:${result.id}`
      if (!seen.has(key)) {
        seen.add(key)
        combined.push(result)
      }
    }

    return combined
  }

  private subtractResults(
    a: UnifiedSearchResult[],
    b: UnifiedSearchResult[]
  ): UnifiedSearchResult[] {
    const bIds = new Set(b.map(r => `${r.type}:${r.id}`))
    return a.filter(result => !bIds.has(`${result.type}:${result.id}`))
  }

  private buildSearchQuery(group: SearchConditionGroup): string {
    // 构建可读的搜索查询字符串
    return this.serializeConditionGroup(group)
  }

  private buildSearchOptions(
    group: SearchConditionGroup,
    options?: AdvancedSearchOptions
  ): AdvancedSearchOptions {
    // 从条件组中提取搜索选项
    const extractedOptions: AdvancedSearchOptions = {}

    // 提取实体类型
    const entityTypeConditions = this.findConditionsByType(group, SearchConditionType.ENTITY_TYPE)
    if (entityTypeConditions.length > 0) {
      extractedOptions.entityTypes = entityTypeConditions.map(c => c.value as EntityType)
    }

    // 提取日期范围
    const dateRangeConditions = this.findConditionsByType(group, SearchConditionType.DATE_RANGE)
    if (dateRangeConditions.length > 0) {
      const dateCondition = dateRangeConditions[0]
      extractedOptions.dateRange = dateCondition.value
    }

    return { ...extractedOptions, ...options }
  }

  private findConditionsByType(
    group: SearchConditionGroup,
    type: SearchConditionType
  ): SearchCondition[] {
    const conditions: SearchCondition[] = []

    for (const item of group.conditions) {
      if (this.isSearchCondition(item) && item.type === type) {
        conditions.push(item)
      } else if (!this.isSearchCondition(item)) {
        conditions.push(...this.findConditionsByType(item, type))
      }
    }

    return conditions
  }

  private isSearchCondition(item: SearchCondition | SearchConditionGroup): item is SearchCondition {
    return 'type' in item
  }

  private serializeConditionGroup(group: SearchConditionGroup): string {
    // 将条件组序列化为字符串
    const parts: string[] = []

    for (const item of group.conditions) {
      if (!item.enabled) continue

      if (this.isSearchCondition(item)) {
        parts.push(this.serializeCondition(item))
      } else {
        parts.push(`(${this.serializeConditionGroup(item)})`)
      }
    }

    return parts.join(` ${group.operator.toUpperCase()} `)
  }

  private serializeCondition(condition: SearchCondition): string {
    switch (condition.type) {
      case SearchConditionType.TEXT:
        return condition.value
      case SearchConditionType.REGEX:
        return `/${condition.value}/`
      case SearchConditionType.EXACT:
        return `"${condition.value}"`
      case SearchConditionType.TAG:
        return `#${condition.value}`
      case SearchConditionType.ENTITY_TYPE:
        return `type:${condition.value}`
      default:
        return condition.value
    }
  }

  private initializeBuiltInTemplates(): void {
    // 初始化内置搜索模板
    const templates: SearchTemplate[] = [
      {
        id: 'recent-notes',
        name: '最近的笔记',
        description: '搜索最近创建或修改的笔记',
        category: '常用',
        template: {
          id: 'template-recent-notes',
          name: 'Recent Notes',
          operator: SearchOperator.AND,
          conditions: [
            {
              id: 'entity-type',
              type: SearchConditionType.ENTITY_TYPE,
              operator: SearchOperator.AND,
              value: EntityType.NOTE,
              enabled: true
            },
            {
              id: 'date-range',
              type: SearchConditionType.DATE_RANGE,
              operator: SearchOperator.AND,
              field: 'updatedAt',
              value: {
                from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前
                to: new Date()
              },
              enabled: true
            }
          ],
          enabled: true
        },
        defaultOptions: {
          sortBy: 'date',
          sortOrder: 'desc',
          limit: 20
        },
        isBuiltIn: true
      }
    ]

    templates.forEach(template => {
      this.searchTemplates.set(template.id, template)
    })
  }

  private cloneConditionGroup(group: SearchConditionGroup): SearchConditionGroup {
    return JSON.parse(JSON.stringify(group))
  }

  private replaceVariables(group: SearchConditionGroup, variables: Record<string, any>): void {
    // 递归替换变量
    for (const item of group.conditions) {
      if (this.isSearchCondition(item)) {
        if (typeof item.value === 'string') {
          item.value = this.replaceVariableInString(item.value, variables)
        }
      } else {
        this.replaceVariables(item, variables)
      }
    }
  }

  private replaceVariableInString(str: string, variables: Record<string, any>): string {
    return str.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? variables[varName] : match
    })
  }

  private async getConditionSuggestions(condition: SearchCondition): Promise<SearchSuggestion[]> {
    // 基于条件类型生成建议
    const suggestions: SearchSuggestion[] = []

    switch (condition.type) {
      case SearchConditionType.TEXT:
        // 基于历史查询的建议
        suggestions.push(...this.getTextSuggestions(condition.value))
        break
      case SearchConditionType.TAG:
        // 基于现有标签的建议
        suggestions.push(...await this.getTagSuggestions())
        break
    }

    return suggestions
  }

  private getTextSuggestions(text: string): SearchSuggestion[] {
    // 简化实现
    return []
  }

  private async getTagSuggestions(): Promise<SearchSuggestion[]> {
    // 简化实现
    return []
  }

  private getTemplateSuggestions(group: SearchConditionGroup): SearchSuggestion[] {
    // 基于当前条件推荐相关模板
    return []
  }

  private getHistorySuggestions(group: SearchConditionGroup): SearchSuggestion[] {
    // 基于历史查询推荐
    return []
  }

  private deduplicateSuggestions(suggestions: SearchSuggestion[]): SearchSuggestion[] {
    const seen = new Set<string>()
    return suggestions.filter(suggestion => {
      const key = `${suggestion.type}:${suggestion.text}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  private getFieldValue(result: UnifiedSearchResult, field: string): string | undefined {
    switch (field) {
      case 'title':
        return result.title
      case 'content':
        return result.content
      default:
        return result.metadata?.[field]
    }
  }

  private generateId(): string {
    return `adv_search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 应用全局过滤器
   */
  private applyGlobalFilters(results: UnifiedSearchResult[], options?: AdvancedSearchOptions): UnifiedSearchResult[] {
    if (!options) {
      return results
    }

    let filteredResults = [...results]

    // 应用实体类型过滤
    if (options.entityTypes && options.entityTypes.length > 0) {
      filteredResults = filteredResults.filter(result =>
        options.entityTypes!.includes(result.entityType)
      )
    }

    // 应用日期范围过滤
    if (options.dateRange) {
      filteredResults = filteredResults.filter(result => {
        if (!result.lastModified) return false
        const date = new Date(result.lastModified)
        return date >= options.dateRange!.start && date <= options.dateRange!.end
      })
    }

    // 应用评分过滤
    if (options.minScore !== undefined) {
      filteredResults = filteredResults.filter(result =>
        result.score >= options.minScore!
      )
    }

    return filteredResults
  }

  /**
   * 排序搜索结果
   */
  private sortResults(results: UnifiedSearchResult[], options?: AdvancedSearchOptions): UnifiedSearchResult[] {
    if (!options || !options.sortBy) {
      return results
    }

    return [...results].sort((a, b) => {
      let comparison = 0

      switch (options.sortBy) {
        case 'relevance':
          comparison = b.score - a.score
          break
        case 'date':
          const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0
          const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0
          comparison = dateB - dateA
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'type':
          comparison = a.entityType.localeCompare(b.entityType)
          break
        default:
          comparison = 0
      }

      return options.sortOrder === 'desc' ? comparison : -comparison
    })
  }

  /**
   * 分页搜索结果
   */
  private paginateResults(results: UnifiedSearchResult[], options?: AdvancedSearchOptions): UnifiedSearchResult[] {
    if (!options || !options.pagination) {
      return results
    }

    const { page, pageSize } = options.pagination
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize

    return results.slice(startIndex, endIndex)
  }

  // 其他条件处理方法的简化实现
  private async processExactCondition(condition: SearchCondition, options: AdvancedSearchOptions): Promise<UnifiedSearchResult[]> { return [] }
  private async processFuzzyCondition(condition: SearchCondition, options: AdvancedSearchOptions): Promise<UnifiedSearchResult[]> { return [] }
  private async processDateRangeCondition(condition: SearchCondition, options: AdvancedSearchOptions): Promise<UnifiedSearchResult[]> { return [] }
  private async processEntityTypeCondition(condition: SearchCondition, options: AdvancedSearchOptions): Promise<UnifiedSearchResult[]> { return [] }
  private async processTagCondition(condition: SearchCondition, options: AdvancedSearchOptions): Promise<UnifiedSearchResult[]> { return [] }
  private async processPropertyCondition(condition: SearchCondition, options: AdvancedSearchOptions): Promise<UnifiedSearchResult[]> { return [] }
  private async processAssociationCondition(condition: SearchCondition, options: AdvancedSearchOptions): Promise<UnifiedSearchResult[]> { return [] }
}

// 搜索会话接口
interface SearchSession {
  id: string
  createdAt: Date
  queries: SearchConditionGroup[]
  currentQuery: SearchConditionGroup | null
  filters: Record<string, any>
  options: AdvancedSearchOptions
}

export default AdvancedSearchService
