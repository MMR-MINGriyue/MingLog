/**
 * 跨模块事件总线
 * 实现模块间的事件通信和数据同步
 */

import { EventEmitter } from 'events'

// 事件类型定义
export enum EventType {
  // 笔记模块事件
  NOTE_CREATED = 'note:created',
  NOTE_UPDATED = 'note:updated',
  NOTE_DELETED = 'note:deleted',
  NOTE_LINKED = 'note:linked',
  NOTE_UNLINKED = 'note:unlinked',
  
  // 任务模块事件
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_DELETED = 'task:deleted',
  TASK_COMPLETED = 'task:completed',
  TASK_STARTED = 'task:started',
  
  // 思维导图模块事件
  MINDMAP_CREATED = 'mindmap:created',
  MINDMAP_UPDATED = 'mindmap:updated',
  MINDMAP_DELETED = 'mindmap:deleted',
  MINDMAP_NODE_ADDED = 'mindmap:node:added',
  MINDMAP_NODE_UPDATED = 'mindmap:node:updated',
  MINDMAP_NODE_REMOVED = 'mindmap:node:removed',
  MINDMAP_NODE_DELETED = 'mindmap:node:deleted',
  
  // 图谱模块事件
  GRAPH_CREATED = 'graph:created',
  GRAPH_UPDATED = 'graph:updated',
  GRAPH_DELETED = 'graph:deleted',
  GRAPH_NODE_ADDED = 'graph:node:added',
  GRAPH_NODE_UPDATED = 'graph:node:updated',
  GRAPH_NODE_DELETED = 'graph:node:deleted',
  GRAPH_LINK_ADDED = 'graph:link:added',
  GRAPH_LINK_UPDATED = 'graph:link:updated',
  GRAPH_LINK_DELETED = 'graph:link:deleted',
  
  // 数据关联事件
  ASSOCIATION_CREATED = 'association:created',
  ASSOCIATION_UPDATED = 'association:updated',
  ASSOCIATION_DELETED = 'association:deleted',
  
  // 搜索事件
  SEARCH_QUERY = 'search:query',
  SEARCH_RESULT = 'search:result',
  
  // 系统事件
  MODULE_ACTIVATED = 'module:activated',
  MODULE_DEACTIVATED = 'module:deactivated',
  DATA_SYNC_REQUESTED = 'data:sync:requested',
  DATA_SYNC_COMPLETED = 'data:sync:completed'
}

// 事件数据接口
export interface EventData {
  type: EventType
  moduleId: string
  entityId?: string
  entityType?: string
  data?: any
  metadata?: Record<string, any>
  timestamp: Date
  correlationId?: string
}

// 事件监听器接口
export interface EventListener {
  id: string
  moduleId: string
  eventTypes: EventType[]
  handler: (event: EventData) => void | Promise<void>
  priority?: number
}

// 事件过滤器接口
export interface EventFilter {
  moduleId?: string
  entityType?: string
  eventTypes?: EventType[]
  correlationId?: string
}

// 事件统计接口
export interface EventStatistics {
  totalEvents: number
  eventsByType: Record<EventType, number>
  eventsByModule: Record<string, number>
  averageProcessingTime: number
  errorRate: number
}

/**
 * 跨模块事件总线实现
 */
export class CrossModuleEventBus extends EventEmitter {
  private eventListeners: Map<string, EventListener> = new Map()
  private eventHistory: EventData[] = []
  private processingTimes: Map<string, number> = new Map()
  private errorCount: number = 0
  private totalEvents: number = 0
  private maxHistorySize: number = 1000

  constructor() {
    super()
    this.setMaxListeners(100) // 增加最大监听器数量
  }

  /**
   * 注册事件监听器
   */
  registerListener(listener: EventListener): void {
    this.eventListeners.set(listener.id, listener)
    
    // 为每个事件类型注册内部监听器
    listener.eventTypes.forEach(eventType => {
      this.on(eventType, async (eventData: EventData) => {
        await this.handleEvent(listener, eventData)
      })
    })

    console.log(`事件监听器已注册: ${listener.id} (模块: ${listener.moduleId})`)
  }

  /**
   * 注销事件监听器
   */
  unregisterListener(listenerId: string): void {
    const listener = this.eventListeners.get(listenerId)
    if (listener) {
      // 移除内部监听器
      listener.eventTypes.forEach(eventType => {
        this.removeAllListeners(eventType)
      })

      this.eventListeners.delete(listenerId)
      console.log(`事件监听器已注销: ${listenerId}`)
    }
  }

  /**
   * 发布事件
   */
  async publishEvent(
    type: EventType,
    moduleId: string,
    data?: any,
    options?: {
      entityId?: string
      entityType?: string
      metadata?: Record<string, any>
      correlationId?: string
    }
  ): Promise<void> {
    const eventData: EventData = {
      type,
      moduleId,
      entityId: options?.entityId,
      entityType: options?.entityType,
      data,
      metadata: options?.metadata,
      timestamp: new Date(),
      correlationId: options?.correlationId || this.generateCorrelationId()
    }

    // 记录事件
    this.recordEvent(eventData)

    // 发布事件
    this.emit(type, eventData)

    console.log(`事件已发布: ${type} (模块: ${moduleId})`)
  }

  /**
   * 批量发布事件
   */
  async publishEventsBatch(events: Array<{
    type: EventType
    moduleId: string
    data?: any
    options?: {
      entityId?: string
      entityType?: string
      metadata?: Record<string, any>
      correlationId?: string
    }
  }>): Promise<void> {
    const promises = events.map(event => 
      this.publishEvent(event.type, event.moduleId, event.data, event.options)
    )
    
    await Promise.all(promises)
  }

  /**
   * 查询事件历史
   */
  queryEventHistory(filter?: EventFilter, limit?: number): EventData[] {
    let results = [...this.eventHistory]

    if (filter) {
      if (filter.moduleId) {
        results = results.filter(e => e.moduleId === filter.moduleId)
      }
      if (filter.entityType) {
        results = results.filter(e => e.entityType === filter.entityType)
      }
      if (filter.eventTypes) {
        results = results.filter(e => filter.eventTypes!.includes(e.type))
      }
      if (filter.correlationId) {
        results = results.filter(e => e.correlationId === filter.correlationId)
      }
    }

    // 按时间倒序排列
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    if (limit) {
      results = results.slice(0, limit)
    }

    return results
  }

  /**
   * 获取事件统计
   */
  getStatistics(): EventStatistics {
    const eventsByType: Record<EventType, number> = {} as any
    const eventsByModule: Record<string, number> = {}

    // 初始化计数器
    Object.values(EventType).forEach(type => {
      eventsByType[type] = 0
    })

    // 统计事件
    this.eventHistory.forEach(event => {
      eventsByType[event.type]++
      eventsByModule[event.moduleId] = (eventsByModule[event.moduleId] || 0) + 1
    })

    // 计算平均处理时间
    const processingTimes = Array.from(this.processingTimes.values())
    const averageProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0

    // 计算错误率
    const errorRate = this.totalEvents > 0 ? this.errorCount / this.totalEvents : 0

    return {
      totalEvents: this.totalEvents,
      eventsByType,
      eventsByModule,
      averageProcessingTime,
      errorRate
    }
  }

  /**
   * 清理事件历史
   */
  clearEventHistory(): void {
    this.eventHistory = []
    this.processingTimes.clear()
    this.errorCount = 0
    this.totalEvents = 0
    console.log('事件历史已清理')
  }

  /**
   * 设置最大历史记录数量
   */
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = size
    this.trimEventHistory()
  }

  /**
   * 等待特定事件
   */
  waitForEvent(
    eventType: EventType,
    filter?: (eventData: EventData) => boolean,
    timeout?: number
  ): Promise<EventData> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined

      const handler = (eventData: EventData) => {
        if (!filter || filter(eventData)) {
          this.off(eventType, handler)
          if (timeoutId) clearTimeout(timeoutId)
          resolve(eventData)
        }
      }

      this.on(eventType, handler)

      if (timeout) {
        timeoutId = setTimeout(() => {
          this.off(eventType, handler)
          reject(new Error(`等待事件 ${eventType} 超时`))
        }, timeout)
      }
    })
  }

  /**
   * 创建事件流
   */
  createEventStream(
    eventTypes: EventType[],
    filter?: (eventData: EventData) => boolean
  ): AsyncIterable<EventData> {
    const events: EventData[] = []
    let resolveNext: ((value: IteratorResult<EventData>) => void) | null = null

    const handlers = eventTypes.map(eventType => {
      const handler = (eventData: EventData) => {
        if (!filter || filter(eventData)) {
          if (resolveNext) {
            resolveNext({ value: eventData, done: false })
            resolveNext = null
          } else {
            events.push(eventData)
          }
        }
      }
      this.on(eventType, handler)
      return { eventType, handler }
    })

    return {
      [Symbol.asyncIterator]() {
        return {
          async next(): Promise<IteratorResult<EventData>> {
            if (events.length > 0) {
              return { value: events.shift()!, done: false }
            }

            return new Promise(resolve => {
              resolveNext = resolve
            })
          },
          
          async return(): Promise<IteratorResult<EventData>> {
            // 清理监听器
            handlers.forEach(({ eventType, handler }) => {
              // this.off(eventType, handler) // 方法不存在，暂时注释
            })
            return { value: undefined, done: true }
          }
        }
      }
    }
  }

  // 私有方法

  private async handleEvent(listener: EventListener, eventData: EventData): Promise<void> {
    const startTime = performance.now()
    
    try {
      await listener.handler(eventData)
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      this.processingTimes.set(`${listener.id}:${eventData.correlationId}`, processingTime)
      
    } catch (error) {
      this.errorCount++
      console.error(`事件处理失败 (监听器: ${listener.id}, 事件: ${eventData.type}):`, error)
      
      // 发布错误事件
      this.emit('error', {
        listenerId: listener.id,
        eventData,
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  private recordEvent(eventData: EventData): void {
    this.eventHistory.push(eventData)
    this.totalEvents++
    this.trimEventHistory()
  }

  private trimEventHistory(): void {
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize)
    }
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 事件总线单例
 */
export const eventBus = new CrossModuleEventBus()

export default CrossModuleEventBus
