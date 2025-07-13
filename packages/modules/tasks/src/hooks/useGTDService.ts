/**
 * GTD服务Hook
 * 提供GTD工作流相关的状态管理和操作方法
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Task, TaskStatus, GTDProcessResult, GTDReviewResult } from '../types'
import { IGTDService } from '../services'

interface GTDServiceState {
  /** 收集箱任务 */
  inboxTasks: Task[]
  /** 下一步行动 */
  nextActions: Task[]
  /** 等待任务 */
  waitingTasks: Task[]
  /** 将来/也许任务 */
  somedayTasks: Task[]
  /** 加载状态 */
  loading: boolean
  /** 错误信息 */
  error: string | null
  /** 最后回顾结果 */
  lastReview: GTDReviewResult | null
}

interface UseGTDServiceOptions {
  /** 是否自动加载数据 */
  autoLoad?: boolean
  /** 轮询间隔（毫秒） */
  pollInterval?: number
  /** 错误重试次数 */
  retryCount?: number
}

interface UseGTDServiceReturn extends GTDServiceState {
  /** 刷新所有数据 */
  refresh: () => Promise<void>
  /** 快速捕获到收集箱 */
  quickCapture: (input: string, metadata?: Record<string, any>) => Promise<Task>
  /** 处理收集箱任务 */
  processInboxItem: (taskId: string) => Promise<GTDProcessResult>
  /** 执行每日回顾 */
  dailyReview: () => Promise<GTDReviewResult>
  /** 执行每周回顾 */
  weeklyReview: () => Promise<GTDReviewResult>
  /** 获取指定上下文的下一步行动 */
  getNextActionsByContext: (context: string) => Promise<Task[]>
  /** 清除错误 */
  clearError: () => void
}

/**
 * GTD服务Hook
 * 封装GTD工作流的常用操作和状态管理
 */
export const useGTDService = (
  gtdService: IGTDService,
  options: UseGTDServiceOptions = {}
): UseGTDServiceReturn => {
  const {
    autoLoad = true,
    pollInterval = 0,
    retryCount = 3
  } = options

  // 状态管理
  const [state, setState] = useState<GTDServiceState>({
    inboxTasks: [],
    nextActions: [],
    waitingTasks: [],
    somedayTasks: [],
    loading: false,
    error: null,
    lastReview: null
  })

  // 引用
  const retryCountRef = useRef(0)
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * 设置错误状态
   */
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  /**
   * 设置加载状态
   */
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }))
  }, [])

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null)
    retryCountRef.current = 0
  }, [setError])

  /**
   * 加载收集箱任务
   */
  const loadInboxTasks = useCallback(async () => {
    try {
      const tasks = await gtdService.getInboxTasks()
      setState(prev => ({ ...prev, inboxTasks: tasks }))
    } catch (err) {
      console.error('Failed to load inbox tasks:', err)
      throw err
    }
  }, [gtdService])

  /**
   * 加载下一步行动
   */
  const loadNextActions = useCallback(async () => {
    try {
      const tasks = await gtdService.getNextActions()
      setState(prev => ({ ...prev, nextActions: tasks }))
    } catch (err) {
      console.error('Failed to load next actions:', err)
      throw err
    }
  }, [gtdService])

  /**
   * 加载等待任务
   */
  const loadWaitingTasks = useCallback(async () => {
    try {
      // 假设有获取等待任务的方法
      const tasks = await gtdService.getNextActionsByContext('waiting')
      setState(prev => ({ ...prev, waitingTasks: tasks }))
    } catch (err) {
      console.error('Failed to load waiting tasks:', err)
      throw err
    }
  }, [gtdService])

  /**
   * 加载将来/也许任务
   */
  const loadSomedayTasks = useCallback(async () => {
    try {
      // 假设有获取将来/也许任务的方法
      const tasks = await gtdService.getNextActionsByContext('someday')
      setState(prev => ({ ...prev, somedayTasks: tasks }))
    } catch (err) {
      console.error('Failed to load someday tasks:', err)
      throw err
    }
  }, [gtdService])

  /**
   * 刷新所有数据
   */
  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      await Promise.all([
        loadInboxTasks(),
        loadNextActions(),
        loadWaitingTasks(),
        loadSomedayTasks()
      ])

      retryCountRef.current = 0
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刷新数据失败'
      
      // 重试逻辑
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++
        console.warn(`Retrying refresh (${retryCountRef.current}/${retryCount})...`)
        setTimeout(() => refresh(), 1000 * retryCountRef.current)
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [
    loadInboxTasks,
    loadNextActions,
    loadWaitingTasks,
    loadSomedayTasks,
    retryCount,
    setLoading,
    setError
  ])

  /**
   * 快速捕获到收集箱
   */
  const quickCapture = useCallback(async (input: string, metadata?: Record<string, any>) => {
    try {
      setError(null)
      const task = await gtdService.addToInbox(input, metadata)
      
      // 更新本地状态
      setState(prev => ({
        ...prev,
        inboxTasks: [task, ...prev.inboxTasks]
      }))

      return task
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '快速捕获失败'
      setError(errorMessage)
      throw err
    }
  }, [gtdService, setError])

  /**
   * 处理收集箱任务
   */
  const processInboxItem = useCallback(async (taskId: string) => {
    try {
      setError(null)
      const result = await gtdService.processInboxItem(taskId)
      
      // 从收集箱移除已处理的任务
      setState(prev => ({
        ...prev,
        inboxTasks: prev.inboxTasks.filter(task => task.id !== taskId)
      }))

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '处理任务失败'
      setError(errorMessage)
      throw err
    }
  }, [gtdService, setError])

  /**
   * 执行每日回顾
   */
  const dailyReview = useCallback(async () => {
    try {
      setError(null)
      const result = await gtdService.dailyReview()
      setState(prev => ({ ...prev, lastReview: result }))
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '每日回顾失败'
      setError(errorMessage)
      throw err
    }
  }, [gtdService, setError])

  /**
   * 执行每周回顾
   */
  const weeklyReview = useCallback(async () => {
    try {
      setError(null)
      const result = await gtdService.weeklyReview()
      setState(prev => ({ ...prev, lastReview: result }))
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '每周回顾失败'
      setError(errorMessage)
      throw err
    }
  }, [gtdService, setError])

  /**
   * 获取指定上下文的下一步行动
   */
  const getNextActionsByContext = useCallback(async (context: string) => {
    try {
      setError(null)
      return await gtdService.getNextActionsByContext(context)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取上下文任务失败'
      setError(errorMessage)
      throw err
    }
  }, [gtdService, setError])

  // 自动加载数据
  useEffect(() => {
    if (autoLoad) {
      refresh()
    }
  }, [autoLoad, refresh])

  // 轮询数据
  useEffect(() => {
    if (pollInterval > 0) {
      pollTimerRef.current = setInterval(refresh, pollInterval)
      return () => {
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current)
        }
      }
    }
  }, [pollInterval, refresh])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
      }
    }
  }, [])

  return {
    ...state,
    refresh,
    quickCapture,
    processInboxItem,
    dailyReview,
    weeklyReview,
    getNextActionsByContext,
    clearError
  }
}

export default useGTDService
