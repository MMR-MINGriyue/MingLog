/**
 * 模块事件类型定义
 */

/**
 * 基础事件接口
 */
export interface IBaseEvent {
  /** 事件类型 */
  type: string
  /** 事件时间戳 */
  timestamp: number
  /** 事件来源 */
  source: string
  /** 事件ID */
  id?: string
}

/**
 * 模块生命周期事件
 */
export interface IModuleLifecycleEvent extends IBaseEvent {
  type: 'module:initialize' | 'module:activate' | 'module:deactivate' | 'module:destroy'
  data: {
    moduleId: string
    status: string
    error?: Error
  }
}

/**
 * 模块配置变更事件
 */
export interface IModuleConfigEvent extends IBaseEvent {
  type: 'module:config:changed'
  data: {
    moduleId: string
    oldConfig: Record<string, any>
    newConfig: Record<string, any>
    changedKeys: string[]
  }
}

/**
 * 数据变更事件
 */
export interface IDataChangeEvent extends IBaseEvent {
  type: 'data:created' | 'data:updated' | 'data:deleted'
  data: {
    entityType: string
    entityId: string
    entity?: any
    oldEntity?: any
    changes?: Record<string, any>
  }
}

/**
 * 用户交互事件
 */
export interface IUserInteractionEvent extends IBaseEvent {
  type: 'user:click' | 'user:navigate' | 'user:search' | 'user:action'
  data: {
    action: string
    target?: string
    context?: Record<string, any>
    userId?: string
  }
}

/**
 * 系统事件
 */
export interface ISystemEvent extends IBaseEvent {
  type: 'system:startup' | 'system:shutdown' | 'system:error' | 'system:warning'
  data: {
    message: string
    level: 'info' | 'warning' | 'error'
    details?: Record<string, any>
  }
}

/**
 * 通知事件
 */
export interface INotificationEvent extends IBaseEvent {
  type: 'notification:show' | 'notification:hide' | 'notification:clear'
  data: {
    id?: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    duration?: number
    actions?: Array<{
      label: string
      action: () => void
    }>
  }
}

/**
 * 路由事件
 */
export interface IRouteEvent extends IBaseEvent {
  type: 'route:navigate' | 'route:change' | 'route:error'
  data: {
    from?: string
    to: string
    params?: Record<string, any>
    query?: Record<string, any>
    error?: Error
  }
}

/**
 * 主题事件
 */
export interface IThemeEvent extends IBaseEvent {
  type: 'theme:change'
  data: {
    oldTheme: string
    newTheme: string
    source: 'user' | 'system' | 'auto'
  }
}

/**
 * 搜索事件
 */
export interface ISearchEvent extends IBaseEvent {
  type: 'search:query' | 'search:result' | 'search:clear'
  data: {
    query?: string
    results?: any[]
    filters?: Record<string, any>
    resultCount?: number
    duration?: number
  }
}

/**
 * 性能事件
 */
export interface IPerformanceEvent extends IBaseEvent {
  type: 'performance:metric' | 'performance:warning' | 'performance:error'
  data: {
    metric: string
    value: number
    unit: string
    threshold?: number
    context?: Record<string, any>
  }
}

/**
 * 联合事件类型
 */
export type ModuleEvent = 
  | IModuleLifecycleEvent
  | IModuleConfigEvent
  | IDataChangeEvent
  | IUserInteractionEvent
  | ISystemEvent
  | INotificationEvent
  | IRouteEvent
  | IThemeEvent
  | ISearchEvent
  | IPerformanceEvent

/**
 * 事件处理器类型
 */
export type EventHandler<T extends IBaseEvent = ModuleEvent> = (event: T) => void | Promise<void>

/**
 * 事件监听器配置
 */
export interface IEventListenerConfig {
  /** 事件类型 */
  type: string | string[]
  /** 事件处理器 */
  handler: EventHandler
  /** 是否只监听一次 */
  once?: boolean
  /** 优先级 */
  priority?: number
  /** 过滤条件 */
  filter?: (event: ModuleEvent) => boolean
}

/**
 * 事件发射器接口
 */
export interface IEventEmitter {
  /**
   * 监听事件
   */
  on<T extends ModuleEvent>(type: T['type'], handler: EventHandler<T>): void
  
  /**
   * 监听事件（一次性）
   */
  once<T extends ModuleEvent>(type: T['type'], handler: EventHandler<T>): void
  
  /**
   * 移除事件监听器
   */
  off<T extends ModuleEvent>(type: T['type'], handler: EventHandler<T>): void
  
  /**
   * 发射事件
   */
  emit<T extends ModuleEvent>(event: T): void
  
  /**
   * 移除所有监听器
   */
  removeAllListeners(type?: string): void
  
  /**
   * 获取监听器数量
   */
  listenerCount(type: string): number
}
