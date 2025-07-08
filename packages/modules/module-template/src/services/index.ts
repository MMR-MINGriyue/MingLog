/**
 * 服务层统一导出
 */

export * from './ModuleService'

// 重新导出常用类型和类
export type {
  IBaseEntity,
  IServiceConfig,
  IExampleEntity
} from './ModuleService'

export {
  BaseService,
  ExampleService
} from './ModuleService'
