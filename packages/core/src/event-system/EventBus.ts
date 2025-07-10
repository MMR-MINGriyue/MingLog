/**
 * 事件总线系统
 * 负责模块间的事件通信和消息传递
 * 支持事件过滤、防抖、节流、重放等高级功能
 */

import { EventEmitter } from 'eventemitter3'
import { v4 as uuidv4 } from 'uuid'
import { ModuleEvent, ModuleEventType } from '../types/index.js'

export interface EventBusOptions {
  maxHistorySize?: number
  debugMode?: boolean
  enableMetrics?: boolean
  defaultTimeout?: number
}

export interface EventFilter {
  type?: string | RegExp
  source?: string | RegExp
  target?: string | RegExp
  predicate?: (event: ModuleEvent) => boolean
}

export interface EventMetrics {
  totalEvents: number
  eventsByType: Record<string, number>
  eventsBySource: Record<string, number>
  averageProcessingTime: number
  errorRate: number
}

export class EventBus {
  private emitter: EventEmitter
  private eventHistory: ModuleEvent[] = []
  private maxHistorySize: number = 1000
  private debugMode: boolean = false
  private enableMetrics: boolean = false
  private defaultTimeout: number = 5000
  private metrics: EventMetrics
  private debouncedHandlers: Map<string, NodeJS.Timeout> = new Map()
  private throttledHandlers: Map<string, { lastCall: number; timeout?: NodeJS.Timeout }> = new Map()

  constructor(options: EventBusOptions = {}) {
    this.emitter = new EventEmitter()
    this.maxHistorySize = options.maxHistorySize ?? 1000
    this.debugMode = options.debugMode ?? false
    this.enableMetrics = options.enableMetrics ?? false
    this.defaultTimeout = options.defaultTimeout ?? 5000

    this.metrics = {
      totalEvents: 0,
      eventsByType: {},
      eventsBySource: {},
      averageProcessingTime: 0,
      errorRate: 0
    }
  }

  /**
   * 发送事件
   */
  emit(type: string, data?: any, source: string = 'system', target?: string): void {
    const startTime = performance.now()

    const event: ModuleEvent = {
      id: uuidv4(),
      type,
      source,
      target,
      data,
      timestamp: Date.now()
    }

    try {
      // 记录事件历史
      this.addToHistory(event)

      // 更新指标
      if (this.enableMetrics) {
        this.updateMetrics(event, startTime)
      }

      // 调试模式下打印事件
      if (this.debugMode) {
        console.log('[EventBus] Emitting event:', event)
      }

      // 发送事件
      this.emitter.emit(type, event)

      // 如果有目标，也发送到目标特定的频道
      if (target) {
        this.emitter.emit(`${type}:${target}`, event)
      }

      // 发送到通用事件频道
      this.emitter.emit('*', event)

    } catch (error) {
      if (this.enableMetrics) {
        this.metrics.errorRate++
      }
      console.error('[EventBus] Error emitting event:', error)
      throw error
    }
  }

  /**
   * 异步发送事件
   */
  async emitAsync(type: string, data?: any, source: string = 'system', target?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.emit(type, data, source, target)
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 批量发送事件
   */
  emitBatch(events: Array<{ type: string; data?: any; source?: string; target?: string }>): void {
    for (const eventData of events) {
      this.emit(
        eventData.type,
        eventData.data,
        eventData.source || 'system',
        eventData.target
      )
    }
  }

  /**
   * 监听事件
   */
  on(type: string, handler: (event: ModuleEvent) => void): void {
    this.emitter.on(type, handler)
  }

  /**
   * 监听一次性事件
   */
  once(type: string, handler: (event: ModuleEvent) => void): void {
    this.emitter.once(type, handler)
  }

  /**
   * 取消监听事件
   */
  off(type: string, handler: (event: ModuleEvent) => void): void {
    this.emitter.off(type, handler)
  }

  /**
   * 防抖监听事件
   */
  onDebounced(
    type: string,
    handler: (event: ModuleEvent) => void,
    delay: number = 300
  ): void {
    const debouncedHandler = (event: ModuleEvent) => {
      const key = `${type}:${handler.toString()}`

      // 清除之前的定时器
      if (this.debouncedHandlers.has(key)) {
        clearTimeout(this.debouncedHandlers.get(key)!)
      }

      // 设置新的定时器
      const timeoutId = setTimeout(() => {
        handler(event)
        this.debouncedHandlers.delete(key)
      }, delay)

      this.debouncedHandlers.set(key, timeoutId)
    }

    this.emitter.on(type, debouncedHandler)
  }

  /**
   * 节流监听事件
   */
  onThrottled(
    type: string,
    handler: (event: ModuleEvent) => void,
    delay: number = 300
  ): void {
    const throttledHandler = (event: ModuleEvent) => {
      const key = `${type}:${handler.toString()}`
      const now = Date.now()

      if (!this.throttledHandlers.has(key)) {
        this.throttledHandlers.set(key, { lastCall: 0 })
      }

      const throttleData = this.throttledHandlers.get(key)!

      if (now - throttleData.lastCall >= delay) {
        handler(event)
        throttleData.lastCall = now
      } else if (!throttleData.timeout) {
        // 设置延迟执行
        throttleData.timeout = setTimeout(() => {
          handler(event)
          throttleData.lastCall = Date.now()
          throttleData.timeout = undefined
        }, delay - (now - throttleData.lastCall))
      }
    }

    this.emitter.on(type, throttledHandler)
  }

  /**
   * 条件监听事件
   */
  onWhen(
    type: string,
    condition: (event: ModuleEvent) => boolean,
    handler: (event: ModuleEvent) => void
  ): void {
    const conditionalHandler = (event: ModuleEvent) => {
      if (condition(event)) {
        handler(event)
      }
    }

    this.emitter.on(type, conditionalHandler)
  }

  /**
   * 监听所有事件
   */
  onAll(handler: (event: ModuleEvent) => void): void {
    this.emitter.on('*', handler)
  }

  /**
   * 取消监听所有事件
   */
  offAll(handler: (event: ModuleEvent) => void): void {
    this.emitter.off('*', handler)
  }

  /**
   * 监听特定模块的事件
   */
  onModuleEvent(moduleId: string, type: string, handler: (event: ModuleEvent) => void): void {
    this.emitter.on(`${type}:${moduleId}`, handler)
  }

  /**
   * 取消监听特定模块的事件
   */
  offModuleEvent(moduleId: string, type: string, handler: (event: ModuleEvent) => void): void {
    this.emitter.off(`${type}:${moduleId}`, handler)
  }

  /**
   * 等待特定事件
   */
  waitFor(type: string, timeout?: number): Promise<ModuleEvent> {
    return new Promise((resolve, reject) => {
      const timeoutMs = timeout || this.defaultTimeout
      let timeoutId: NodeJS.Timeout | undefined

      const handler = (event: ModuleEvent) => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        this.emitter.off(type, handler)
        resolve(event)
      }

      this.emitter.on(type, handler)

      if (timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          this.emitter.off(type, handler)
          reject(new Error(`Event ${type} timeout after ${timeoutMs}ms`))
        }, timeoutMs)
      }
    })
  }

  /**
   * 等待多个事件
   */
  waitForAll(types: string[], timeout?: number): Promise<ModuleEvent[]> {
    const promises = types.map(type => this.waitFor(type, timeout))
    return Promise.all(promises)
  }

  /**
   * 等待任意一个事件
   */
  waitForAny(types: string[], timeout?: number): Promise<ModuleEvent> {
    const promises = types.map(type => this.waitFor(type, timeout))
    return Promise.race(promises)
  }

  /**
   * 创建事件过滤器
   */
  filter(filter: EventFilter): EventBus {
    const filteredBus = new EventBus({
      maxHistorySize: this.maxHistorySize,
      debugMode: this.debugMode,
      enableMetrics: this.enableMetrics
    })

    this.onAll((event) => {
      if (this.matchesFilter(event, filter)) {
        filteredBus.emit(event.type, event.data, event.source, event.target)
      }
    })

    return filteredBus
  }

  /**
   * 检查事件是否匹配过滤器
   */
  private matchesFilter(event: ModuleEvent, filter: EventFilter): boolean {
    if (filter.type) {
      if (typeof filter.type === 'string') {
        if (event.type !== filter.type) return false
      } else if (filter.type instanceof RegExp) {
        if (!filter.type.test(event.type)) return false
      }
    }

    if (filter.source) {
      if (typeof filter.source === 'string') {
        if (event.source !== filter.source) return false
      } else if (filter.source instanceof RegExp) {
        if (!filter.source.test(event.source)) return false
      }
    }

    if (filter.target) {
      if (typeof filter.target === 'string') {
        if (event.target !== filter.target) return false
      } else if (filter.target instanceof RegExp) {
        if (event.target && !filter.target.test(event.target)) return false
      }
    }

    if (filter.predicate) {
      if (!filter.predicate(event)) return false
    }

    return true
  }

  /**
   * 重放事件历史
   */
  replay(filter?: EventFilter, delay: number = 0): void {
    const events = filter ?
      this.eventHistory.filter(event => this.matchesFilter(event, filter)) :
      this.eventHistory

    events.forEach((event, index) => {
      setTimeout(() => {
        this.emit(event.type, event.data, event.source, event.target)
      }, delay * index)
    })
  }

  /**
   * 获取事件历史
   */
  getEventHistory(filter?: {
    type?: string
    source?: string
    target?: string
    since?: number
    limit?: number
  }): ModuleEvent[] {
    let events = this.eventHistory

    if (filter) {
      events = events.filter(event => {
        if (filter.type && event.type !== filter.type) return false
        if (filter.source && event.source !== filter.source) return false
        if (filter.target && event.target !== filter.target) return false
        if (filter.since && event.timestamp < filter.since) return false
        return true
      })

      if (filter.limit) {
        events = events.slice(-filter.limit)
      }
    }

    return events
  }

  /**
   * 清空事件历史
   */
  clearHistory(): void {
    this.eventHistory = []
  }

  /**
   * 获取监听器数量
   */
  getListenerCount(type?: string): number {
    if (type) {
      return this.emitter.listenerCount(type)
    }
    return this.emitter.eventNames().reduce((count, eventName) => {
      return count + this.emitter.listenerCount(eventName as string)
    }, 0)
  }

  /**
   * 获取所有事件类型
   */
  getEventTypes(): string[] {
    return this.emitter.eventNames() as string[]
  }

  /**
   * 设置调试模式
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
  }

  /**
   * 更新指标
   */
  private updateMetrics(event: ModuleEvent, startTime: number): void {
    if (!this.enableMetrics) return

    this.metrics.totalEvents++

    // 按类型统计
    this.metrics.eventsByType[event.type] = (this.metrics.eventsByType[event.type] || 0) + 1

    // 按来源统计
    this.metrics.eventsBySource[event.source] = (this.metrics.eventsBySource[event.source] || 0) + 1

    // 处理时间
    const processingTime = performance.now() - startTime
    this.metrics.averageProcessingTime =
      (this.metrics.averageProcessingTime + processingTime) / 2
  }

  /**
   * 获取事件指标
   */
  getMetrics(): EventMetrics {
    return { ...this.metrics }
  }

  /**
   * 重置指标
   */
  resetMetrics(): void {
    this.metrics = {
      totalEvents: 0,
      eventsByType: {},
      eventsBySource: {},
      averageProcessingTime: 0,
      errorRate: 0
    }
  }

  /**
   * 设置指标收集
   */
  setMetricsEnabled(enabled: boolean): void {
    this.enableMetrics = enabled
    if (!enabled) {
      this.resetMetrics()
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    // 清理防抖定时器
    for (const timeoutId of this.debouncedHandlers.values()) {
      clearTimeout(timeoutId)
    }
    this.debouncedHandlers.clear()

    // 清理节流定时器
    for (const throttleData of this.throttledHandlers.values()) {
      if (throttleData.timeout) {
        clearTimeout(throttleData.timeout)
      }
    }
    this.throttledHandlers.clear()
  }

  /**
   * 销毁事件总线
   */
  destroy(): void {
    this.cleanup()
    this.emitter.removeAllListeners()
    this.eventHistory = []
    this.resetMetrics()
  }

  /**
   * 添加事件到历史记录
   */
  private addToHistory(event: ModuleEvent): void {
    this.eventHistory.push(event)
    
    // 保持历史记录大小限制
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize)
    }
  }
}

// 预定义的事件类型常量
export const CORE_EVENTS = {
  // 模块生命周期事件
  MODULE_REGISTERED: 'module:registered',
  MODULE_LOADED: ModuleEventType.MODULE_LOADED,
  MODULE_ACTIVATED: ModuleEventType.MODULE_ACTIVATED,
  MODULE_DEACTIVATED: ModuleEventType.MODULE_DEACTIVATED,
  MODULE_UNLOADED: ModuleEventType.MODULE_UNLOADED,
  MODULE_RELOADED: 'module:reloaded',
  MODULE_REMOVED: 'module:removed',
  MODULE_ERROR: 'module:error',
  MODULE_RECOVERY_FAILED: 'module:recovery-failed',

  // 模块功能事件
  MODULE_ROUTES_REGISTERED: 'module:routes-registered',
  MODULE_MENU_ITEMS_REGISTERED: 'module:menu-items-registered',
  MODULE_TOOLBAR_ITEMS_REGISTERED: 'module:toolbar-items-registered',
  MODULE_COMMANDS_REGISTERED: 'module:commands-registered',
  MODULE_FEATURES_UNREGISTERED: 'module:features-unregistered',
  MODULE_REGISTER_SETTINGS: 'module:register-settings',

  // 数据事件
  DATA_CREATED: ModuleEventType.DATA_CREATED,
  DATA_UPDATED: ModuleEventType.DATA_UPDATED,
  DATA_DELETED: ModuleEventType.DATA_DELETED,

  // 应用事件
  SEARCH_QUERY: ModuleEventType.SEARCH_QUERY,
  NAVIGATION_REQUEST: ModuleEventType.NAVIGATION_REQUEST,
  SETTINGS_CHANGED: ModuleEventType.SETTINGS_CHANGED,

  // 核心系统事件
  CORE_INITIALIZED: 'core:initialized',
  CORE_ERROR: 'core:error',

  // 通知事件
  NOTIFICATION_SUCCESS: 'notification:success',
  NOTIFICATION_ERROR: 'notification:error',
  NOTIFICATION_WARNING: 'notification:warning',
  NOTIFICATION_INFO: 'notification:info',

  // 路由事件
  ROUTER_NAVIGATE: 'router:navigate',
  ROUTER_ADD_ROUTES: 'router:add-routes',
  ROUTER_REMOVE_ROUTES: 'router:remove-routes'
} as const
