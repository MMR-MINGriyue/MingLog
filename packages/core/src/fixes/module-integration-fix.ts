/**
 * 模块间集成稳定性修复
 * 解决EventBus/ModuleManager集成中的稳定性问题
 */

import { EventBus } from '../event-system/EventBus'
import { ModuleManager } from '../module-manager/ModuleManager'
import type { ModuleEvent } from '../types/index'

export interface IntegrationFixOptions {
  enableMemoryLeakDetection?: boolean
  enableEventValidation?: boolean
  enableErrorRecovery?: boolean
  maxEventQueueSize?: number
  eventTimeoutMs?: number
}

export class ModuleIntegrationFix {
  private eventBus: EventBus
  private moduleManager: ModuleManager
  private options: Required<IntegrationFixOptions>
  private eventQueue: Map<string, ModuleEvent[]> = new Map()
  private eventHandlers: Map<string, Function[]> = new Map()
  private cleanupTasks: Set<() => void> = new Set()

  constructor(
    eventBus: EventBus,
    moduleManager: ModuleManager,
    options: IntegrationFixOptions = {}
  ) {
    this.eventBus = eventBus
    this.moduleManager = moduleManager
    this.options = {
      enableMemoryLeakDetection: true,
      enableEventValidation: true,
      enableErrorRecovery: true,
      maxEventQueueSize: 1000,
      eventTimeoutMs: 5000,
      ...options
    }

    this.setupIntegrationFixes()
  }

  /**
   * 设置集成修复
   */
  private setupIntegrationFixes(): void {
    if (this.options.enableMemoryLeakDetection) {
      this.setupMemoryLeakDetection()
    }

    if (this.options.enableEventValidation) {
      this.setupEventValidation()
    }

    if (this.options.enableErrorRecovery) {
      this.setupErrorRecovery()
    }

    this.setupEventQueueManagement()
    this.setupGracefulShutdown()
  }

  /**
   * 设置内存泄漏检测
   */
  private setupMemoryLeakDetection(): void {
    // 监控事件监听器数量
    const originalOn = this.eventBus.on.bind(this.eventBus)
    const originalOff = this.eventBus.off.bind(this.eventBus)

    this.eventBus.on = (type: string, handler: (event: ModuleEvent) => void) => {
      // 记录事件处理器
      if (!this.eventHandlers.has(type)) {
        this.eventHandlers.set(type, [])
      }
      this.eventHandlers.get(type)!.push(handler)

      // 检查监听器数量
      const handlers = this.eventHandlers.get(type)!
      if (handlers.length > 50) {
        console.warn(`[IntegrationFix] 事件类型 ${type} 的监听器数量过多: ${handlers.length}`)
      }

      return originalOn(type, handler)
    }

    this.eventBus.off = (type: string, handler: (event: ModuleEvent) => void) => {
      // 移除事件处理器记录
      const handlers = this.eventHandlers.get(type)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }

      return originalOff(type, handler)
    }

    // 定期检查内存泄漏
    const memoryCheckInterval = setInterval(() => {
      this.checkMemoryLeaks()
    }, 30000) // 每30秒检查一次

    this.cleanupTasks.add(() => clearInterval(memoryCheckInterval))
  }

  /**
   * 检查内存泄漏
   */
  private checkMemoryLeaks(): void {
    const totalHandlers = Array.from(this.eventHandlers.values())
      .reduce((sum, handlers) => sum + handlers.length, 0)

    if (totalHandlers > 200) {
      console.warn(`[IntegrationFix] 检测到可能的内存泄漏: ${totalHandlers} 个事件监听器`)
      
      // 清理孤立的事件监听器
      this.cleanupOrphanedHandlers()
    }
  }

  /**
   * 清理孤立的事件监听器
   */
  private cleanupOrphanedHandlers(): void {
    const activeModules = this.moduleManager.getActiveModules()
    const activeModuleIds = new Set(activeModules.map(m => m.id))

    // 清理非活动模块的事件监听器
    for (const [eventType, handlers] of this.eventHandlers) {
      if (eventType.includes(':')) {
        const [, moduleId] = eventType.split(':')
        if (moduleId && !activeModuleIds.has(moduleId)) {
          console.log(`[IntegrationFix] 清理非活动模块 ${moduleId} 的事件监听器`)
          handlers.forEach(handler => {
            this.eventBus.off(eventType, handler as (event: ModuleEvent) => void)
          })
          this.eventHandlers.delete(eventType)
        }
      }
    }
  }

  /**
   * 设置事件验证
   */
  private setupEventValidation(): void {
    const originalEmit = this.eventBus.emit.bind(this.eventBus)

    this.eventBus.emit = (type: string, data?: any, source: string = 'system', target?: string) => {
      // 验证事件格式
      if (!this.validateEvent(type, data, source, target)) {
        console.warn(`[IntegrationFix] 无效事件被拒绝: ${type}`)
        return
      }

      // 检查事件队列大小
      if (this.getEventQueueSize() > this.options.maxEventQueueSize) {
        console.warn(`[IntegrationFix] 事件队列已满，丢弃事件: ${type}`)
        return
      }

      try {
        return originalEmit(type, data, source, target)
      } catch (error) {
        console.error(`[IntegrationFix] 事件发送失败: ${type}`, error)
        this.handleEventError(type, error as Error)
      }
    }
  }

  /**
   * 验证事件
   */
  private validateEvent(type: string, data: any, source: string, target?: string): boolean {
    // 基本验证
    if (!type || typeof type !== 'string') {
      return false
    }

    if (!source || typeof source !== 'string') {
      return false
    }

    // 检查事件类型格式
    if (!/^[a-zA-Z][a-zA-Z0-9:_-]*$/.test(type)) {
      return false
    }

    // 检查数据大小（防止过大的事件数据）
    if (data && typeof data === 'object') {
      const dataSize = JSON.stringify(data).length
      if (dataSize > 1024 * 1024) { // 1MB限制
        console.warn(`[IntegrationFix] 事件数据过大: ${dataSize} bytes`)
        return false
      }
    }

    return true
  }

  /**
   * 设置错误恢复
   */
  private setupErrorRecovery(): void {
    // 监听模块错误事件
    this.eventBus.on('module:error', (event) => {
      this.handleModuleError(event.data.moduleId, event.data.error)
    })

    // 监听事件处理错误
    this.eventBus.on('event:error', (event) => {
      this.handleEventError(event.data.eventType, event.data.error)
    })
  }

  /**
   * 处理模块错误
   */
  private async handleModuleError(moduleId: string, error: Error): Promise<void> {
    console.log(`[IntegrationFix] 处理模块错误: ${moduleId}`, error.message)

    try {
      // 尝试重启模块
      const module = this.moduleManager.getModule(moduleId)
      if (module && (module as any).status === 'error') {
        console.log(`[IntegrationFix] 尝试重启模块: ${moduleId}`)
        
        await this.moduleManager.deactivateModule(moduleId, true)
        await new Promise(resolve => setTimeout(resolve, 1000)) // 等待1秒
        await this.moduleManager.activateModule(moduleId)
        
        console.log(`[IntegrationFix] 模块重启成功: ${moduleId}`)
      }
    } catch (recoveryError) {
      console.error(`[IntegrationFix] 模块恢复失败: ${moduleId}`, recoveryError)
    }
  }

  /**
   * 处理事件错误
   */
  private handleEventError(eventType: string, error: Error): void {
    console.log(`[IntegrationFix] 处理事件错误: ${eventType}`, error.message)

    // 将失败的事件加入重试队列
    if (!this.eventQueue.has('retry')) {
      this.eventQueue.set('retry', [])
    }

    const retryQueue = this.eventQueue.get('retry')!
    if (retryQueue.length < 100) { // 限制重试队列大小
      retryQueue.push({
        id: `retry-${Date.now()}`,
        type: eventType,
        source: 'IntegrationFix',
        data: { originalError: error.message },
        timestamp: Date.now()
      })
    }
  }

  /**
   * 设置事件队列管理
   */
  private setupEventQueueManagement(): void {
    // 定期处理重试队列
    const retryInterval = setInterval(() => {
      this.processRetryQueue()
    }, 5000) // 每5秒处理一次

    this.cleanupTasks.add(() => clearInterval(retryInterval))
  }

  /**
   * 处理重试队列
   */
  private processRetryQueue(): void {
    const retryQueue = this.eventQueue.get('retry')
    if (!retryQueue || retryQueue.length === 0) {
      return
    }

    const now = Date.now()
    const eventsToRetry = retryQueue.filter(event => 
      now - event.timestamp > 10000 // 10秒后重试
    )

    eventsToRetry.forEach(event => {
      try {
        this.eventBus.emit(event.type, event.data, event.source)
        
        // 从重试队列中移除
        const index = retryQueue.indexOf(event)
        if (index > -1) {
          retryQueue.splice(index, 1)
        }
      } catch (error) {
        console.warn(`[IntegrationFix] 事件重试失败: ${event.type}`)
      }
    })
  }

  /**
   * 获取事件队列大小
   */
  private getEventQueueSize(): number {
    return Array.from(this.eventQueue.values())
      .reduce((sum, queue) => sum + queue.length, 0)
  }

  /**
   * 设置优雅关闭
   */
  private setupGracefulShutdown(): void {
    const cleanup = () => {
      console.log('[IntegrationFix] 执行清理任务...')
      
      // 执行所有清理任务
      this.cleanupTasks.forEach(task => {
        try {
          task()
        } catch (error) {
          console.warn('[IntegrationFix] 清理任务执行失败:', error)
        }
      })

      // 清理事件监听器
      this.eventHandlers.clear()
      this.eventQueue.clear()
    }

    // 注册清理函数
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', cleanup)
    }

    if (typeof process !== 'undefined') {
      process.on('exit', cleanup)
      process.on('SIGINT', cleanup)
      process.on('SIGTERM', cleanup)
    }
  }

  /**
   * 获取集成状态
   */
  getIntegrationStatus() {
    return {
      eventHandlers: this.eventHandlers.size,
      totalHandlers: Array.from(this.eventHandlers.values())
        .reduce((sum, handlers) => sum + handlers.length, 0),
      eventQueueSize: this.getEventQueueSize(),
      cleanupTasks: this.cleanupTasks.size,
      options: this.options
    }
  }

  /**
   * 手动清理
   */
  cleanup(): void {
    this.cleanupTasks.forEach(task => task())
    this.cleanupTasks.clear()
    this.eventHandlers.clear()
    this.eventQueue.clear()
  }
}
