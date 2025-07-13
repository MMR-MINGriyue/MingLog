/**
 * 高级搜索钩子
 * 提供高级搜索功能的状态管理和操作方法
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  AdvancedSearchService,
  SearchCondition,
  SearchConditionGroup,
  SearchConditionType,
  SearchOperator,
  SavedSearchQuery,
  SearchTemplate,
  SearchSuggestion,
  AdvancedSearchOptions
} from '../../packages/core/src/services/AdvancedSearchService'
import { 
  SearchResultAggregation,
  UnifiedSearchResult 
} from '../../packages/core/src/services/UnifiedSearchService'
import { DataAssociationService } from '../../packages/core/src/services/DataAssociationService'
import { CrossModuleEventBus } from '../../packages/core/src/services/CrossModuleEventBus'

interface UseAdvancedSearchReturn {
  /** 高级搜索服务实例 */
  searchService: AdvancedSearchService | null
  /** 是否已初始化 */
  isInitialized: boolean
  /** 初始化错误 */
  error: string | null
  
  // 搜索状态
  /** 当前搜索结果 */
  searchResults: SearchResultAggregation | null
  /** 是否正在搜索 */
  isSearching: boolean
  /** 搜索错误 */
  searchError: string | null
  
  // 保存的查询
  /** 保存的搜索查询列表 */
  savedQueries: SavedSearchQuery[]
  /** 搜索模板列表 */
  searchTemplates: SearchTemplate[]
  
  // 搜索建议
  /** 当前搜索建议 */
  suggestions: SearchSuggestion[]
  /** 是否正在加载建议 */
  isLoadingSuggestions: boolean
  
  // 操作方法
  /** 执行高级搜索 */
  executeAdvancedSearch: (query: SearchConditionGroup, options?: AdvancedSearchOptions) => Promise<SearchResultAggregation>
  /** 执行正则表达式搜索 */
  executeRegexSearch: (pattern: string, fields?: string[], options?: AdvancedSearchOptions) => Promise<SearchResultAggregation>
  /** 保存搜索查询 */
  saveSearchQuery: (name: string, query: SearchConditionGroup, options: AdvancedSearchOptions, metadata?: any) => Promise<SavedSearchQuery>
  /** 执行保存的查询 */
  executeSavedQuery: (queryId: string, optionOverrides?: Partial<AdvancedSearchOptions>) => Promise<SearchResultAggregation>
  /** 删除保存的查询 */
  deleteSavedQuery: (queryId: string) => Promise<boolean>
  /** 从模板创建查询 */
  createQueryFromTemplate: (templateId: string, variables?: Record<string, any>) => SearchConditionGroup
  /** 获取搜索建议 */
  getSearchSuggestions: (query: SearchConditionGroup, context?: string) => Promise<SearchSuggestion[]>
  /** 清除搜索结果 */
  clearSearchResults: () => void
  /** 重新初始化服务 */
  reinitialize: () => Promise<void>
}

/**
 * 高级搜索钩子实现
 */
export const useAdvancedSearch = (): UseAdvancedSearchReturn => {
  // 状态管理
  const [searchService, setSearchService] = useState<AdvancedSearchService | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [searchResults, setSearchResults] = useState<SearchResultAggregation | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  
  const [savedQueries, setSavedQueries] = useState<SavedSearchQuery[]>([])
  const [searchTemplates, setSearchTemplates] = useState<SearchTemplate[]>([])
  
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  // 模拟核心服务（在实际应用中会从核心系统获取）
  const mockDataAssociationService = useMemo(() => {
    return new DataAssociationService({
      events: {
        emit: (event: string, data: any) => {
          console.log('Event emitted:', event, data)
        }
      }
    })
  }, [])

  const mockEventBus = useMemo(() => {
    return new CrossModuleEventBus()
  }, [])

  // 初始化高级搜索服务
  const initializeService = useCallback(async () => {
    try {
      setError(null)
      
      // 创建高级搜索服务实例
      const service = new AdvancedSearchService(
        mockDataAssociationService,
        mockEventBus
      )

      setSearchService(service)
      setIsInitialized(true)

      // 加载保存的查询和模板
      await loadSavedQueries(service)
      await loadSearchTemplates(service)

      console.log('高级搜索服务初始化成功')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '初始化高级搜索服务失败'
      setError(errorMessage)
      console.error('Failed to initialize advanced search service:', err)
    }
  }, [mockDataAssociationService, mockEventBus])

  // 加载保存的查询
  const loadSavedQueries = useCallback(async (service: AdvancedSearchService) => {
    try {
      const queries = service.getSavedSearchQueries()
      setSavedQueries(queries)
    } catch (err) {
      console.error('Failed to load saved queries:', err)
    }
  }, [])

  // 加载搜索模板
  const loadSearchTemplates = useCallback(async (service: AdvancedSearchService) => {
    try {
      const templates = service.getSearchTemplates()
      setSearchTemplates(templates)
    } catch (err) {
      console.error('Failed to load search templates:', err)
    }
  }, [])

  // 重新初始化服务
  const reinitialize = useCallback(async () => {
    setSearchService(null)
    setIsInitialized(false)
    setError(null)
    setSavedQueries([])
    setSearchTemplates([])
    
    await initializeService()
  }, [initializeService])

  // 组件挂载时初始化服务
  useEffect(() => {
    initializeService()
  }, [initializeService])

  // 执行高级搜索
  const executeAdvancedSearch = useCallback(async (
    query: SearchConditionGroup,
    options?: AdvancedSearchOptions
  ): Promise<SearchResultAggregation> => {
    if (!searchService) {
      throw new Error('高级搜索服务未初始化')
    }

    setIsSearching(true)
    setSearchError(null)

    try {
      const results = await searchService.advancedSearch(query, options)
      setSearchResults(results)
      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '搜索失败'
      setSearchError(errorMessage)
      throw err
    } finally {
      setIsSearching(false)
    }
  }, [searchService])

  // 执行正则表达式搜索
  const executeRegexSearch = useCallback(async (
    pattern: string,
    fields?: string[],
    options?: AdvancedSearchOptions
  ): Promise<SearchResultAggregation> => {
    if (!searchService) {
      throw new Error('高级搜索服务未初始化')
    }

    setIsSearching(true)
    setSearchError(null)

    try {
      const results = await searchService.regexSearch(pattern, fields, options)
      setSearchResults(results)
      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '正则表达式搜索失败'
      setSearchError(errorMessage)
      throw err
    } finally {
      setIsSearching(false)
    }
  }, [searchService])

  // 保存搜索查询
  const saveSearchQuery = useCallback(async (
    name: string,
    query: SearchConditionGroup,
    options: AdvancedSearchOptions,
    metadata?: any
  ): Promise<SavedSearchQuery> => {
    if (!searchService) {
      throw new Error('高级搜索服务未初始化')
    }

    try {
      const savedQuery = await searchService.saveSearchQuery(name, query, options, metadata)
      
      // 更新本地状态
      setSavedQueries(prev => [savedQuery, ...prev])
      
      return savedQuery
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存搜索查询失败'
      throw new Error(errorMessage)
    }
  }, [searchService])

  // 执行保存的查询
  const executeSavedQuery = useCallback(async (
    queryId: string,
    optionOverrides?: Partial<AdvancedSearchOptions>
  ): Promise<SearchResultAggregation> => {
    if (!searchService) {
      throw new Error('高级搜索服务未初始化')
    }

    setIsSearching(true)
    setSearchError(null)

    try {
      const results = await searchService.executeSavedQuery(queryId, optionOverrides)
      setSearchResults(results)
      
      // 更新查询的使用统计
      setSavedQueries(prev => prev.map(query => {
        if (query.id === queryId) {
          return {
            ...query,
            lastUsed: new Date(),
            useCount: query.useCount + 1
          }
        }
        return query
      }))
      
      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '执行保存的查询失败'
      setSearchError(errorMessage)
      throw err
    } finally {
      setIsSearching(false)
    }
  }, [searchService])

  // 删除保存的查询
  const deleteSavedQuery = useCallback(async (queryId: string): Promise<boolean> => {
    if (!searchService) {
      throw new Error('高级搜索服务未初始化')
    }

    try {
      const deleted = await searchService.deleteSavedQuery(queryId)
      
      if (deleted) {
        setSavedQueries(prev => prev.filter(query => query.id !== queryId))
      }
      
      return deleted
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除保存的查询失败'
      throw new Error(errorMessage)
    }
  }, [searchService])

  // 从模板创建查询
  const createQueryFromTemplate = useCallback((
    templateId: string,
    variables?: Record<string, any>
  ): SearchConditionGroup => {
    if (!searchService) {
      throw new Error('高级搜索服务未初始化')
    }

    return searchService.createSearchFromTemplate(templateId, variables)
  }, [searchService])

  // 获取搜索建议
  const getSearchSuggestions = useCallback(async (
    query: SearchConditionGroup,
    context?: string
  ): Promise<SearchSuggestion[]> => {
    if (!searchService) {
      throw new Error('高级搜索服务未初始化')
    }

    setIsLoadingSuggestions(true)

    try {
      const suggestions = await searchService.getAdvancedSuggestions(query, context)
      setSuggestions(suggestions)
      return suggestions
    } catch (err) {
      console.error('Failed to get search suggestions:', err)
      return []
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [searchService])

  // 清除搜索结果
  const clearSearchResults = useCallback(() => {
    setSearchResults(null)
    setSearchError(null)
    setSuggestions([])
  }, [])

  return {
    searchService,
    isInitialized,
    error,
    
    searchResults,
    isSearching,
    searchError,
    
    savedQueries,
    searchTemplates,
    
    suggestions,
    isLoadingSuggestions,
    
    executeAdvancedSearch,
    executeRegexSearch,
    saveSearchQuery,
    executeSavedQuery,
    deleteSavedQuery,
    createQueryFromTemplate,
    getSearchSuggestions,
    clearSearchResults,
    reinitialize
  }
}

export default useAdvancedSearch
