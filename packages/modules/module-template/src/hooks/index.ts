/**
 * Hooks 统一导出
 */

export * from './useModuleData'
export * from './useModuleState'

// 重新导出常用类型和函数
export type {
  IDataState,
  IDataActions,
  IUseModuleDataConfig
} from './useModuleData'

export type {
  IPersistConfig
} from './useModuleState'

export {
  useModuleData
} from './useModuleData'

export {
  useModuleState,
  useBooleanState,
  useArrayState,
  useObjectState,
  useAsyncState
} from './useModuleState'
