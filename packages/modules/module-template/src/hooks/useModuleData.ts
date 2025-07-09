/**
 * 模块数据管理 Hook
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { BaseService, IBaseEntity } from '../services'
import { IPaginationParams, IPaginatedResponse } from '../types'

/**
 * 数据状态接口
 */
export interface IDataState<T> {
  data: T[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * 数据操作接口
 */
export interface IDataActions<T> {
  fetch: (params?: IPaginationParams) => Promise<void>
  create: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => Promise<T>
  update: (id: string, data: Partial<T>) => Promise<T>
  delete: (id: string) => Promise<void>
  refresh: () => Promise<void>
  search: (query: string, params?: IPaginationParams) => Promise<void>
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  clearError: () => void
}

/**
 * Hook 配置接口
 */
export interface IUseModuleDataConfig {
  autoFetch?: boolean
  initialPage?: number
  initialPageSize?: number
  debounceDelay?: number
}

/**
 * 模块数据管理 Hook
 */
export function useModuleData<T extends IBaseEntity>(
  service: BaseService<T>,
  config: IUseModuleDataConfig = {}
): [IDataState<T>, IDataActions<T>] {
  const {
    autoFetch = true,
    initialPage = 1,
    initialPageSize = 20,
    debounceDelay = 300
  } = config

  // 状态管理
  const [state, setState] = useState<IDataState<T>>({
    data: [],
    loading: false,
    error: null,
    pagination: {
      page: initialPage,
      pageSize: initialPageSize,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    }
  })

  // 防抖定时器
  const debounceTimer = useRef<NodeJS.Timeout>()
  const mountedRef = useRef(true)

  // 清理函数
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  // 安全的状态更新
  const safeSetState = useCallback((updater: (prev: IDataState<T>) => IDataState<T>) => {
    if (mountedRef.current) {
      setState(updater)
    }
  }, [])

  // 获取数据
  const fetch = useCallback(async (params?: IPaginationParams) => {
    safeSetState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const fetchParams = {
        page: params?.page || state.pagination.page,
        pageSize: params?.pageSize || state.pagination.pageSize,
        ...params
      }

      const response: IPaginatedResponse<T> = await service.getAll(fetchParams)

      safeSetState(prev => ({
        ...prev,
        data: response.items,
        loading: false,
        pagination: {
          page: response.page,
          pageSize: response.pageSize,
          total: response.total,
          totalPages: response.totalPages,
          hasNext: response.hasNext,
          hasPrev: response.hasPrev
        }
      }))
    } catch (error) {
      safeSetState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }, [service, state.pagination.page, state.pagination.pageSize, safeSetState])

  // 创建数据
  const create = useCallback(async (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> => {
    safeSetState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const newItem = await service.create(data)
      
      safeSetState(prev => ({
        ...prev,
        data: [newItem, ...prev.data],
        loading: false,
        pagination: {
          ...prev.pagination,
          total: prev.pagination.total + 1
        }
      }))

      return newItem
    } catch (error) {
      safeSetState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
      throw error
    }
  }, [service, safeSetState])

  // 更新数据
  const update = useCallback(async (id: string, data: Partial<T>): Promise<T> => {
    safeSetState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const updatedItem = await service.update(id, data)
      
      safeSetState(prev => ({
        ...prev,
        data: prev.data.map(item => item.id === id ? updatedItem : item),
        loading: false
      }))

      return updatedItem
    } catch (error) {
      safeSetState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
      throw error
    }
  }, [service, safeSetState])

  // 删除数据
  const deleteItem = useCallback(async (id: string): Promise<void> => {
    safeSetState(prev => ({ ...prev, loading: true, error: null }))

    try {
      await service.delete(id)
      
      safeSetState(prev => ({
        ...prev,
        data: prev.data.filter(item => item.id !== id),
        loading: false,
        pagination: {
          ...prev.pagination,
          total: prev.pagination.total - 1
        }
      }))
    } catch (error) {
      safeSetState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
      throw error
    }
  }, [service, safeSetState])

  // 刷新数据
  const refresh = useCallback(async () => {
    await fetch()
  }, [fetch])

  // 搜索数据
  const search = useCallback(async (query: string, params?: IPaginationParams) => {
    // 防抖处理
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(async () => {
      safeSetState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const searchParams = {
          page: params?.page || 1,
          pageSize: params?.pageSize || state.pagination.pageSize,
          ...params
        }

        const response: IPaginatedResponse<T> = await service.search(query, searchParams)

        safeSetState(prev => ({
          ...prev,
          data: response.items,
          loading: false,
          pagination: {
            page: response.page,
            pageSize: response.pageSize,
            total: response.total,
            totalPages: response.totalPages,
            hasNext: response.hasNext,
            hasPrev: response.hasPrev
          }
        }))
      } catch (error) {
        safeSetState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      }
    }, debounceDelay)
  }, [service, state.pagination.pageSize, debounceDelay, safeSetState])

  // 设置页码
  const setPage = useCallback((page: number) => {
    safeSetState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page }
    }))
  }, [safeSetState])

  // 设置页面大小
  const setPageSize = useCallback((pageSize: number) => {
    safeSetState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, pageSize, page: 1 }
    }))
  }, [safeSetState])

  // 清除错误
  const clearError = useCallback(() => {
    safeSetState(prev => ({ ...prev, error: null }))
  }, [safeSetState])

  // 自动获取数据
  useEffect(() => {
    if (autoFetch) {
      fetch()
    }
  }, [autoFetch, fetch])

  // 页码变化时重新获取数据
  useEffect(() => {
    if (state.pagination.page > 1 || state.pagination.pageSize !== initialPageSize) {
      fetch()
    }
  }, [state.pagination.page, state.pagination.pageSize, fetch, initialPageSize])

  const actions: IDataActions<T> = {
    fetch,
    create,
    update,
    delete: deleteItem,
    refresh,
    search,
    setPage,
    setPageSize,
    clearError
  }

  return [state, actions]
}
