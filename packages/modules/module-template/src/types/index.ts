/**
 * 类型定义统一导出
 */

// 模块相关类型
export * from './module'

// 事件相关类型
export * from './events'

// API 相关类型
export * from './api'

// 重新导出常用类型
export type {
  IModule,
  IModuleConfig,
  IModuleMetadata,
  IModuleFactory,
  IRouteConfig,
  IMenuItem
} from './module'

export {
  ModuleStatus
} from './module'

export type {
  ModuleEvent,
  EventHandler,
  IEventEmitter,
  IModuleLifecycleEvent,
  IDataChangeEvent,
  IUserInteractionEvent
} from './events'

export type {
  IApiResponse,
  IApiClient,
  IPaginationParams,
  IPaginatedResponse,
  ISearchParams,
  IBatchRequest,
  IBatchResponse
} from './api'
