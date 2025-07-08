/**
 * 模块状态管理 Hook
 */

import { useState, useCallback, useEffect, useRef } from 'react'

/**
 * 状态持久化配置
 */
export interface IPersistConfig {
  key: string
  storage?: 'localStorage' | 'sessionStorage'
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
}

/**
 * 状态管理 Hook
 */
export function useModuleState<T>(
  initialState: T,
  persistConfig?: IPersistConfig
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const mountedRef = useRef(true)

  // 从持久化存储中恢复状态
  const getPersistedState = useCallback((): T => {
    if (!persistConfig || typeof window === 'undefined') {
      return initialState
    }

    try {
      const storage = persistConfig.storage === 'sessionStorage' 
        ? window.sessionStorage 
        : window.localStorage
      
      const stored = storage.getItem(persistConfig.key)
      if (stored) {
        const deserialize = persistConfig.deserialize || JSON.parse
        return deserialize(stored)
      }
    } catch (error) {
      console.warn('Failed to restore persisted state:', error)
    }

    return initialState
  }, [initialState, persistConfig])

  const [state, setState] = useState<T>(getPersistedState)

  // 持久化状态
  const persistState = useCallback((value: T) => {
    if (!persistConfig || typeof window === 'undefined') {
      return
    }

    try {
      const storage = persistConfig.storage === 'sessionStorage' 
        ? window.sessionStorage 
        : window.localStorage
      
      const serialize = persistConfig.serialize || JSON.stringify
      storage.setItem(persistConfig.key, serialize(value))
    } catch (error) {
      console.warn('Failed to persist state:', error)
    }
  }, [persistConfig])

  // 安全的状态更新
  const safeSetState = useCallback((value: T | ((prev: T) => T)) => {
    if (!mountedRef.current) return

    setState(prevState => {
      const newState = typeof value === 'function' 
        ? (value as (prev: T) => T)(prevState)
        : value
      
      // 持久化新状态
      persistState(newState)
      
      return newState
    })
  }, [persistState])

  // 重置状态
  const resetState = useCallback(() => {
    safeSetState(initialState)
  }, [initialState, safeSetState])

  // 清理函数
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return [state, safeSetState, resetState]
}

/**
 * 布尔状态管理 Hook
 */
export function useBooleanState(
  initialValue: boolean = false
): [boolean, () => void, () => void, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue)

  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])
  const toggle = useCallback(() => setValue(prev => !prev), [])

  return [value, setTrue, setFalse, toggle, setValue]
}

/**
 * 数组状态管理 Hook
 */
export function useArrayState<T>(
  initialArray: T[] = []
): [
  T[],
  {
    push: (item: T) => void
    pop: () => T | undefined
    shift: () => T | undefined
    unshift: (item: T) => void
    insert: (index: number, item: T) => void
    remove: (index: number) => void
    removeById: (id: string | number, idKey?: keyof T) => void
    update: (index: number, item: T) => void
    updateById: (id: string | number, item: Partial<T>, idKey?: keyof T) => void
    clear: () => void
    set: (array: T[]) => void
    filter: (predicate: (item: T) => boolean) => void
    sort: (compareFn?: (a: T, b: T) => number) => void
  }
] {
  const [array, setArray] = useState<T[]>(initialArray)

  const push = useCallback((item: T) => {
    setArray(prev => [...prev, item])
  }, [])

  const pop = useCallback(() => {
    let poppedItem: T | undefined
    setArray(prev => {
      poppedItem = prev[prev.length - 1]
      return prev.slice(0, -1)
    })
    return poppedItem
  }, [])

  const shift = useCallback(() => {
    let shiftedItem: T | undefined
    setArray(prev => {
      shiftedItem = prev[0]
      return prev.slice(1)
    })
    return shiftedItem
  }, [])

  const unshift = useCallback((item: T) => {
    setArray(prev => [item, ...prev])
  }, [])

  const insert = useCallback((index: number, item: T) => {
    setArray(prev => [
      ...prev.slice(0, index),
      item,
      ...prev.slice(index)
    ])
  }, [])

  const remove = useCallback((index: number) => {
    setArray(prev => prev.filter((_, i) => i !== index))
  }, [])

  const removeById = useCallback((id: string | number, idKey: keyof T = 'id' as keyof T) => {
    setArray(prev => prev.filter(item => item[idKey] !== id))
  }, [])

  const update = useCallback((index: number, item: T) => {
    setArray(prev => prev.map((prevItem, i) => i === index ? item : prevItem))
  }, [])

  const updateById = useCallback((id: string | number, item: Partial<T>, idKey: keyof T = 'id' as keyof T) => {
    setArray(prev => prev.map(prevItem => 
      prevItem[idKey] === id ? { ...prevItem, ...item } : prevItem
    ))
  }, [])

  const clear = useCallback(() => {
    setArray([])
  }, [])

  const set = useCallback((newArray: T[]) => {
    setArray(newArray)
  }, [])

  const filter = useCallback((predicate: (item: T) => boolean) => {
    setArray(prev => prev.filter(predicate))
  }, [])

  const sort = useCallback((compareFn?: (a: T, b: T) => number) => {
    setArray(prev => [...prev].sort(compareFn))
  }, [])

  const actions = {
    push,
    pop,
    shift,
    unshift,
    insert,
    remove,
    removeById,
    update,
    updateById,
    clear,
    set,
    filter,
    sort
  }

  return [array, actions]
}

/**
 * 对象状态管理 Hook
 */
export function useObjectState<T extends Record<string, any>>(
  initialObject: T
): [T, (updates: Partial<T>) => void, (key: keyof T, value: T[keyof T]) => void, () => void] {
  const [object, setObject] = useState<T>(initialObject)

  const updateObject = useCallback((updates: Partial<T>) => {
    setObject(prev => ({ ...prev, ...updates }))
  }, [])

  const updateProperty = useCallback((key: keyof T, value: T[keyof T]) => {
    setObject(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetObject = useCallback(() => {
    setObject(initialObject)
  }, [initialObject])

  return [object, updateObject, updateProperty, resetObject]
}

/**
 * 异步状态管理 Hook
 */
export function useAsyncState<T, E = Error>(
  asyncFunction: () => Promise<T>,
  dependencies: React.DependencyList = []
): {
  data: T | null
  loading: boolean
  error: E | null
  execute: () => Promise<void>
  reset: () => void
} {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<E | null>(null)
  const mountedRef = useRef(true)

  const execute = useCallback(async () => {
    if (!mountedRef.current) return

    setLoading(true)
    setError(null)

    try {
      const result = await asyncFunction()
      if (mountedRef.current) {
        setData(result)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err as E)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [asyncFunction])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    execute()
  }, dependencies)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return { data, loading, error, execute, reset }
}
