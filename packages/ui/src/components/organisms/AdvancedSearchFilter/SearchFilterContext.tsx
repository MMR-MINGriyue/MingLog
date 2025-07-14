/**
 * 搜索过滤器上下文
 * 
 * 功能：
 * - 全局搜索状态管理
 * - 搜索历史记录
 * - 过滤器预设管理
 * - 搜索结果缓存
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { 
  AdvancedSearchFilters,
  SearchResult,
  SearchStats,
  SearchHistory,
  FilterPreset,
  SearchFilterState,
  SearchFilterActions,
  SearchFilterContextType,
  DEFAULT_CONTENT_TYPES
} from './types'

// 初始状态
const initialState: SearchFilterState = {
  filters: {
    query: '',
    contentTypes: DEFAULT_CONTENT_TYPES,
    tags: [],
    authors: [],
    dateRange: {},
    sortBy: 'relevance',
    sortOrder: 'desc',
    includeDeleted: false,
    favoritesOnly: false
  },
  results: [],
  groupedResults: [],
  stats: {
    totalCount: 0,
    searchTime: 0,
    typeStats: {},
    dateStats: {},
    suggestions: [],
    hasMore: false
  },
  isSearching: false,
  error: undefined,
  currentPage: 1,
  totalPages: 1,
  selectedResults: [],
  history: [],
  presets: []
}

// Action类型
type SearchFilterAction =
  | { type: 'SET_FILTERS'; payload: Partial<AdvancedSearchFilters> }
  | { type: 'SET_RESULTS'; payload: { results: SearchResult[]; stats: SearchStats } }
  | { type: 'SET_SEARCHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | undefined }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'RESET_TO_DEFAULT' }
  | { type: 'ADD_TO_HISTORY'; payload: SearchHistory }
  | { type: 'SAVE_PRESET'; payload: FilterPreset }
  | { type: 'LOAD_PRESET'; payload: string }
  | { type: 'DELETE_PRESET'; payload: string }
  | { type: 'TOGGLE_RESULT_SELECTION'; payload: string }
  | { type: 'SELECT_ALL_RESULTS' }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'CHANGE_PAGE'; payload: number }

// Reducer
const searchFilterReducer = (state: SearchFilterState, action: SearchFilterAction): SearchFilterState => {
  switch (action.type) {
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      }

    case 'SET_RESULTS':
      return {
        ...state,
        results: action.payload.results,
        stats: action.payload.stats,
        isSearching: false,
        error: undefined
      }

    case 'SET_SEARCHING':
      return {
        ...state,
        isSearching: action.payload
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isSearching: false
      }

    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: initialState.filters,
        results: [],
        stats: initialState.stats,
        selectedResults: []
      }

    case 'RESET_TO_DEFAULT':
      return initialState

    case 'ADD_TO_HISTORY':
      return {
        ...state,
        history: [action.payload, ...state.history.slice(0, 49)] // 保留最近50条
      }

    case 'SAVE_PRESET':
      return {
        ...state,
        presets: [...state.presets, action.payload]
      }

    case 'LOAD_PRESET': {
      const preset = state.presets.find(p => p.id === action.payload)
      if (!preset) return state
      
      return {
        ...state,
        filters: { ...state.filters, ...preset.filters }
      }
    }

    case 'DELETE_PRESET':
      return {
        ...state,
        presets: state.presets.filter(p => p.id !== action.payload)
      }

    case 'TOGGLE_RESULT_SELECTION': {
      const resultId = action.payload
      const isSelected = state.selectedResults.includes(resultId)
      
      return {
        ...state,
        selectedResults: isSelected
          ? state.selectedResults.filter(id => id !== resultId)
          : [...state.selectedResults, resultId]
      }
    }

    case 'SELECT_ALL_RESULTS':
      return {
        ...state,
        selectedResults: state.results.map(r => r.id)
      }

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedResults: []
      }

    case 'CHANGE_PAGE':
      return {
        ...state,
        currentPage: action.payload
      }

    default:
      return state
  }
}

// Context
const SearchFilterContext = createContext<SearchFilterContextType | undefined>(undefined)

// Provider Props
interface SearchFilterProviderProps {
  children: React.ReactNode
  /** 搜索执行函数 */
  onSearch?: (filters: AdvancedSearchFilters) => Promise<{ results: SearchResult[]; stats: SearchStats }>
  /** 本地存储键名 */
  storageKey?: string
  /** 是否启用持久化 */
  enablePersistence?: boolean
}

// Provider组件
export const SearchFilterProvider: React.FC<SearchFilterProviderProps> = ({
  children,
  onSearch,
  storageKey = 'minglog-search-filters',
  enablePersistence = true
}) => {
  const [state, dispatch] = useReducer(searchFilterReducer, initialState)

  // 从本地存储加载状态
  useEffect(() => {
    if (!enablePersistence) return

    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsedState = JSON.parse(saved)
        // 只恢复过滤器、历史记录和预设
        dispatch({ type: 'SET_FILTERS', payload: parsedState.filters || {} })
        if (parsedState.history) {
          parsedState.history.forEach((item: SearchHistory) => {
            dispatch({ type: 'ADD_TO_HISTORY', payload: item })
          })
        }
        if (parsedState.presets) {
          parsedState.presets.forEach((preset: FilterPreset) => {
            dispatch({ type: 'SAVE_PRESET', payload: preset })
          })
        }
      }
    } catch (error) {
      console.warn('Failed to load search filter state from localStorage:', error)
    }
  }, [storageKey, enablePersistence])

  // 保存状态到本地存储
  useEffect(() => {
    if (!enablePersistence) return

    try {
      const stateToSave = {
        filters: state.filters,
        history: state.history,
        presets: state.presets
      }
      localStorage.setItem(storageKey, JSON.stringify(stateToSave))
    } catch (error) {
      console.warn('Failed to save search filter state to localStorage:', error)
    }
  }, [state.filters, state.history, state.presets, storageKey, enablePersistence])

  // Actions
  const updateFilters = useCallback((filters: Partial<AdvancedSearchFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters })
  }, [])

  const performSearch = useCallback(async () => {
    if (!onSearch) return

    dispatch({ type: 'SET_SEARCHING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: undefined })

    try {
      const startTime = Date.now()
      const result = await onSearch(state.filters)
      const searchTime = Date.now() - startTime

      dispatch({ type: 'SET_RESULTS', payload: result })

      // 添加到搜索历史
      const historyItem: SearchHistory = {
        id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        query: state.filters.query,
        filters: state.filters,
        resultCount: result.results.length,
        searchedAt: new Date().toISOString(),
        searchTime
      }
      dispatch({ type: 'ADD_TO_HISTORY', payload: historyItem })

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : '搜索失败' })
    }
  }, [onSearch, state.filters])

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' })
  }, [])

  const resetToDefault = useCallback(() => {
    dispatch({ type: 'RESET_TO_DEFAULT' })
  }, [])

  const savePreset = useCallback((name: string, description?: string) => {
    const preset: FilterPreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      filters: state.filters,
      isSystem: false,
      createdAt: new Date().toISOString(),
      usageCount: 0
    }
    dispatch({ type: 'SAVE_PRESET', payload: preset })
  }, [state.filters])

  const loadPreset = useCallback((presetId: string) => {
    dispatch({ type: 'LOAD_PRESET', payload: presetId })
  }, [])

  const deletePreset = useCallback((presetId: string) => {
    dispatch({ type: 'DELETE_PRESET', payload: presetId })
  }, [])

  const toggleResultSelection = useCallback((resultId: string) => {
    dispatch({ type: 'TOGGLE_RESULT_SELECTION', payload: resultId })
  }, [])

  const selectAllResults = useCallback(() => {
    dispatch({ type: 'SELECT_ALL_RESULTS' })
  }, [])

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' })
  }, [])

  const changePage = useCallback((page: number) => {
    dispatch({ type: 'CHANGE_PAGE', payload: page })
  }, [])

  const exportResults = useCallback(async (format: 'json' | 'csv' | 'pdf') => {
    // 导出功能实现
    const selectedResults = state.selectedResults.length > 0 
      ? state.results.filter(r => state.selectedResults.includes(r.id))
      : state.results

    switch (format) {
      case 'json':
        const jsonData = JSON.stringify(selectedResults, null, 2)
        const jsonBlob = new Blob([jsonData], { type: 'application/json' })
        const jsonUrl = URL.createObjectURL(jsonBlob)
        const jsonLink = document.createElement('a')
        jsonLink.href = jsonUrl
        jsonLink.download = `search-results-${Date.now()}.json`
        jsonLink.click()
        URL.revokeObjectURL(jsonUrl)
        break

      case 'csv':
        const csvHeaders = ['ID', 'Type', 'Title', 'Excerpt', 'Created', 'Modified', 'Score']
        const csvRows = selectedResults.map(result => [
          result.id,
          result.type,
          `"${result.title.replace(/"/g, '""')}"`,
          `"${result.excerpt.replace(/"/g, '""')}"`,
          result.createdAt,
          result.modifiedAt,
          result.score.toString()
        ])
        const csvContent = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n')
        const csvBlob = new Blob([csvContent], { type: 'text/csv' })
        const csvUrl = URL.createObjectURL(csvBlob)
        const csvLink = document.createElement('a')
        csvLink.href = csvUrl
        csvLink.download = `search-results-${Date.now()}.csv`
        csvLink.click()
        URL.revokeObjectURL(csvUrl)
        break

      case 'pdf':
        // PDF导出需要额外的库支持，这里只是示例
        console.log('PDF export not implemented yet')
        break
    }
  }, [state.results, state.selectedResults])

  const contextValue: SearchFilterContextType = {
    ...state,
    updateFilters,
    performSearch,
    clearFilters,
    resetToDefault,
    savePreset,
    loadPreset,
    deletePreset,
    toggleResultSelection,
    selectAllResults,
    clearSelection,
    changePage,
    exportResults
  }

  return (
    <SearchFilterContext.Provider value={contextValue}>
      {children}
    </SearchFilterContext.Provider>
  )
}

// Hook
export const useSearchFilter = (): SearchFilterContextType => {
  const context = useContext(SearchFilterContext)
  if (context === undefined) {
    throw new Error('useSearchFilter must be used within a SearchFilterProvider')
  }
  return context
}

export default SearchFilterContext
