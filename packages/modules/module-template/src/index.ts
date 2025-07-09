/**
 * 模块模板主入口
 * 统一导出所有模块功能
 */

// 核心模块类
export { BaseModule, ExampleModule } from './ModuleTemplate'

// 类型定义
export * from './types'

// 服务层
export * from './services'

// React Hooks
export * from './hooks'

// 重新导出核心接口，方便使用
export type {
  IModule,
  IModuleConfig,
  IModuleMetadata,
  IModuleFactory,
  ModuleStatus,
  IRouteConfig,
  IMenuItem,
  IModuleEvent
} from './types/module'

export type {
  ModuleEvent,
  EventHandler,
  IEventEmitter
} from './types/events'

export type {
  IApiResponse,
  IApiClient,
  IPaginationParams,
  IPaginatedResponse
} from './types/api'

export type {
  IBaseEntity,
  IServiceConfig,
  IExampleEntity
} from './services/ModuleService'

export type {
  IDataState,
  IDataActions,
  IUseModuleDataConfig
} from './hooks/useModuleData'

export type {
  IPersistConfig
} from './hooks/useModuleState'

// 导出核心类
export {
  BaseService,
  ExampleService
} from './services/ModuleService'

export {
  useModuleData,
  useModuleState,
  useBooleanState,
  useArrayState,
  useObjectState,
  useAsyncState
} from './hooks'
